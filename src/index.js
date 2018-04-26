class FirestoreSimple {
  constructor (db, collectionPath, mapping) {
    this.db = db
    this.collectionRef = this.db.collection(collectionPath)
    this.toDocMapping = mapping || {}
    this.toObjectMapping = FirestoreSimple._createSwapMapping(this.toDocMapping)
  }

  static _createSwapMapping (mapping) {
    let swapMap = {}
    Object.keys(mapping).forEach((key) => {
      swapMap[mapping[key]] = key
    })
    return swapMap
  }

  _toDoc (object) {
    let doc = {}
    Object.keys(object).forEach((key) => {
      const toDocKey = this.toDocMapping[key] || key
      doc[toDocKey] = object[key]
    })
    delete doc.id
    return doc
  }

  _toObject (docId, docData) {
    let object = {}
    object['id'] = docId
    Object.keys(docData).forEach((key) => {
      const toObjectKey = this.toObjectMapping[key] || key
      object[toObjectKey] = docData[key]
    })
    return object
  }

  async fetchCollection () {
    const snapshot = await this.collectionRef.get()
    let arr = []

    snapshot.forEach(doc => {
      arr.push(this._toObject(doc.id, doc.data()))
    })
    return arr
  }

  async fetchByQuery (query) {
    const snapshot = await query.get()
    let arr = []

    snapshot.forEach(doc => {
      arr.push(this._toObject(doc.id, doc.data()))
    })
    return arr
  }

  async fetchDocument (id) {
    const snapshot = await this.collectionRef.doc(id).get()
    if (!snapshot.exists) throw new Error(`No document id: ${id}`)

    return this._toObject(snapshot.id, snapshot.data())
  }

  async add (object) {
    const doc = this._toDoc(object)
    const docRef = await this.collectionRef.add(doc)
    return {
      id: docRef.id,
      ...doc,
    }
  }

  async set (object) {
    if (!object.id) throw new Error('Argument object must have "id" property')

    const docId = object.id
    const setDoc = this._toDoc(object)

    await this.collectionRef.doc(docId).set(setDoc)
    return object
  }

  async delete (docId) {
    await this.collectionRef.doc(docId).delete()
    return docId
  }

  async setMulti (objects) {
    const batch = this.db.batch()

    objects.forEach((object) => {
      const docId = object.id
      const setDoc = this._toDoc(object)
      batch.set(this.collectionRef.doc(docId), setDoc)
    })
    return batch.commit()
  }

  async deleteMulti (docIds) {
    const batch = this.db.batch()

    docIds.forEach((docId) => {
      batch.delete(this.collectionRef.doc(docId))
    })
    return batch.commit()
  }
}

module.exports = { FirestoreSimple }

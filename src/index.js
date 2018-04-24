class FirestoreSimple {
  constructor (db, collectionPath, mapping) {
    this.db = db
    this.collectionRef = this.db.collection(collectionPath)
    this.context = new OperationContext(this.db, this.collectionRef)
    this.serialize_mapping = mapping || {}
    this.deserialize_mapping = FirestoreSimple._createSwapMapping(this.serialize_mapping)
  }

  static _createSwapMapping (mapping) {
    let swapMap = {}
    Object.keys(mapping).forEach((key) => {
      swapMap[mapping[key]] = key
    })
    return swapMap
  }

  _serialize (object) {
    let doc = {}
    Object.keys(object).forEach((key) => {
      const serializedKey = this.serialize_mapping[key] || key
      doc[serializedKey] = object[key]
    })
    delete doc.id
    return doc
  }

  _deserialize (docId, docData) {
    let object = {}
    object['id'] = docId
    Object.keys(docData).forEach((key) => {
      const deserializedKey = this.deserialize_mapping[key] || key
      object[deserializedKey] = docData[key]
    })
    return object
  }

  async fetchCollection () {
    const snapshot = await this.collectionRef.get()
    let arr = []

    snapshot.forEach(doc => {
      arr.push(this._deserialize(doc.id, doc.data()))
    })
    return arr
  }

  async fetchByQuery (query) {
    const snapshot = await query.get()
    let arr = []

    snapshot.forEach(doc => {
      arr.push(this._deserialize(doc.id, doc.data()))
    })
    return arr
  }

  async fetchDocument (id) {
    const snapshot = await this.collectionRef.doc(id).get()
    if (!snapshot.exists) throw new Error(`No document id: ${id}`)

    return this._deserialize(snapshot.id, snapshot.data())
  }

  async add (object) {
    const doc = this._serialize(object)
    const docRef = await this.collectionRef.add(doc)
    return {
      id: docRef.id,
      ...doc,
    }
  }

  async set (object) {
    if (!object.id) throw new Error('Argument object must have "id" property')

    const docId = object.id
    const setDoc = this._serialize(object)

    await this.context.set(docId, setDoc)
    return object
  }

  async delete (docId) {
    await this.context.delete(docId)
    return docId
  }
}

class OperationContext {
  constructor (db, collectionRef) {
    this.db = db
    this.collectionRef = collectionRef
    this.batch = null
  }

  get isBatch () {
    return !!this.batch
  }

  batch () {
    this.batch = this.db.batch()
  }

  async commit () {
    return this.batch.commit()
  }

  async set (docId, doc) {
    const docRef = this.collectionRef.doc(docId)

    if (this.isBatch) {
      return this.batch.set(docRef, doc)
    }

    return docRef.set(doc)
  }

  async delete (docId) {
    const docRef = this.collectionRef.doc(docId)
    if (this.isBatch) {
      return this.batch.delete(docRef)
    }

    return docRef.delete()
  }
}

module.exports = { FirestoreSimple }

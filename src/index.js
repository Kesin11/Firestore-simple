class FirestoreSimple {
  constructor (db, collectionPath) {
    this.db = db
    this.collectionRef = this.db.collection(collectionPath)
  }

  async fetchCollection () {
    const snapshot = await this.collectionRef.get()
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

  _serialize (object) {
    let doc = {
      ...object,
    }
    delete doc.id
    return doc
  }

  _deserialize (docId, docData) {
    return {
      id: docId,
      ...docData,
    }
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

    await this.collectionRef.doc(docId).set(setDoc)
    return object
  }

  async delete (docId) {
    await this.collectionRef.doc(docId).delete()
    return docId
  }
}

module.exports = { FirestoreSimple }

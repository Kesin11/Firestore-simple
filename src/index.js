class FirestoreSimple {
  constructor (db, collectionPath) {
    this.db = db
    this.collectionRef = this.db.collection(collectionPath)
  }

  async fetchCollection () {
    const snapshot = await this.collectionRef.get()
    return this._createDocObjects(snapshot)
  }

  async fetchDocument (id) {
    const snapshot = await this.collectionRef.doc(id).get()
    if (!snapshot.exists) throw new Error(`No document id: ${id}`)

    return this._createDocObject(snapshot)
  }

  _createDocObjects (collection) {
    let arr = []
    collection.forEach(doc => arr.push(this._createDocObject(doc)))

    return arr
  }

  _createDocObject (doc) {
    return {
      id: doc.id,
      ...doc.data(),
    }
  }

  async add (doc) {
    const docRef = await this.collectionRef.add(doc)
    return {
      id: docRef.id,
      ...doc,
    }
  }

  async set (doc) {
    if (!doc.id) throw new Error('Argument doc must have "id" property')

    const docId = doc.id
    const setDoc = Object.assign({}, doc)
    delete setDoc.id

    await this.collectionRef.doc(docId).set(setDoc)
    return doc
  }

  async delete (docId) {
    await this.collectionRef.doc(docId).delete()
    return docId
  }
}

module.exports = { FirestoreSimple }

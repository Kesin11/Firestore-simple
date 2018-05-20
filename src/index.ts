import { firestore } from 'firebase-admin'
import { CollectionReference, Firestore, QuerySnapshot, Query, DocumentData, DocumentSnapshot } from '@google-cloud/firestore';

declare type Mapping = { [key: string]: string }
interface DocData {
  [extra: string]: any
}
interface DocObject {
  id: string,
  [extra: string]: any
}
// declare type DocObject = { id: string, [extra: string]: any}

export class FirestoreSimple {
  db: Firestore
  collectionRef: CollectionReference
  toDocMapping: Mapping
  toObjectMapping: Mapping

  constructor (db: Firestore, collectionPath: string, mapping: Mapping) {
    this.db = db
    this.collectionRef = this.db.collection(collectionPath)
    this.toDocMapping = mapping || {}
    this.toObjectMapping = FirestoreSimple._createSwapMapping(this.toDocMapping)
  }

  static _createSwapMapping (mapping: Mapping) {
    let swapMap: Mapping = {}
    Object.keys(mapping).forEach((key) => {
      swapMap[mapping[key]] = key
    })
    return swapMap
  }

  _toDoc (object: DocObject | DocData ) {
    let doc: DocData = {}
    Object.keys(object).forEach((key) => {
      const toDocKey = this.toDocMapping[key] || key
      doc[toDocKey] = object[key]
    })
    delete doc.id
    return doc
  }

  _toObject (docId: string, docData: DocData) {
    let object: DocObject = { id: docId }
    Object.keys(docData).forEach((key) => {
      const toObjectKey = this.toObjectMapping[key] || key
      object[toObjectKey] = docData[key]
    })
    return object
  }

  async fetchCollection () {
    const snapshot = await this.collectionRef.get()
    let arr: DocObject[] = []

    snapshot.forEach((doc: DocumentSnapshot) => {
      arr.push(this._toObject(doc.id, doc.data()))
    })
    return arr
  }

  async fetchByQuery (query: Query) {
    const snapshot = await query.get()
    let arr: DocObject[] = []

    snapshot.forEach((doc: DocumentSnapshot) => {
      arr.push(this._toObject(doc.id, doc.data()))
    })
    return arr
  }

  async fetchDocument (id: string) {
    const snapshot = await this.collectionRef.doc(id).get()
    if (!snapshot.exists) throw new Error(`No document id: ${id}`)

    return this._toObject(snapshot.id, snapshot.data())
  }

  async add (object: DocObject | DocData): Promise<DocObject> {
    const doc = this._toDoc(object)
    const docRef = await this.collectionRef.add(doc)
    return {
      id: docRef.id,
      ...object,
    }
  }

  async set (object: DocObject) {
    if (!object.id) throw new Error('Argument object must have "id" property')

    const docId = object.id
    const setDoc = this._toDoc(object)

    await this.collectionRef.doc(docId).set(setDoc)
    return object
  }

  async addOrSet (object: DocObject | DocData) {
    return (!object.id) ? this.add(object) : this.set(object as DocObject)
  }

  async delete (docId: string) {
    await this.collectionRef.doc(docId).delete()
    return docId
  }

  async bulkSet (objects: DocObject[]) {
    const batch = this.db.batch()

    objects.forEach((object) => {
      const docId = object.id
      const setDoc = this._toDoc(object)
      batch.set(this.collectionRef.doc(docId), setDoc)
    })
    return batch.commit()
  }

  async bulkDelete (docIds: string[]) {
    const batch = this.db.batch()

    docIds.forEach((docId: string) => {
      batch.delete(this.collectionRef.doc(docId))
    })
    return batch.commit()
  }
}
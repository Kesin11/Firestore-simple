import {
  CollectionReference,
  DocumentSnapshot,
  Firestore,
  Query,
} from '@google-cloud/firestore'

export declare interface IMapping { [key: string]: string }
export declare interface IDocData {
  [extra: string]: any
}
export declare interface IDocObject {
  id: string,
  [extra: string]: any
}
// declare type DocObject = { id: string, [extra: string]: any}

export class FirestoreSimple {
  public firestore: Firestore
  public collectionRef: CollectionReference
  public toDocMapping: IMapping
  public toObjectMapping: IMapping

  // tslint:disable-next-line:no-shadowed-variable
  constructor (firestore: Firestore, collectionPath: string, { mapping }: { mapping?: IMapping } = {}) {
    this.firestore = firestore
    this.collectionRef = this.firestore.collection(collectionPath)
    this.toDocMapping = (mapping !== undefined) ? mapping : {}
    this.toObjectMapping = FirestoreSimple._createSwapMapping(this.toDocMapping)
  }

  public static _createSwapMapping (mapping: IMapping) {
    const swapMap: IMapping = {}
    Object.keys(mapping).forEach((key) => {
      swapMap[mapping[key]] = key
    })
    return swapMap
  }

  public _toDoc (object: IDocObject | IDocData) {
    const doc: IDocData = {}
    Object.keys(object).forEach((key) => {
      const toDocKey = this.toDocMapping[key] || key
      doc[toDocKey] = object[key]
    })
    delete doc.id
    return doc
  }

  public _toObject (docId: string, docData: IDocData) {
    const object: IDocObject = { id: docId }
    Object.keys(docData).forEach((key) => {
      const toObjectKey = this.toObjectMapping[key] || key
      object[toObjectKey] = docData[key]
    })
    return object
  }

  public async fetchCollection () {
    const snapshot = await this.collectionRef.get()
    const arr: IDocObject[] = []

    snapshot.forEach((doc: DocumentSnapshot) => {
      arr.push(this._toObject(doc.id, doc.data() || {}))
    })
    return arr
  }

  public async fetchByQuery (query: Query) {
    const snapshot = await query.get()
    const arr: IDocObject[] = []

    snapshot.forEach((doc: DocumentSnapshot) => {
      arr.push(this._toObject(doc.id, doc.data() || {}))
    })
    return arr
  }

  public async fetchDocument (id: string) {
    const snapshot = await this.collectionRef.doc(id).get()
    if (!snapshot.exists) throw new Error(`No document id: ${id}`)

    return this._toObject(snapshot.id, snapshot.data() || {})
  }

  public async add (object: IDocObject | IDocData): Promise<IDocObject> {
    const doc = this._toDoc(object)
    const docRef = await this.collectionRef.add(doc)
    return {
      id: docRef.id,
      ...object,
    }
  }

  public async set (object: IDocObject) {
    if (!object.id) throw new Error('Argument object must have "id" property')

    const docId = object.id
    const setDoc = this._toDoc(object)

    await this.collectionRef.doc(docId).set(setDoc)
    return object
  }

  public async addOrSet (object: IDocObject | IDocData) {
    return (!object.id) ? this.add(object) : this.set(object as IDocObject)
  }

  public async delete (docId: string) {
    await this.collectionRef.doc(docId).delete()
    return docId
  }

  public async bulkSet (objects: IDocObject[]) {
    const batch = this.firestore.batch()

    objects.forEach((object) => {
      const docId = object.id
      const setDoc = this._toDoc(object)
      batch.set(this.collectionRef.doc(docId), setDoc)
    })
    return batch.commit()
  }

  public async bulkDelete (docIds: string[]) {
    const batch = this.firestore.batch()

    docIds.forEach((docId: string) => {
      batch.delete(this.collectionRef.doc(docId))
    })
    return batch.commit()
  }
}

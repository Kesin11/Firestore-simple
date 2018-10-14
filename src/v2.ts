import {
  CollectionReference,
  DocumentSnapshot,
  Firestore,
  Query,
} from '@google-cloud/firestore'

// memo: <T, U>としてfirestoreに保存するときのスキーマを指定させてもいいかもしれない
// memo: Tだけどid?を持っていることは保証したい、という型を付ける
// memo: IDocDataはidというプロパティを持っていない、という型の表現をしたい
class FirestoreSimpleV2<T> {
  public firestore: Firestore
  public collectionRef: CollectionReference
  public encode?: (obj: T) => IDocData
  public decode?: (doc: IDocData) => T

  constructor ({ firestore, path, encode, decode }: {
    firestore: Firestore,
    path: string,
    encode?: (obj: T) => IDocData,
    decode?: (doc: IDocData) => T,
  }) {
    this.firestore = firestore,
    this.collectionRef = this.firestore.collection(path)
    this.encode = encode
    this.decode = decode
  }

  public toObject (docId: string, docData: IDocData): T {
    // const object: IDocObject = { id: docId }
    // Object.keys(docData).forEach((key) => {
    //   object[key] = docData[key]
    // })
    const obj = { id: docId, ...docData }
    if (!this.decode) return obj as unknown as T
    return this.decode(obj)
  }

  public toDoc (obj: T) {
    const doc = (this.encode) ? this.encode(obj) : Object.assign({}, obj)
    delete doc.id
    return doc
  }

  public async fetchDocument (id: string): Promise < T > {
    const snapshot = await this.collectionRef.doc(id).get()
    if (!snapshot.exists) throw new Error(`No document id: ${id}`)

    return this.toObject(snapshot.id, snapshot.data() || {}),
  }

  // TODO: addとsetでidの有無をちゃんと判定する型の定義を書く必要がある
  // いい感じに計算してTからidだけを取り除いたりできないだろうか？
  public async set (obj: T) {
    if (!obj.id) throw new Error('Argument object must have "id" property')

    const docId = obj.id
    const setDoc = this.toDoc(obj)

    await this.collectionRef.doc(docId).set(setDoc)
    return obj
  }
}

interface User {
  id?: string
  name: string,
  createdAt: Date
}
const firestore = {} as Firestore
const userDao = new FirestoreSimpleV2<User>({ firestore, path: 'user',
  encode: (user: User) => {
    return {
      name: user.name,
      created_at: user.createdAt,
    }
  },
  decode: (obj) => {
    return {
      id: obj.id,
      name: obj.name,
      createdAt: obj.created_at,
    }
  },
})
const user = await userDao.fetchDocument('1')
await userDao.set({ id: '1', name: 'bob', createdAt: new Date() })

// -----end v2

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

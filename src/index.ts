import {
  CollectionReference,
  DocumentReference,
  DocumentSnapshot,
  Firestore,
  Query,
  QuerySnapshot,
} from '@google-cloud/firestore'
import { Assign } from 'utility-types'

type HasId = { id: string }
type HasIdObject = { id: string, [key: string]: any }
type NullableId = { id?: string }
export type Encodable<T extends HasId> = (obj: Assign<T, NullableId>) => FirebaseFirestore.DocumentData
export type Decodable<T extends HasId> = (doc: HasIdObject) => T

interface Context {
  firestore: Firestore,
  tx?: FirebaseFirestore.Transaction
}

export class FirestoreSimple {
  public context: Context
  constructor (firestore: Firestore) {
    this.context = { firestore, tx: undefined }
  }
  public collection<T extends HasId> ({ path, encode, decode }: {
    path: string,
    encode?: Encodable<T>,
    decode?: Decodable<T>,
  }) {
    const factory = new CollectionFactory<T>({
      context: this.context,
      encode,
      decode,
    })
    return factory.create(path)
  }

  public collectionFactory<T extends HasId> ({ encode, decode }: {
    encode?: Encodable<T>,
    decode?: Decodable<T>,
  }) {
    return new CollectionFactory<T>({
      context: this.context,
      encode,
      decode,
    })
  }

  public async runTransaction (updateFunction: (tx: FirebaseFirestore.Transaction) => Promise<any>) {
    await this.context.firestore.runTransaction(async (tx) => {
      this.context.tx = tx
      await updateFunction(tx)
    })
    this.context.tx = undefined
  }
}

class CollectionFactory<T extends HasId> {
  public context: Context
  public encode?: Encodable<T>
  public decode?: Decodable<T>

  constructor ({ context, encode, decode }: {
    context: Context
    encode?: Encodable<T>,
    decode?: Decodable<T>,
  }) {
    this.context = context
    this.encode = encode
    this.decode = decode
  }

  public create (path: string) {
    return new FirestoreSimpleCollection<T>({
      context: this.context,
      path,
      encode: this.encode,
      decode: this.decode,
    })
  }
}

export class FirestoreSimpleCollection<T extends HasId> {
  public context: Context
  public collectionRef: CollectionReference
  public encode?: Encodable<T>
  public decode?: Decodable<T>

  constructor ({ context, path, encode, decode }: {
    context: Context
    path: string,
    encode?: Encodable<T>,
    decode?: Decodable<T>,
  }) {
    this.context = context
    this.collectionRef = context.firestore.collection(path)
    this.encode = encode
    this.decode = decode
  }

  private _decode (doc: HasIdObject): T {
    if (this.decode) return this.decode(doc)
    return doc as T
  }

  private _encode (obj: T | Assign<T, NullableId>) {
    if (this.encode) return this.encode(obj)
    return Object.assign({}, obj)
  }

  private _toDoc (obj: T | Assign<T, NullableId>) {
    const doc = this._encode(obj)
    if (doc.id) delete doc.id
    return doc
  }

  public toObject (documentSnapshot: DocumentSnapshot): T {
    const obj = { id: documentSnapshot.id, ...documentSnapshot.data() }
    return this._decode(obj)
  }

  public docRef (id?: string) {
    if (id) return this.collectionRef.doc(id)
    return this.collectionRef.doc()
  }

  public async fetch (id: string): Promise <T | undefined> {
    const docRef = this.docRef(id)
    const snapshot = (this.context.tx)
      ? await this.context.tx.get(docRef)
      : await docRef.get()
    if (!snapshot.exists) return undefined

    return this.toObject(snapshot)
  }

  // for v1 API compatibility
  // @deprecated
  public async fetchDocument (id: string): Promise<T | undefined> {
    return this.fetch(id)
  }

  public async fetchAll (): Promise<T[]> {
    const snapshot = (this.context.tx)
      ? await this.context.tx.get(this.collectionRef)
      : await this.collectionRef.get()
    const arr: T[] = []

    snapshot.forEach((documentSnapshot) => {
      arr.push(this.toObject(documentSnapshot))
    })
    return arr
  }

  // for v1 API compatibility
  // @deprecated
  public async fetchCollection (): Promise<T[]> {
    return this.fetchAll()
  }

  public async add (obj: Assign<T, NullableId>) {
    let docRef: DocumentReference
    const doc = this._toDoc(obj)

    if (this.context.tx) {
      docRef = this.docRef()
      await this.context.tx.set(docRef, doc)
    } else {
      docRef = await this.collectionRef.add(doc)
    }
    return docRef.id
  }

  public async set (obj: T) {
    if (!obj.id) throw new Error('Argument object must have "id" property')

    const docRef = this.docRef(obj.id)
    const setDoc = this._toDoc(obj)

    if (this.context.tx) {
      await this.context.tx.set(docRef, setDoc)
    } else {
      await docRef.set(setDoc)
    }
    return obj.id
  }

  public addOrSet (obj: Assign<T, NullableId> | T) {
    if ('id' in obj && typeof obj.id === 'string') {
      return this.set(obj as T)
    }
    return this.add(obj as Assign<T, NullableId>)
  }

  public async delete (id: string) {
    const docRef = this.docRef(id)
    if (this.context.tx) {
      await this.context.tx.delete(docRef)
    } else {
      await docRef.delete()
    }
    return id
  }

  public async bulkSet (objects: T[]) {
    const batch = this.context.firestore.batch()

    objects.forEach((obj) => {
      const docId = obj.id
      const setDoc = this._toDoc(obj)
      batch.set(this.collectionRef.doc(docId), setDoc)
    })
    return batch.commit()
  }

  public async bulkDelete (docIds: string[]) {
    const batch = this.context.firestore.batch()

    docIds.forEach((docId) => {
      batch.delete(this.collectionRef.doc(docId))
    })
    return batch.commit()
  }

  public async fetchByQuery (query: Query) {
    const snapshot = (this.context.tx)
      ? await this.context.tx.get(query)
      : await query.get()
    const arr: T[] = []

    snapshot.forEach((documentSnapshot) => {
      arr.push(this.toObject(documentSnapshot))
    })
    return arr
  }

  public where (fieldPath: string | FirebaseFirestore.FieldPath, opStr: FirebaseFirestore.WhereFilterOp, value: any) {
    const query = new FirestoreSimpleQuery<T>(this)
    return query.where(fieldPath, opStr, value)
  }

  public orderBy (fieldPath: string | FirebaseFirestore.FieldPath, directionStr?: FirebaseFirestore.OrderByDirection) {
    const query = new FirestoreSimpleQuery<T>(this)
    return query.orderBy(fieldPath, directionStr)
  }

  public limit (limit: number) {
    const query = new FirestoreSimpleQuery<T>(this)
    return query.limit(limit)
  }

  public onSnapshot (callback: (
    querySnapshot: QuerySnapshot,
    toObject: (documentSnapshot: DocumentSnapshot) => T,
    ) => void) {
    return this.collectionRef.onSnapshot((_querySnapshot) => {
      callback(_querySnapshot, this.toObject.bind(this))
    })
  }
}

class FirestoreSimpleQuery<T extends HasId> {
  public query?: Query = undefined
  constructor (public collection: FirestoreSimpleCollection<T>) { }

  public where (fieldPath: string | FirebaseFirestore.FieldPath, opStr: FirebaseFirestore.WhereFilterOp, value: any) {
    if (!this.query) {
      this.query = this.collection.collectionRef.where(fieldPath, opStr, value)
    } else {
      this.query = this.query.where(fieldPath, opStr, value)
    }
    return this
  }

  public orderBy (fieldPath: string | FirebaseFirestore.FieldPath, directionStr?: FirebaseFirestore.OrderByDirection) {
    if (!this.query) {
      this.query = this.collection.collectionRef.orderBy(fieldPath, directionStr)
    } else {
      this.query = this.query.orderBy(fieldPath, directionStr)
    }
    return this
  }

  public limit (limit: number) {
    if (!this.query) {
      this.query = this.collection.collectionRef.limit(limit)
    } else {
      this.query = this.query.limit(limit)
    }
    return this
  }

  public async fetch () {
    if (!this.query) throw new Error('no query statement before fetch()')

    return this.collection.fetchByQuery(this.query)
  }

  public onSnapshot (callback: (
    querySnapshot: QuerySnapshot,
    toObject: (documentSnapshot: DocumentSnapshot) => T,
    ) => void) {
    if (!this.query) throw new Error('no query statement before onSnapshot()')
    return this.query.onSnapshot((_querySnapshot) => {
      callback(_querySnapshot, this.collection.toObject.bind(this.collection))
    })
  }
}

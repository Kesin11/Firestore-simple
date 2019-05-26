import {
  CollectionReference,
  DocumentReference,
  DocumentSnapshot,
  FieldValue,
  Firestore,
  Query,
  QuerySnapshot,
} from '@google-cloud/firestore'
import { Optional } from 'utility-types'

type HasId = { id: string }
type HasIdObject = { id: string, [key: string]: any }
// Accpet original type and Firestore.FieldValue without 'id' property
type Storable<T> = { [P in keyof T]: P extends 'id' ? T[P] : T[P] | FieldValue }
// Convert 'id' property to optional type
type HasSameKeyObject<T> = { [P in keyof T]: any }
type OptionalIdStorable<T extends HasId> = Optional<Storable<T>, 'id'>
export type Encodable<T extends HasId, S = FirebaseFirestore.DocumentData> = (obj: OptionalIdStorable<T>) => Storable<S>
export type Decodable<T extends HasId, S = HasIdObject> = (doc: HasSameKeyObject<S> & HasId) => T

interface Context {
  firestore: Firestore,
  tx?: FirebaseFirestore.Transaction
}

export class FirestoreSimple {
  public context: Context
  constructor (firestore: Firestore) {
    this.context = { firestore, tx: undefined }
  }
  public collection<T extends HasId, S = T> ({ path, encode, decode }: {
    path: string,
    encode?: Encodable<T, S>,
    decode?: Decodable<T, S>,
  }) {
    const factory = new CollectionFactory<T, S>({
      context: this.context,
      encode,
      decode,
    })
    return factory.create(path)
  }

  public collectionFactory<T extends HasId, S = T> ({ encode, decode }: {
    encode?: Encodable<T, S>,
    decode?: Decodable<T, S>,
  }) {
    return new CollectionFactory<T, S>({
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

class CollectionFactory<T extends HasId, S = T> {
  public context: Context
  public encode?: Encodable<T, S>
  public decode?: Decodable<T, S>

  constructor ({ context, encode, decode }: {
    context: Context
    encode?: Encodable<T, S>,
    decode?: Decodable<T, S>,
  }) {
    this.context = context
    this.encode = encode
    this.decode = decode
  }

  public create (path: string) {
    return new FirestoreSimpleCollection<T, S>({
      context: this.context,
      path,
      encode: this.encode,
      decode: this.decode,
    })
  }
}

export class FirestoreSimpleCollection<T extends HasId, S = T> {
  public context: Context
  public collectionRef: CollectionReference
  public encode?: Encodable<T, S>
  public decode?: Decodable<T, S>

  constructor ({ context, path, encode, decode }: {
    context: Context
    path: string,
    encode?: Encodable<T, S>,
    decode?: Decodable<T, S>,
  }) {
    this.context = context
    this.collectionRef = context.firestore.collection(path)
    this.encode = encode
    this.decode = decode
  }

  private _decode (doc: HasSameKeyObject<S> & HasId) {
    if (this.decode) return this.decode(doc)
    return doc as T
  }

  private _encode (obj: OptionalIdStorable<T>) {
    if (this.encode) return this.encode(obj)
    return Object.assign({}, obj)
  }

  private _toDoc (obj: OptionalIdStorable<T>) {
    const doc = this._encode(obj)
    if ('id' in doc) delete doc.id
    return doc
  }

  public toObject (documentSnapshot: DocumentSnapshot) {
    const obj = { id: documentSnapshot.id, ...documentSnapshot.data() }
    return this._decode(obj as HasSameKeyObject<S> & HasId)
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

  /**
   * for v1 API compatibility
   * @deprecated 3.0 Use {@link FirestoreSimpleCollection#fetch} instead.
   */
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

  /**
   * for v1 API compatibility
   * @deprecated 3.0 Use {@link FirestoreSimpleCollection#fetchAll} instead.
   */
  public async fetchCollection (): Promise<T[]> {
    return this.fetchAll()
  }

  public async add (obj: OptionalIdStorable<T>) {
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

  public async set (obj: Storable<T>) {
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

  public addOrSet (obj: OptionalIdStorable<T>) {
    if ('id' in obj) {
      return this.set(obj as Storable<T>)
    }
    return this.add(obj)
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

  public async bulkSet (objects: Array<Storable<T>>) {
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
    const query = new FirestoreSimpleQuery<T, S>(this)
    return query.where(fieldPath, opStr, value)
  }

  public orderBy (fieldPath: string | FirebaseFirestore.FieldPath, directionStr?: FirebaseFirestore.OrderByDirection) {
    const query = new FirestoreSimpleQuery<T, S>(this)
    return query.orderBy(fieldPath, directionStr)
  }

  public limit (limit: number) {
    const query = new FirestoreSimpleQuery<T, S>(this)
    return query.limit(limit)
  }

  public onSnapshot (callback: (
    querySnapshot: QuerySnapshot,
    toObject: (documentSnapshot: DocumentSnapshot) => T
    ) => void) {
    return this.collectionRef.onSnapshot((_querySnapshot) => {
      callback(_querySnapshot, this.toObject.bind(this))
    })
  }
}

class FirestoreSimpleQuery<T extends HasId, S = T> {
  public query?: Query = undefined
  constructor (public collection: FirestoreSimpleCollection<T, S>) { }

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

  public startAt (snapshot: DocumentSnapshot): FirestoreSimpleQuery<T, S>
  public startAt (...fieldValues: any[]): FirestoreSimpleQuery<T, S>
  public startAt (
    snapshotOrValue: DocumentSnapshot | unknown,
    ...fieldValues: unknown[]
  ) {
    if (!this.query) throw new Error('no query statement before startAt()')

    if (snapshotOrValue instanceof DocumentSnapshot) {
      this.query = this.query.startAt(snapshotOrValue)
    } else {
      this.query = this.query.startAt(snapshotOrValue, ...fieldValues)
    }
    return this
  }

  public startAfter (snapshot: DocumentSnapshot): FirestoreSimpleQuery<T, S>
  public startAfter (...fieldValues: any[]): FirestoreSimpleQuery<T, S>
  public startAfter (
    snapshotOrValue: DocumentSnapshot | unknown,
    ...fieldValues: unknown[]
  ) {
    if (!this.query) throw new Error('no query statement before startAfter()')

    if (snapshotOrValue instanceof DocumentSnapshot) {
      this.query = this.query.startAfter(snapshotOrValue)
    } else {
      this.query = this.query.startAfter(snapshotOrValue, ...fieldValues)
    }
    return this
  }

  public endAt (snapshot: DocumentSnapshot): FirestoreSimpleQuery<T, S>
  public endAt (...fieldValues: any[]): FirestoreSimpleQuery<T, S>
  public endAt (
    snapshotOrValue: DocumentSnapshot | unknown,
    ...fieldValues: unknown[]
  ) {
    if (!this.query) throw new Error('no query statement before endAt()')

    if (snapshotOrValue instanceof DocumentSnapshot) {
      this.query = this.query.endAt(snapshotOrValue)
    } else {
      this.query = this.query.endAt(snapshotOrValue, ...fieldValues)
    }
    return this
  }

  public endBefore (snapshot: DocumentSnapshot): FirestoreSimpleQuery<T, S>
  public endBefore (...fieldValues: any[]): FirestoreSimpleQuery<T, S>
  public endBefore (
    snapshotOrValue: DocumentSnapshot | unknown,
    ...fieldValues: unknown[]
  ) {
    if (!this.query) throw new Error('no query statement before endBefore()')

    if (snapshotOrValue instanceof DocumentSnapshot) {
      this.query = this.query.endBefore(snapshotOrValue)
    } else {
      this.query = this.query.endBefore(snapshotOrValue, ...fieldValues)
    }
    return this
  }

  public async fetch () {
    if (!this.query) throw new Error('no query statement before fetch()')

    return this.collection.fetchByQuery(this.query)
  }

  public onSnapshot (callback: (
    querySnapshot: QuerySnapshot,
    toObject: (documentSnapshot: DocumentSnapshot) => T
    ) => void) {
    if (!this.query) throw new Error('no query statement before onSnapshot()')
    return this.query.onSnapshot((_querySnapshot) => {
      callback(_querySnapshot, this.collection.toObject.bind(this.collection))
    })
  }
}

import {
  CollectionReference,
  DocumentReference,
  DocumentSnapshot,
  FieldValue,
  Firestore,
  Query,
  QuerySnapshot,
} from '@google-cloud/firestore'
import { Omit, Optional } from 'utility-types'

type HasId = { id: string }
type HasIdObject = { id: string, [key: string]: any }
// Accpet original type and Firestore.FieldValue without 'id' property
type Storable<T> = { [P in keyof T]: P extends 'id' ? T[P] : T[P] | FieldValue }
// Storable but only 'id' is optional
type OptionalIdStorable<T extends HasId> = Optional<Storable<T>, 'id'>
// Storable but all keys exclude 'id' are optional
type PartialStorable<T extends HasId> = Partial<Storable<T>> & HasId

type HasSameKeyObject<T> = { [P in keyof T]: any }
type QueryKey<T> = { [K in keyof T]: K }[keyof T] | FirebaseFirestore.FieldPath
// Convert 'id' property to optional type
type OmitId<T> = Omit<T, 'id'>
export type Encodable<T extends HasId, S = FirebaseFirestore.DocumentData> = (obj: OptionalIdStorable<T>) => Storable<S>
export type Decodable<T extends HasId, S = HasIdObject> = (doc: HasSameKeyObject<S> & HasId) => T

interface Context {
  firestore: Firestore,
  tx?: FirebaseFirestore.Transaction,
}

export class FirestoreSimple {
  context: Context
  constructor (firestore: Firestore) {
    this.context = { firestore, tx: undefined }
  }

  collection<T extends HasId, S = OmitId<T>> ({ path, encode, decode }: {
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

  collectionFactory<T extends HasId, S = OmitId<T>> ({ encode, decode }: {
    encode?: Encodable<T, S>,
    decode?: Decodable<T, S>,
  }) {
    return new CollectionFactory<T, S>({
      context: this.context,
      encode,
      decode,
    })
  }

  async runTransaction (updateFunction: (tx: FirebaseFirestore.Transaction) => Promise<any>) {
    await this.context.firestore.runTransaction(async (tx) => {
      this.context.tx = tx
      await updateFunction(tx)
    })
    this.context.tx = undefined
  }
}

class CollectionFactory<T extends HasId, S = OmitId<T>> {
  context: Context
  encode?: Encodable<T, S>
  decode?: Decodable<T, S>

  constructor ({ context, encode, decode }: {
    context: Context,
    encode?: Encodable<T, S>,
    decode?: Decodable<T, S>,
  }) {
    this.context = context
    this.encode = encode
    this.decode = decode
  }

  create (path: string) {
    return new FirestoreSimpleCollection<T, S>({
      context: this.context,
      path,
      encode: this.encode,
      decode: this.decode,
    })
  }
}

export class FirestoreSimpleCollection<T extends HasId, S = OmitId<T>> {
  context: Context
  collectionRef: CollectionReference
  encode?: Encodable<T, S>
  decode?: Decodable<T, S>

  constructor ({ context, path, encode, decode }: {
    context: Context,
    path: string,
    encode?: Encodable<T, S>,
    decode?: Decodable<T, S>,
  }) {
    this.context = context
    this.collectionRef = context.firestore.collection(path)
    this.encode = encode
    this.decode = decode
  }

  private _decode (documentSnapshot: DocumentSnapshot): T {
    const obj = { id: documentSnapshot.id, ...documentSnapshot.data() }
    if (this.decode) return this.decode(obj as S & HasId)

    return obj as T
  }

  private _encode (obj: OptionalIdStorable<T>): Optional<Storable<T>, 'id'> | Storable<S> {
    if (this.encode) return this.encode(obj)

    const doc = { ...obj }
    if ('id' in doc) delete doc.id
    return doc
  }

  toObject (documentSnapshot: DocumentSnapshot): T {
    return this._decode(documentSnapshot)
  }

  docRef (id?: string) {
    if (id) return this.collectionRef.doc(id)
    return this.collectionRef.doc()
  }

  async fetch (id: string): Promise <T | undefined> {
    const docRef = this.docRef(id)
    const snapshot = (this.context.tx)
      ? await this.context.tx.get(docRef)
      : await docRef.get()
    if (!snapshot.exists) return undefined

    return this.toObject(snapshot)
  }

  async fetchAll (): Promise<T[]> {
    const snapshot = (this.context.tx)
      ? await this.context.tx.get(this.collectionRef)
      : await this.collectionRef.get()
    const arr: T[] = []

    snapshot.forEach((documentSnapshot) => {
      arr.push(this.toObject(documentSnapshot))
    })
    return arr
  }

  async add (obj: OptionalIdStorable<T>) {
    let docRef: DocumentReference
    const doc = this._encode(obj)

    if (this.context.tx) {
      docRef = this.docRef()
      await this.context.tx.set(docRef, doc)
    } else {
      docRef = await this.collectionRef.add(doc)
    }
    return docRef.id
  }

  async set (obj: Storable<T>) {
    if (!obj.id) throw new Error('Argument object must have "id" property')

    const docRef = this.docRef(obj.id)
    const setDoc = this._encode(obj)

    if (this.context.tx) {
      await this.context.tx.set(docRef, setDoc)
    } else {
      await docRef.set(setDoc)
    }
    return obj.id
  }

  addOrSet (obj: OptionalIdStorable<T>) {
    if ('id' in obj) {
      return this.set(obj as Storable<T>)
    }
    return this.add(obj)
  }

  async update (obj: PartialStorable<T>) {
    if (!obj.id) throw new Error('Argument object must have "id" property')

    const docRef = this.docRef(obj.id)
    const updateDoc = Object.assign({}, obj)
    delete updateDoc.id

    if (this.context.tx) {
      await this.context.tx.update(docRef, updateDoc)
    } else {
      await docRef.update(updateDoc)
    }
    return obj.id
  }

  async delete (id: string) {
    const docRef = this.docRef(id)
    if (this.context.tx) {
      await this.context.tx.delete(docRef)
    } else {
      await docRef.delete()
    }
    return id
  }

  async bulkSet (objects: Array<Storable<T>>) {
    const batch = this.context.firestore.batch()

    objects.forEach((obj) => {
      const docId = obj.id
      const setDoc = this._encode(obj)
      batch.set(this.collectionRef.doc(docId), setDoc)
    })
    return batch.commit()
  }

  async bulkDelete (docIds: string[]) {
    const batch = this.context.firestore.batch()

    docIds.forEach((docId) => {
      batch.delete(this.collectionRef.doc(docId))
    })
    return batch.commit()
  }

  async fetchByQuery (query: Query) {
    const snapshot = (this.context.tx)
      ? await this.context.tx.get(query)
      : await query.get()
    const arr: T[] = []

    snapshot.forEach((documentSnapshot) => {
      arr.push(this.toObject(documentSnapshot))
    })
    return arr
  }

  where (fieldPath: QueryKey<S>, opStr: FirebaseFirestore.WhereFilterOp, value: any) {
    const query = new FirestoreSimpleQuery<T, S>(this)
    return query.where(fieldPath, opStr, value)
  }

  orderBy (fieldPath: QueryKey<S>, directionStr?: FirebaseFirestore.OrderByDirection) {
    const query = new FirestoreSimpleQuery<T, S>(this)
    return query.orderBy(fieldPath, directionStr)
  }

  limit (limit: number) {
    const query = new FirestoreSimpleQuery<T, S>(this)
    return query.limit(limit)
  }

  onSnapshot (callback: (
    querySnapshot: QuerySnapshot,
    toObject: (documentSnapshot: DocumentSnapshot) => T
    ) => void) {
    return this.collectionRef.onSnapshot((_querySnapshot) => {
      callback(_querySnapshot, this.toObject.bind(this))
    })
  }
}

class FirestoreSimpleQuery<T extends HasId, S> {
  query?: Query = undefined
  constructor (public collection: FirestoreSimpleCollection<T, S>) { }

  where (fieldPath: QueryKey<S>, opStr: FirebaseFirestore.WhereFilterOp, value: any) {
    const _fieldPath = fieldPath as string | FirebaseFirestore.FieldPath
    if (!this.query) {
      this.query = this.collection.collectionRef.where(_fieldPath, opStr, value)
    } else {
      this.query = this.query.where(_fieldPath, opStr, value)
    }
    return this
  }

  orderBy (fieldPath: QueryKey<S>, directionStr?: FirebaseFirestore.OrderByDirection) {
    const _fieldPath = fieldPath as string | FirebaseFirestore.FieldPath
    if (!this.query) {
      this.query = this.collection.collectionRef.orderBy(_fieldPath, directionStr)
    } else {
      this.query = this.query.orderBy(_fieldPath, directionStr)
    }
    return this
  }

  limit (limit: number) {
    if (!this.query) {
      this.query = this.collection.collectionRef.limit(limit)
    } else {
      this.query = this.query.limit(limit)
    }
    return this
  }

  startAt (snapshot: DocumentSnapshot): FirestoreSimpleQuery<T, S>
  startAt (...fieldValues: any[]): FirestoreSimpleQuery<T, S>
  startAt (
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

  startAfter (snapshot: DocumentSnapshot): FirestoreSimpleQuery<T, S>
  startAfter (...fieldValues: any[]): FirestoreSimpleQuery<T, S>
  startAfter (
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

  endAt (snapshot: DocumentSnapshot): FirestoreSimpleQuery<T, S>
  endAt (...fieldValues: any[]): FirestoreSimpleQuery<T, S>
  endAt (
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

  endBefore (snapshot: DocumentSnapshot): FirestoreSimpleQuery<T, S>
  endBefore (...fieldValues: any[]): FirestoreSimpleQuery<T, S>
  endBefore (
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

  async fetch () {
    if (!this.query) throw new Error('no query statement before fetch()')

    return this.collection.fetchByQuery(this.query)
  }

  onSnapshot (callback: (
    querySnapshot: QuerySnapshot,
    toObject: (documentSnapshot: DocumentSnapshot) => T
    ) => void) {
    if (!this.query) throw new Error('no query statement before onSnapshot()')
    return this.query.onSnapshot((_querySnapshot) => {
      callback(_querySnapshot, this.collection.toObject.bind(this.collection))
    })
  }
}

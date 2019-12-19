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

class Context {
  firestore: Firestore
  private _tx?: FirebaseFirestore.Transaction = undefined
  private _batch?: FirebaseFirestore.WriteBatch = undefined
  constructor (firestore: Firestore) {
    this.firestore = firestore
  }

  get tx (): FirebaseFirestore.Transaction | undefined {
    return this._tx
  }

  set tx (_tx: FirebaseFirestore.Transaction | undefined) {
    if (_tx === undefined) {
      this._tx = _tx
      return
    }
    if (this._tx || this._batch) throw new Error('Disallow nesting transaction or batch')
    this._tx = _tx
  }

  get batch (): FirebaseFirestore.WriteBatch | undefined {
    return this._batch
  }

  set batch (_batch: FirebaseFirestore.WriteBatch | undefined) {
    if (_batch === undefined) {
      this._batch = _batch
      return
    }
    if (this._tx || this._batch) throw new Error('Disallow nesting transaction or batch')
    this._batch = _batch
  }
}

export class FirestoreSimple {
  context: Context
  constructor (firestore: Firestore) {
    this.context = new Context(firestore)
  }

  collection<T extends HasId, S = OmitId<T>> ({ path, encode, decode }: {
    path: string,
    encode?: Encodable<T, S>,
    decode?: Decodable<T, S>,
  }): FirestoreSimpleCollection<T, S> {
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
  }): CollectionFactory<T, S> {
    return new CollectionFactory<T, S>({
      context: this.context,
      encode,
      decode,
    })
  }

  collectionGroup<T extends HasId, S = OmitId<T>> ({ collectionId, decode }: {
    collectionId: string,
    decode?: Decodable<T, S>,
  }): FirestoreSimpleQuery<T, S> {
    const query = this.context.firestore.collectionGroup(collectionId)
    const converter = new FirestoreSimpleConverter({ decode })
    return new FirestoreSimpleQuery<T, S>(converter, this.context, query)
  }

  async runTransaction (updateFunction: (tx: FirebaseFirestore.Transaction) => Promise<any>): Promise<void> {
    await this.context.firestore.runTransaction(async (tx) => {
      this.context.tx = tx
      await updateFunction(tx)
    })
    this.context.tx = undefined
  }

  async runBatch (updateFunction: (batch: FirebaseFirestore.WriteBatch) => Promise<any>): Promise<void> {
    const _batch = this.context.firestore.batch()
    this.context.batch = _batch

    await updateFunction(_batch)
    await this.context.batch.commit()

    this.context.batch = undefined
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

  create (path: string): FirestoreSimpleCollection<T, S> {
    return new FirestoreSimpleCollection<T, S>({
      context: this.context,
      path,
      encode: this.encode,
      decode: this.decode,
    })
  }
}

class FirestoreSimpleConverter<T extends HasId, S = OmitId<T>> {
  private _encode?: Encodable<T, S>
  private _decode?: Decodable<T, S>

  constructor ({ encode, decode }: {
    encode?: Encodable<T, S>,
    decode?: Decodable<T, S>,
  }) {
    this._encode = encode
    this._decode = decode
  }

  decode (documentSnapshot: DocumentSnapshot): T {
    const obj = { id: documentSnapshot.id, ...documentSnapshot.data() }
    if (this._decode) return this._decode(obj as S & HasId)

    return obj as T
  }

  encode (obj: OptionalIdStorable<T>): Optional<Storable<T>, 'id'> | Storable<S> {
    if (this._encode) return this._encode(obj)

    const doc = { ...obj }
    if ('id' in doc) delete doc.id
    return doc
  }
}

export class FirestoreSimpleCollection<T extends HasId, S = OmitId<T>> {
  context: Context
  collectionRef: CollectionReference
  private converter: FirestoreSimpleConverter<T, S>

  constructor ({ context, path, encode, decode }: {
    context: Context,
    path: string,
    encode?: Encodable<T, S>,
    decode?: Decodable<T, S>,
  }) {
    this.context = context
    this.collectionRef = context.firestore.collection(path)
    this.converter = new FirestoreSimpleConverter({ encode, decode })
  }

  toObject (documentSnapshot: DocumentSnapshot): T {
    return this.converter.decode(documentSnapshot)
  }

  docRef (id?: string): DocumentReference {
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

  async add (obj: OptionalIdStorable<T>): Promise<string> {
    let docRef: DocumentReference
    const doc = this.converter.encode(obj)

    if (this.context.tx) {
      docRef = this.docRef()
      this.context.tx.set(docRef, doc)
    } else if (this.context.batch) {
      docRef = this.docRef()
      this.context.batch.set(docRef, doc)
    } else {
      docRef = await this.collectionRef.add(doc)
    }
    return docRef.id
  }

  async set (obj: Storable<T>): Promise<string> {
    if (!obj.id) throw new Error('Argument object must have "id" property')

    const docRef = this.docRef(obj.id)
    const setDoc = this.converter.encode(obj)

    if (this.context.tx) {
      this.context.tx.set(docRef, setDoc)
    } else if (this.context.batch) {
      this.context.batch.set(docRef, setDoc)
    } else {
      await docRef.set(setDoc)
    }
    return obj.id
  }

  addOrSet (obj: OptionalIdStorable<T>): Promise<string> {
    if ('id' in obj) {
      return this.set(obj as Storable<T>)
    }
    return this.add(obj)
  }

  async update (obj: PartialStorable<T>): Promise<string> {
    if (!obj.id) throw new Error('Argument object must have "id" property')

    const docRef = this.docRef(obj.id)
    const updateDoc = Object.assign({}, obj)
    delete updateDoc.id

    if (this.context.tx) {
      this.context.tx.update(docRef, updateDoc)
    } else if (this.context.batch) {
      this.context.batch.update(docRef, updateDoc)
    } else {
      await docRef.update(updateDoc)
    }
    return obj.id
  }

  async delete (id: string): Promise<string> {
    const docRef = this.docRef(id)
    if (this.context.tx) {
      this.context.tx.delete(docRef)
    } else if (this.context.batch) {
      this.context.batch.delete(docRef)
    } else {
      await docRef.delete()
    }
    return id
  }

  async bulkSet (objects: Array<Storable<T>>): Promise<FirebaseFirestore.WriteResult[]> {
    const batch = this.context.firestore.batch()

    objects.forEach((obj) => {
      const docId = obj.id
      const setDoc = this.converter.encode(obj)
      batch.set(this.collectionRef.doc(docId), setDoc)
    })
    return batch.commit()
  }

  async bulkDelete (docIds: string[]): Promise<FirebaseFirestore.WriteResult[]> {
    const batch = this.context.firestore.batch()

    docIds.forEach((docId) => {
      batch.delete(this.collectionRef.doc(docId))
    })
    return batch.commit()
  }

  where (fieldPath: QueryKey<S>, opStr: FirebaseFirestore.WhereFilterOp, value: any): FirestoreSimpleQuery<T, S> {
    const query = this.collectionRef.where(fieldPath as string | FirebaseFirestore.FieldPath, opStr, value)
    return new FirestoreSimpleQuery<T, S>(this.converter, this.context, query)
  }

  orderBy (fieldPath: QueryKey<S>, directionStr?: FirebaseFirestore.OrderByDirection): FirestoreSimpleQuery<T, S> {
    const query = this.collectionRef.orderBy(fieldPath as string | FirebaseFirestore.FieldPath, directionStr)
    return new FirestoreSimpleQuery<T, S>(this.converter, this.context, query)
  }

  limit (limit: number): FirestoreSimpleQuery<T, S> {
    const query = this.collectionRef.limit(limit)
    return new FirestoreSimpleQuery<T, S>(this.converter, this.context, query)
  }

  onSnapshot (callback: (
    querySnapshot: QuerySnapshot,
    toObject: (documentSnapshot: DocumentSnapshot) => T
    ) => void
  ): () => void {
    return this.collectionRef.onSnapshot((_querySnapshot) => {
      callback(_querySnapshot, this.toObject.bind(this))
    })
  }
}

class FirestoreSimpleQuery<T extends HasId, S> {
  constructor (public converter: FirestoreSimpleConverter<T, S>, public context: Context, public query: Query) { }

  where (fieldPath: QueryKey<S>, opStr: FirebaseFirestore.WhereFilterOp, value: any): this {
    this.query = this.query.where(fieldPath as string | FirebaseFirestore.FieldPath, opStr, value)
    return this
  }

  orderBy (fieldPath: QueryKey<S>, directionStr?: FirebaseFirestore.OrderByDirection): this {
    this.query = this.query.orderBy(fieldPath as string | FirebaseFirestore.FieldPath, directionStr)
    return this
  }

  limit (limit: number): this {
    this.query = this.query.limit(limit)
    return this
  }

  startAt (snapshot: DocumentSnapshot): FirestoreSimpleQuery<T, S>
  startAt (...fieldValues: any[]): FirestoreSimpleQuery<T, S>
  startAt (
    snapshotOrValue: DocumentSnapshot | unknown,
    ...fieldValues: unknown[]
  ): this {
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
  ): this {
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
  ): this {
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
  ): this {
    if (!this.query) throw new Error('no query statement before endBefore()')

    if (snapshotOrValue instanceof DocumentSnapshot) {
      this.query = this.query.endBefore(snapshotOrValue)
    } else {
      this.query = this.query.endBefore(snapshotOrValue, ...fieldValues)
    }
    return this
  }

  async fetch (): Promise<T[]> {
    if (!this.query) throw new Error('no query statement before fetch()')

    const snapshot = (this.context.tx)
      ? await this.context.tx.get(this.query)
      : await this.query.get()
    const arr: T[] = []

    snapshot.forEach((documentSnapshot) => {
      arr.push(this.converter.decode(documentSnapshot))
    })
    return arr
  }

  onSnapshot (callback: (
    querySnapshot: QuerySnapshot,
    toObject: (documentSnapshot: DocumentSnapshot) => T
    ) => void
  ): () => void {
    if (!this.query) throw new Error('no query statement before onSnapshot()')
    return this.query.onSnapshot((_querySnapshot) => {
      callback(_querySnapshot, this.converter.decode.bind(this.converter))
    })
  }
}

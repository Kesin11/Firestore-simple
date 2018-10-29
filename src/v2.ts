import {
  CollectionReference,
  Firestore,
} from '@google-cloud/firestore'
import { Assign } from 'utility-types'

interface HasId { id: string, [prop: string]: any }
interface NullableId { id?: string }

export class FirestoreSimpleV2<T extends HasId> {
  public firestore: Firestore
  public collectionRef: CollectionReference
  public _encode?: (obj: T | Assign<T, NullableId>) => FirebaseFirestore.DocumentData
  public _decode?: (doc: HasId) => T

  constructor ({ firestore, path, encode, decode }: {
    firestore: Firestore,
    path: string,
    encode?: (obj: T | Assign<T, NullableId>) => FirebaseFirestore.DocumentData
    decode?: (doc: HasId) => T,
  }) {
    this.firestore = firestore,
    this.collectionRef = this.firestore.collection(path)
    this._encode = encode
    this._decode = decode
  }
  // for overwrite in subclass
  public decode (doc: HasId): T {
    if (this._decode) return this._decode(doc)
    return doc as T
  }

  public toObject (docId: string, docData: FirebaseFirestore.DocumentData): T {
    const obj = { id: docId, ...docData }
    return this.decode(obj)
  }

  // for overwrite in subclass
  public encode (obj: T | Assign<T, NullableId>) {
    if (this._encode) return this._encode(obj)
    return Object.assign({}, obj)
  }

  public toDoc (obj: T | Assign<T, NullableId>) {
    const doc = this.encode(obj)
    if (doc.id) delete doc.id
    return doc
  }

  public async fetchDocument (id: string): Promise <T> {
    const snapshot = await this.collectionRef.doc(id).get()
    if (!snapshot.exists) throw new Error(`No document id: ${id}`)

    return this.toObject(snapshot.id, snapshot.data() || {})
  }

  public async add (obj: Assign<T, NullableId>): Promise <T> {
    const doc = this.toDoc(obj)
    const docRef = await this.collectionRef.add(doc)
    return Object.assign({}, obj, { id: docRef.id }) as unknown as T
  }

  public async set (obj: T) {
    if (!obj.id) throw new Error('Argument object must have "id" property')

    const docId = obj.id
    const setDoc = this.toDoc(obj)

    await this.collectionRef.doc(docId).set(setDoc)
    return obj
  }

  public async delete (id: string) {
    await this.collectionRef.doc(id).delete()
    return id
  }

}

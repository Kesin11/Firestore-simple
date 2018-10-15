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
  public encode?: (obj: T | Assign<T, NullableId>) => FirebaseFirestore.DocumentData
  public decode?: (doc: HasId) => T

  constructor ({ firestore, path, encode, decode }: {
    firestore: Firestore,
    path: string,
    encode?: (obj: T | Assign<T, NullableId>) => FirebaseFirestore.DocumentData
    decode?: (doc: HasId) => T,
  }) {
    this.firestore = firestore,
    this.collectionRef = this.firestore.collection(path)
    this.encode = encode
    this.decode = decode
  }

  public toObject (docId: string, docData: FirebaseFirestore.DocumentData): T {
    const obj = { id: docId, ...docData }
    if (!this.decode) return obj as unknown as T
    return this.decode(obj)
  }

  public toDoc (obj: T | Assign<T, NullableId>) {
    const doc = (this.encode) ? this.encode(obj) : Object.assign({}, obj)
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
    return Object.assign(obj, { id: docRef.id }) as unknown as T
  }

  public async set (obj: T) {
    if (!obj.id) throw new Error('Argument object must have "id" property')

    const docId = obj.id
    const setDoc = this.toDoc(obj)

    await this.collectionRef.doc(docId).set(setDoc)
    return obj
  }
}

import type { firestore } from 'firebase'
import { HasId, OmitId, Encodable, Decodable, OptionalIdStorable, Storable, PartialStorable } from './types'
import { Context } from './context'
import { WebConverter } from './converter'

export class WebCollection<T extends HasId, S = OmitId<T>> {
  context: Context
  collectionRef: firestore.CollectionReference
  private converter: WebConverter<T, S>

  constructor ({ context, path, encode, decode }: {
    context: Context,
    path: string,
    encode?: Encodable<T, S>,
    decode?: Decodable<T, S>,
  }) {
    this.context = context
    this.collectionRef = context.firestore.collection(path)
    this.converter = new WebConverter({ encode, decode })
  }

  toObject (documentSnapshot: firestore.DocumentSnapshot): T {
    return this.converter.decode(documentSnapshot)
  }

  docRef (id?: string): firestore.DocumentReference {
    if (id) return this.collectionRef.doc(id)
    return this.collectionRef.doc()
  }

  async fetch (id: string): Promise <T | undefined> {
    const docRef = this.docRef(id)
    const snapshot = await docRef.get()
    if (!snapshot.exists) return undefined

    return this.toObject(snapshot)
  }

  async fetchAll (): Promise<T[]> {
    const snapshot = await this.collectionRef.get()

    return snapshot.docs.map((snapshot) => this.toObject(snapshot))
  }

  async add (obj: OptionalIdStorable<T>): Promise<string> {
    const doc = this.converter.encode(obj)

    const docRef = await this.collectionRef.add(doc)
    return docRef.id
  }

  async set (obj: Storable<T>): Promise<string> {
    if (!obj.id) throw new Error('Argument object must have "id" property')

    const docRef = this.docRef(obj.id)
    const setDoc = this.converter.encode(obj)

    await docRef.set(setDoc)
    return obj.id
  }

  addOrSet (obj: OptionalIdStorable<T>): Promise<string> {
    if ('id' in obj) {
      return this.set(obj as Storable<T>)
    }
    return this.add(obj)
  }

  async update (obj: PartialStorable<S & HasId>): Promise<string> {
    if (!obj.id) throw new Error('Argument object must have "id" property')

    const docRef = this.docRef(obj.id)
    const updateDoc = Object.assign({}, obj)
    delete updateDoc.id

    await docRef.update(updateDoc)
    return obj.id
  }

  async delete (id: string): Promise<string> {
    const docRef = this.docRef(id)

    await docRef.delete()
    return id
  }
}

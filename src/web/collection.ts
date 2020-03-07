import type { firestore } from 'firebase'
import { HasId, OmitId, Encodable, Decodable } from './types'
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
}

import type { firestore } from 'firebase'
import { HasId, OmitId, Encodable, Decodable, OptionalIdStorable, Storable, PartialStorable, QueryKey } from './types'
import { Context } from './context'
import { WebConverter } from './converter'
import { WebQuery } from './query'

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
    const snapshot = (this.context.tx)
      ? await this.context.tx.get(docRef)
      : await docRef.get()
    if (!snapshot.exists) return undefined

    return this.toObject(snapshot)
  }

  async fetchAll (): Promise<T[]> {
    if (this.context.tx) throw new Error('Web SDK transaction.get() does not support QuerySnapshot')

    const snapshot = await this.collectionRef.get()
    return snapshot.docs.map((snapshot) => this.toObject(snapshot))
  }

  async add (obj: OptionalIdStorable<T>): Promise<string> {
    let docRef: firestore.DocumentReference
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

  async update (obj: PartialStorable<S & HasId>): Promise<string> {
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

  async bulkAdd (objects: Array<OptionalIdStorable<T>>): Promise<void> {
    return this.context.runBatch(async () => {
      objects.forEach((obj) => { this.add(obj) })
    })
  }

  async bulkSet (objects: Array<Storable<T>>): Promise<void> {
    return this.context.runBatch(async () => {
      objects.forEach((obj) => { this.set(obj) })
    })
  }

  async bulkDelete (docIds: string[]): Promise<void> {
    return this.context.runBatch(async () => {
      docIds.forEach((docId) => { this.delete(docId) })
    })
  }

  where (fieldPath: QueryKey<S>, opStr: FirebaseFirestore.WhereFilterOp, value: any): WebQuery<T, S> {
    const query = this.collectionRef.where(fieldPath as string | FirebaseFirestore.FieldPath, opStr, value)
    return new WebQuery<T, S>(this.converter, this.context, query)
  }

  orderBy (fieldPath: QueryKey<S>, directionStr?: FirebaseFirestore.OrderByDirection): WebQuery<T, S> {
    const query = this.collectionRef.orderBy(fieldPath as string | FirebaseFirestore.FieldPath, directionStr)
    return new WebQuery<T, S>(this.converter, this.context, query)
  }

  limit (limit: number): WebQuery<T, S> {
    const query = this.collectionRef.limit(limit)
    return new WebQuery<T, S>(this.converter, this.context, query)
  }

  onSnapshot (callback: (
    querySnapshot: firestore.QuerySnapshot,
    toObject: (documentSnapshot: firestore.DocumentSnapshot) => T
    ) => void
  ): () => void {
    return this.collectionRef.onSnapshot((_querySnapshot) => {
      callback(_querySnapshot, this.toObject.bind(this))
    })
  }
}

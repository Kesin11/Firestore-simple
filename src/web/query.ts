import { firestore } from 'firebase'
import { HasId, QueryKey } from './types'
import { WebConverter } from './converter'
import { Context } from './context'

export class WebQuery<T extends HasId, S> {
  constructor (public converter: WebConverter<T, S>, public context: Context, public query: firestore.Query) { }

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

  startAt (snapshot: firestore.DocumentSnapshot): WebQuery<T, S>
  startAt (...fieldValues: any[]): WebQuery<T, S>
  startAt (
    snapshotOrValue: firestore.DocumentSnapshot | unknown,
    ...fieldValues: unknown[]
  ): this {
    if (!this.query) throw new Error('no query statement before startAt()')

    if (snapshotOrValue instanceof firestore.DocumentSnapshot) {
      this.query = this.query.startAt(snapshotOrValue)
    } else {
      this.query = this.query.startAt(snapshotOrValue, ...fieldValues)
    }
    return this
  }

  startAfter (snapshot: firestore.DocumentSnapshot): WebQuery<T, S>
  startAfter (...fieldValues: any[]): WebQuery<T, S>
  startAfter (
    snapshotOrValue: firestore.DocumentSnapshot | unknown,
    ...fieldValues: unknown[]
  ): this {
    if (!this.query) throw new Error('no query statement before startAfter()')

    if (snapshotOrValue instanceof firestore.DocumentSnapshot) {
      this.query = this.query.startAfter(snapshotOrValue)
    } else {
      this.query = this.query.startAfter(snapshotOrValue, ...fieldValues)
    }
    return this
  }

  endAt (snapshot: firestore.DocumentSnapshot): WebQuery<T, S>
  endAt (...fieldValues: any[]): WebQuery<T, S>
  endAt (
    snapshotOrValue: firestore.DocumentSnapshot | unknown,
    ...fieldValues: unknown[]
  ): this {
    if (!this.query) throw new Error('no query statement before endAt()')

    if (snapshotOrValue instanceof firestore.DocumentSnapshot) {
      this.query = this.query.endAt(snapshotOrValue)
    } else {
      this.query = this.query.endAt(snapshotOrValue, ...fieldValues)
    }
    return this
  }

  endBefore (snapshot: firestore.DocumentSnapshot): WebQuery<T, S>
  endBefore (...fieldValues: any[]): WebQuery<T, S>
  endBefore (
    snapshotOrValue: firestore.DocumentSnapshot | unknown,
    ...fieldValues: unknown[]
  ): this {
    if (!this.query) throw new Error('no query statement before endBefore()')

    if (snapshotOrValue instanceof firestore.DocumentSnapshot) {
      this.query = this.query.endBefore(snapshotOrValue)
    } else {
      this.query = this.query.endBefore(snapshotOrValue, ...fieldValues)
    }
    return this
  }

  async fetch (): Promise<T[]> {
    if (!this.query) throw new Error('no query statement before fetch()')

    const snapshot = await this.query.get()
    return snapshot.docs.map((documentSnapshot) => {
      return this.converter.decode(documentSnapshot)
    })
  }

  onSnapshot (callback: (
    querySnapshot: firestore.QuerySnapshot,
    toObject: (documentSnapshot: firestore.DocumentSnapshot) => T
    ) => void
  ): () => void {
    if (!this.query) throw new Error('no query statement before onSnapshot()')
    return this.query.onSnapshot((_querySnapshot) => {
      callback(_querySnapshot, this.converter.decode.bind(this.converter))
    })
  }
}

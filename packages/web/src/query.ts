import { firestore } from 'firebase/app'
import '@firebase/firestore' // for instanceof firestore.DocumentSnapshot
import { HasId, QueryKey, DocumentSnapshot, QuerySnapshot, WhereFilterOp, FieldPath, OrderByDirection, Query } from './types'
import { WebConverter } from './converter'
import { Context } from './context'

export class WebQuery<T extends HasId, S> {
  constructor (public converter: WebConverter<T, S>, public context: Context, public query: Query) { }

  where (fieldPath: QueryKey<S>, opStr: WhereFilterOp, value: any): this {
    this.query = this.query.where(fieldPath as string | FieldPath, opStr, value)
    return this
  }

  orderBy (fieldPath: QueryKey<S>, directionStr?: OrderByDirection): this {
    this.query = this.query.orderBy(fieldPath as string | FieldPath, directionStr)
    return this
  }

  limit (limit: number): this {
    this.query = this.query.limit(limit)
    return this
  }

  startAt (snapshot: DocumentSnapshot): WebQuery<T, S>
  startAt (...fieldValues: any[]): WebQuery<T, S>
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

  startAfter (snapshot: DocumentSnapshot): WebQuery<T, S>
  startAfter (...fieldValues: any[]): WebQuery<T, S>
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

  endAt (snapshot: DocumentSnapshot): WebQuery<T, S>
  endAt (...fieldValues: any[]): WebQuery<T, S>
  endAt (
    snapshotOrValue: DocumentSnapshot | unknown,
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

  endBefore (snapshot: DocumentSnapshot): WebQuery<T, S>
  endBefore (...fieldValues: any[]): WebQuery<T, S>
  endBefore (
    snapshotOrValue: DocumentSnapshot | unknown,
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
    if (this.context.tx) throw new Error('Web SDK transaction.get() does not support QuerySnapshot')

    const snapshot = await this.query.get()
    return snapshot.docs.map((documentSnapshot) => {
      return this.converter.decode(documentSnapshot)
    })
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

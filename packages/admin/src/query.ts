import { HasId, QueryKey, Query as FirestoreQuery, WhereFilterOp, FieldPath, OrderByDirection, DocumentSnapshot, QuerySnapshot } from './types'
import { Converter } from './converter'
import { Context } from './context'

export class Query<T extends HasId, S> {
  constructor (public converter: Converter<T, S>, public context: Context, public query: FirestoreQuery) { }

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

  startAt (snapshot: DocumentSnapshot): Query<T, S>
  startAt (...fieldValues: any[]): Query<T, S>
  startAt (
    snapshotOrValue: DocumentSnapshot | unknown,
    ...fieldValues: unknown[]
  ): this {
    if (!this.query) throw new Error('no query statement before startAt()')

    this.query = this.query.startAt(snapshotOrValue, ...fieldValues)
    return this
  }

  startAfter (snapshot: DocumentSnapshot): Query<T, S>
  startAfter (...fieldValues: any[]): Query<T, S>
  startAfter (
    snapshotOrValue: DocumentSnapshot | unknown,
    ...fieldValues: unknown[]
  ): this {
    if (!this.query) throw new Error('no query statement before startAfter()')

    this.query = this.query.startAfter(snapshotOrValue, ...fieldValues)
    return this
  }

  endAt (snapshot: DocumentSnapshot): Query<T, S>
  endAt (...fieldValues: any[]): Query<T, S>
  endAt (
    snapshotOrValue: DocumentSnapshot | unknown,
    ...fieldValues: unknown[]
  ): this {
    if (!this.query) throw new Error('no query statement before endAt()')

    this.query = this.query.endAt(snapshotOrValue, ...fieldValues)
    return this
  }

  endBefore (snapshot: DocumentSnapshot): Query<T, S>
  endBefore (...fieldValues: any[]): Query<T, S>
  endBefore (
    snapshotOrValue: DocumentSnapshot | unknown,
    ...fieldValues: unknown[]
  ): this {
    if (!this.query) throw new Error('no query statement before endBefore()')

    this.query = this.query.endBefore(snapshotOrValue, ...fieldValues)
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

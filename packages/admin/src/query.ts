import { DocumentSnapshot, Query, QuerySnapshot } from '@google-cloud/firestore'
import { HasId, QueryKey } from './types'
import { AdminConverter } from './converter'
import { Context } from './context'

export class AdminQuery<T extends HasId, S> {
  constructor (public converter: AdminConverter<T, S>, public context: Context, public query: Query) { }

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

  startAt (snapshot: DocumentSnapshot): AdminQuery<T, S>
  startAt (...fieldValues: any[]): AdminQuery<T, S>
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

  startAfter (snapshot: DocumentSnapshot): AdminQuery<T, S>
  startAfter (...fieldValues: any[]): AdminQuery<T, S>
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

  endAt (snapshot: DocumentSnapshot): AdminQuery<T, S>
  endAt (...fieldValues: any[]): AdminQuery<T, S>
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

  endBefore (snapshot: DocumentSnapshot): AdminQuery<T, S>
  endBefore (...fieldValues: any[]): AdminQuery<T, S>
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
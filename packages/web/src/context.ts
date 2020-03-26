import { Firestore, Transaction, WriteBatch } from './types'

export class Context {
  firestore: Firestore
  private _tx?: Transaction = undefined
  private _batch?: WriteBatch = undefined
  constructor (firestore: Firestore) {
    this.firestore = firestore
  }

  get tx (): Transaction | undefined {
    return this._tx
  }

  get batch (): WriteBatch | undefined {
    return this._batch
  }

  async runTransaction (updateFunction: (tx: Transaction) => Promise<void>): Promise<void> {
    if (this._tx || this._batch) throw new Error('Disallow nesting transaction or batch')

    await this.firestore.runTransaction(async (tx) => {
      this._tx = tx
      await updateFunction(tx)
    })
    this._tx = undefined
  }

  async runBatch (updateFunction: (batch: WriteBatch) => Promise<void>): Promise<void> {
    if (this._tx || this._batch) throw new Error('Disallow nesting transaction or batch')

    this._batch = this.firestore.batch()

    await updateFunction(this._batch)
    await this._batch.commit()

    this._batch = undefined
  }
}

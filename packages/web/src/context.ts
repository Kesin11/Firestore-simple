import { firestore } from 'firebase/app'

export class Context {
  firestore: firestore.Firestore
  private _tx?: firestore.Transaction = undefined
  private _batch?: firestore.WriteBatch = undefined
  constructor (firestore: firebase.firestore.Firestore) {
    this.firestore = firestore
  }

  get tx (): firestore.Transaction | undefined {
    return this._tx
  }

  get batch (): firestore.WriteBatch | undefined {
    return this._batch
  }

  async runTransaction (updateFunction: (tx: firestore.Transaction) => Promise<void>): Promise<void> {
    if (this._tx || this._batch) throw new Error('Disallow nesting transaction or batch')

    await this.firestore.runTransaction(async (tx) => {
      this._tx = tx
      await updateFunction(tx)
    })
    this._tx = undefined
  }

  async runBatch (updateFunction: (batch: firestore.WriteBatch) => Promise<void>): Promise<void> {
    if (this._tx || this._batch) throw new Error('Disallow nesting transaction or batch')

    this._batch = this.firestore.batch()

    await updateFunction(this._batch)
    await this._batch.commit()

    this._batch = undefined
  }
}

import { Firestore } from '@google-cloud/firestore'

export class Context {
  firestore: Firestore
  private _tx?: FirebaseFirestore.Transaction = undefined
  private _batch?: FirebaseFirestore.WriteBatch = undefined
  constructor (firestore: Firestore) {
    this.firestore = firestore
  }

  get tx (): FirebaseFirestore.Transaction | undefined {
    return this._tx
  }

  get batch (): FirebaseFirestore.WriteBatch | undefined {
    return this._batch
  }

  async runTransaction (updateFunction: (tx: FirebaseFirestore.Transaction) => Promise<void>): Promise<void> {
    if (this._tx || this._batch) throw new Error('Disallow nesting transaction or batch')

    await this.firestore.runTransaction(async (tx) => {
      this._tx = tx
      await updateFunction(tx)
    })
    this._tx = undefined
  }

  async runBatch (updateFunction: (batch: FirebaseFirestore.WriteBatch) => Promise<void>): Promise<FirebaseFirestore.WriteResult[]> {
    if (this._tx || this._batch) throw new Error('Disallow nesting transaction or batch')

    this._batch = this.firestore.batch()

    await updateFunction(this._batch)
    const writeResults = await this._batch.commit()

    this._batch = undefined
    return writeResults
  }
}

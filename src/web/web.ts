import type { firestore } from 'firebase'
import { HasId, Encodable, Decodable } from './types'
import { OmitId } from '../admin/types'
import { Context } from './context'
import { WebCollection } from './collection'

export class FirestoreSimpleWeb {
  context: Context
  constructor (firestore: firestore.Firestore) {
    this.context = new Context(firestore)
  }

  collection<T extends HasId, S = OmitId<T>> ({ path, encode, decode }: {
    path: string,
    encode?: Encodable<T, S>,
    decode?: Decodable<T, S>,
  }): WebCollection<T, S> {
    const factory = new CollectionFactory<T, S>({
      context: this.context,
      encode,
      decode,
    })
    return factory.create(path)
  }

  async runTransaction (updateFunction: (tx: firestore.Transaction) => Promise<void>): Promise<void> {
    return this.context.runTransaction(updateFunction)
  }

  async runBatch (updateFunction: (batch: firestore.WriteBatch) => Promise<void>): Promise<void> {
    return this.context.runBatch(updateFunction)
  }
}

class CollectionFactory<T extends HasId, S = OmitId<T>> {
  context: Context
  encode?: Encodable<T, S>
  decode?: Decodable<T, S>

  constructor ({ context, encode, decode }: {
    context: Context,
    encode?: Encodable<T, S>,
    decode?: Decodable<T, S>,
  }) {
    this.context = context
    this.encode = encode
    this.decode = decode
  }

  create (path: string): WebCollection<T, S> {
    return new WebCollection<T, S>({
      context: this.context,
      path,
      encode: this.encode,
      decode: this.decode,
    })
  }
}

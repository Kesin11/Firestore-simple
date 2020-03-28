import { HasId, Encodable, Decodable, OmitId, Firestore, Transaction, WriteBatch } from './types'
import { Context } from './context'
import { Collection } from './collection'
import { Query } from './query'
import { Converter } from './converter'

export class FirestoreSimple {
  context: Context
  constructor (firestore: Firestore) {
    this.context = new Context(firestore)
  }

  collection<T extends HasId, S = OmitId<T>> ({ path, encode, decode }: {
    path: string,
    encode?: Encodable<T, S>,
    decode?: Decodable<T, S>,
  }): Collection<T, S> {
    const factory = new CollectionFactory<T, S>({
      context: this.context,
      encode,
      decode,
    })
    return factory.create(path)
  }

  collectionFactory<T extends HasId, S = OmitId<T>> ({ encode, decode }: {
    encode?: Encodable<T, S>,
    decode?: Decodable<T, S>,
  }): CollectionFactory<T, S> {
    return new CollectionFactory<T, S>({
      context: this.context,
      encode,
      decode,
    })
  }

  collectionGroup<T extends HasId, S = OmitId<T>> ({ collectionId, decode }: {
    collectionId: string,
    decode?: Decodable<T, S>,
  }): Query<T, S> {
    const query = this.context.firestore.collectionGroup(collectionId)
    const converter = new Converter({ decode })
    return new Query<T, S>(converter, this.context, query)
  }

  async runTransaction (updateFunction: (tx: Transaction) => Promise<void>): Promise<void> {
    return this.context.runTransaction(updateFunction)
  }

  async runBatch (updateFunction: (batch: WriteBatch) => Promise<void>): Promise<void> {
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

  create (path: string): Collection<T, S> {
    return new Collection<T, S>({
      context: this.context,
      path,
      encode: this.encode,
      decode: this.decode,
    })
  }
}

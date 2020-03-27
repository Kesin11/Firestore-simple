import { HasId, WebEncodable, WebDecodable, OmitId, Firestore, Transaction, WriteBatch } from './types'
import { Context } from './context'
import { WebCollection } from './collection'
import { WebQuery } from './query'
import { WebConverter } from './converter'

export class FirestoreSimpleWeb {
  context: Context
  constructor (firestore: Firestore) {
    this.context = new Context(firestore)
  }

  collection<T extends HasId, S = OmitId<T>> ({ path, encode, decode }: {
    path: string,
    encode?: WebEncodable<T, S>,
    decode?: WebDecodable<T, S>,
  }): WebCollection<T, S> {
    const factory = new CollectionFactory<T, S>({
      context: this.context,
      encode,
      decode,
    })
    return factory.create(path)
  }

  collectionFactory<T extends HasId, S = OmitId<T>> ({ encode, decode }: {
    encode?: WebEncodable<T, S>,
    decode?: WebDecodable<T, S>,
  }): CollectionFactory<T, S> {
    return new CollectionFactory<T, S>({
      context: this.context,
      encode,
      decode,
    })
  }

  collectionGroup<T extends HasId, S = OmitId<T>> ({ collectionId, decode }: {
    collectionId: string,
    decode?: WebDecodable<T, S>,
  }): WebQuery<T, S> {
    const query = this.context.firestore.collectionGroup(collectionId)
    const converter = new WebConverter({ decode })
    return new WebQuery<T, S>(converter, this.context, query)
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
  encode?: WebEncodable<T, S>
  decode?: WebDecodable<T, S>

  constructor ({ context, encode, decode }: {
    context: Context,
    encode?: WebEncodable<T, S>,
    decode?: WebDecodable<T, S>,
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

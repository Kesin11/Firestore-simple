import { HasId, OmitId, AdminEncodable, AdminDecodable, Firestore } from './types'
import { Context } from './context'
import { AdminCollection } from './collection'
import { AdminQuery } from './query'
import { AdminConverter } from './converter'

export class FirestoreSimpleAdmin {
  context: Context
  constructor (firestore: Firestore) {
    this.context = new Context(firestore)
  }

  collection<T extends HasId, S = OmitId<T>> ({ path, encode, decode }: {
    path: string,
    encode?: AdminEncodable<T, S>,
    decode?: AdminDecodable<T, S>,
  }): AdminCollection<T, S> {
    const factory = new CollectionFactory<T, S>({
      context: this.context,
      encode,
      decode,
    })
    return factory.create(path)
  }

  collectionFactory<T extends HasId, S = OmitId<T>> ({ encode, decode }: {
    encode?: AdminEncodable<T, S>,
    decode?: AdminDecodable<T, S>,
  }): CollectionFactory<T, S> {
    return new CollectionFactory<T, S>({
      context: this.context,
      encode,
      decode,
    })
  }

  collectionGroup<T extends HasId, S = OmitId<T>> ({ collectionId, decode }: {
    collectionId: string,
    decode?: AdminDecodable<T, S>,
  }): AdminQuery<T, S> {
    const query = this.context.firestore.collectionGroup(collectionId)
    const converter = new AdminConverter({ decode })
    return new AdminQuery<T, S>(converter, this.context, query)
  }

  async runTransaction (updateFunction: (tx: FirebaseFirestore.Transaction) => Promise<void>): Promise<void> {
    return this.context.runTransaction(updateFunction)
  }

  async runBatch (updateFunction: (batch: FirebaseFirestore.WriteBatch) => Promise<void>): Promise<FirebaseFirestore.WriteResult[]> {
    return this.context.runBatch(updateFunction)
  }
}

class CollectionFactory<T extends HasId, S = OmitId<T>> {
  context: Context
  encode?: AdminEncodable<T, S>
  decode?: AdminDecodable<T, S>

  constructor ({ context, encode, decode }: {
    context: Context,
    encode?: AdminEncodable<T, S>,
    decode?: AdminDecodable<T, S>,
  }) {
    this.context = context
    this.encode = encode
    this.decode = decode
  }

  create (path: string): AdminCollection<T, S> {
    return new AdminCollection<T, S>({
      context: this.context,
      path,
      encode: this.encode,
      decode: this.decode,
    })
  }
}

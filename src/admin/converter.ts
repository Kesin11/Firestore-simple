import { DocumentSnapshot } from '@google-cloud/firestore'
import { HasId, OmitId, AdminEncodable, AdminDecodable, OptionalIdStorable, Storable } from './types'
import { Optional } from 'utility-types'

export class AdminConverter<T extends HasId, S = OmitId<T>> {
  private _encode?: AdminEncodable<T, S>
  private _decode?: AdminDecodable<T, S>

  constructor ({ encode, decode }: {
    encode?: AdminEncodable<T, S>,
    decode?: AdminDecodable<T, S>,
  }) {
    this._encode = encode
    this._decode = decode
  }

  decode (documentSnapshot: DocumentSnapshot): T {
    const obj = { id: documentSnapshot.id, ...documentSnapshot.data() }
    if (this._decode) return this._decode(obj as S & HasId)

    return obj as T
  }

  encode (obj: OptionalIdStorable<T>): Optional<Storable<T>, 'id'> | Storable<S> {
    if (this._encode) return this._encode(obj)

    const doc = { ...obj }
    if ('id' in doc) delete doc.id
    return doc
  }
}

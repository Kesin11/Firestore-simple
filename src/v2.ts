import {
  CollectionReference,
  Firestore,
} from '@google-cloud/firestore'

declare interface IDocData {
  [extra: string]: any
}
declare interface IDocObject {
  id: string,
  [extra: string]: any
}

// memo: <T, U>としてfirestoreに保存するときのスキーマを指定させてもいいかもしれない
// memo: Tだけどid?を持っていることは保証したい、という型を付ける
// memo: IDocDataはidというプロパティを持っていない、という型の表現をしたい
export class FirestoreSimpleV2<T extends IDocObject> {
  public firestore: Firestore
  public collectionRef: CollectionReference
  public encode?: (obj: T) => IDocData
  public decode?: (doc: IDocData) => T

  constructor ({ firestore, path, encode, decode }: {
    firestore: Firestore,
    path: string,
    encode?: (obj: T) => IDocData,
    decode?: (doc: IDocData) => T,
  }) {
    this.firestore = firestore,
    this.collectionRef = this.firestore.collection(path)
    this.encode = encode
    this.decode = decode
  }

  public toObject (docId: string, docData: FirebaseFirestore.DocumentData): T {
    // const object: IDocObject = { id: docId }
    // Object.keys(docData).forEach((key) => {
    //   object[key] = docData[key]
    // })
    const obj = { id: docId, ...docData }
    if (!this.decode) return obj as unknown as T
    return this.decode(obj)
  }

  public toDoc (obj: T) {
    const doc = (this.encode) ? this.encode(obj) : Object.assign({}, obj)
    delete doc.id
    return doc
  }

  public async fetchDocument (id: string): Promise < T > {
    const snapshot = await this.collectionRef.doc(id).get()
    if (!snapshot.exists) throw new Error(`No document id: ${id}`)

    return this.toObject(snapshot.id, snapshot.data() || {})
  }

  // TODO: addとsetでidの有無をちゃんと判定する型の定義を書く必要がある
  // いい感じに計算してTからidだけを取り除いたりできないだろうか？
  public async set (obj: T) {
    if (!obj.id) throw new Error('Argument object must have "id" property')

    const docId = obj.id
    const setDoc = this.toDoc(obj)

    await this.collectionRef.doc(docId).set(setDoc)
    return obj
  }
}

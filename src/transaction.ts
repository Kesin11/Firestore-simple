import { Firestore } from '@google-cloud/firestore'
import admin, { ServiceAccount } from 'firebase-admin'
import serviceAccount from '../firebase_secret.json' // your firebase secret json
import { FirestoreSimple } from './'

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as ServiceAccount),
})
const firestore = admin.firestore()
firestore.settings({ timestampsInSnapshots: true })

interface User {
  id: string,
  name: string,
}

interface UserFriend {
  name: string,
  created: Date,
  ref: FirebaseFirestore.DocumentReference
}

interface FriendRequest {
  id: string,
  from: string,
  to: string,
  status: 'pending' | 'accepted'
  created: Date,
  updated: Date,
}

class FriendRequestUsecase {
  public userDao: FirestoreSimple<User>
  public friendRequestDao: FirestoreSimple<FriendRequest>
  public firestore: Firestore

  constructor ({ userDao, friendRequestDao, firestore }: {
    userDao: FirestoreSimple<User>,
    friendRequestDao: FirestoreSimple<FriendRequest>,
    firestore: Firestore,
  }) {
    this.userDao = userDao
    this.friendRequestDao = friendRequestDao
    this.firestore = firestore
  }

  // フレンド申請を出す
  public async request (tx: FirebaseFirestore.Transaction, fromUserId: string, toUserId: string) {
    // 相手が既にフレンドかどうかをチェック
    const friend = await tx.get(this.userDao.collectionRef.doc(fromUserId).collection('friends').doc(toUserId))
    if (friend.exists) throw new Error('Already friends!!')

    // 2ユーザーの順番に依存しないようなユニークなidを生成
    const requestId = [fromUserId, toUserId].sort().join('_')

    const newRequestRef = this.friendRequestDao.collectionRef.doc(requestId)
    await tx.set(newRequestRef, {
      from: fromUserId,
      to: toUserId,
      status: 'pending',
      created: new Date(),
      updated: new Date(),
    })
  }

  public async getPendingRequest (tx: FirebaseFirestore.Transaction ,userId: string) {
    const pendingRequests = await tx.get(this.friendRequestDao.collectionRef
      .where('status', '==', 'pending')
      .where('to', '==', userId),
    )
    if (pendingRequests.size === 0) return null
    return pendingRequests.docs[0]
  }

  // 受理したときにトランザクションのステータスを変更してupdatedも更新、
  public async accept (tx: FirebaseFirestore.Transaction, request: FirebaseFirestore.DocumentSnapshot) {
    const friendRequest = request.data() as FriendRequest
    await tx.set(request.ref, { ...friendRequest, status: 'accepted', updated: new Date() })

    // お互いの/user/:userId/friends/にいつフレンドになったのかと、idを入れる
    const fromRef = this.userDao.collectionRef.doc(friendRequest.from)
    const fromUserFriend: UserFriend = { name: friendRequest.from, created: new Date(), ref: fromRef }
    const toRef = this.userDao.collectionRef.doc(friendRequest.to)
    const toUserFriend: UserFriend = { name: friendRequest.to, created: new Date(), ref: toRef }

    // fromのfriendにはto, toのfriendにはfromとお互いのフレンドリストに追加
    await tx.set(fromRef.collection('friends').doc(toRef.id), toUserFriend)
    await tx.set(toRef.collection('friends').doc(fromRef.id), fromUserFriend)
  }
}

// クラスベースの場合は外からfirestoreSimpleのインスタンスをもらう
// 継承するクラスは、firestoreSimple.collection<User>が返すインスタンスのクラスである
class SubClass extends FirestoreSimpleCollection<User> {
  constructor (firestoreSimple) {
    super({ firestoreSimple, path: 'user' })
  }

  public encode () { }
  public decode () { }
}

const main = async () => {
  // firestoreSimpleから全てのdaoを作り出すパターン
  const firestoreSimple = new FirestoreSimple(firestore)
  const userDao = firestoreSimple.collection<User>({ path: 'user', encode: () => {}, decode: () => {} })
  firestoreSimple.runTransaction(() => { })
  // firestoreSimpleのオブジェクト無しにはcollectionを作り出せなくなるので、
  // トランザクションの中でトランザクション外のfetchをするには、別のfirestoreSimpleから作り出したcollectionが必要になる
  // つまり、安全に倒される
  // 特定のdaoだけトランザクション外の動作をしたいというのは、かなり複雑なケースだと思うのでそれがやりにくい方向になっているのはコンセプトとマッチする
  // やっぱりこれ採用！！シンプルに安全側に倒されるのが良いし、使う側としても考慮することが減る。そして今後の拡張性が高い

  // contextオブジェクトをオプショナルで渡すパターン
  // const context = new firestoreSimpleContext(firestore)
  // const userDao = new FirestoreSimple({ firestore, path: 'user', context }) // contextはオプショナル
  // context.runTransaction(() => { }) // runTransactionに入った瞬間、contextがtxモードになってdaoの中のget達はそれを使うようにする
  // 既存のAPIからさほど変更なく対応できる
  // ただし、daoを作るときにcontextを忘れているとトランザクション外の操作ができてしまうので危険

  // runTransactionで明示的に使うdaoを指定する
  // 引数で渡したdaoに外からtxを埋め込んでしまう
  // dexie.jsっぽい
  // const userDao = new FirestoreSimple({ firestore, path: 'user ' })
  // FirestoreSimple.runTransaction(userDao, friendRequestDao, (_userDao, _friendRequestDao) => { })
  // 名前がすごい紛らわしくなる
  // dexie.jsとは違ってトランザクション外のdaoがフェッチなどしても検知することはできない

  const userDao = new FirestoreSimple<User>({ firestore, path: 'user' })
  const friendRequestDao = new FirestoreSimple<FriendRequest>({ firestore, path: 'request_friend' })

  // 前回の結果を初期化
  const prevUsers = await userDao.fetchAll()
  await userDao.bulkDelete(prevUsers.map((user) => user.id))
  const prevRequests = await friendRequestDao.fetchAll()
  await friendRequestDao.bulkDelete(prevRequests.map((req) => req.id))
  await userDao.collectionRef.doc('alice').collection('friends').doc('bob').delete()
  await userDao.collectionRef.doc('bob').collection('friends').doc('alice').delete()

  // ここから開始
  const bob = await userDao.set({ id: 'bob', name: 'bob' })
  const alice = await userDao.set({ id: 'alice', name: 'alice' })

  const friendRequestUsecase = new FriendRequestUsecase({ userDao, friendRequestDao, firestore })
  // トランザクション開始
  // トランザクション処理中に他のトランザクションによってデータが更新されていた場合は、全ての処理が最初からやり直しになる
  // トランザクション内ではreadは必ずwriteより前に全て行っておく必要があり、write後にreadした場合はトランザクション失敗となる
  // batchはtransactionに似ているが、readに関して保証してくれないのでしっかり使い所を分ける必要がある
  await firestore.runTransaction(async (tx) => {
    await friendRequestUsecase.request(tx, bob.id, alice.id)
  })
  // トランザクション終了

  // 別のトランザクション開始
  // aliceがフレンド申請を確認する
  await firestore.runTransaction(async (tx) => {
    const request = await friendRequestUsecase.getPendingRequest(tx, alice.id)
    if (!request) return

    await friendRequestUsecase.accept(tx, request)
  })
  // トランザクション終了

  // サブコレクションやリファレンスのことは一旦考えない
}
main()

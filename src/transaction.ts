import { Firestore } from '@google-cloud/firestore'
import admin, { ServiceAccount } from 'firebase-admin'
import serviceAccount from '../firebase_secret.json' // your firebase secret json
import { FirestoreSimple, FirestoreSimpleCollection } from './'

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
  id: string,
  name: string,
  created: Date,
  ref: FirebaseFirestore.DocumentReference
}

// interface UserFriendLog {
//   id: string
//   event: 'coop' | 'battle'
//   created: Date
// }

interface FriendRequest {
  id: string,
  from: string,
  to: string,
  status: 'pending' | 'accepted'
  created: Date,
  updated: Date,
}

class FriendRequestUsecase {
  public userDao: FirestoreSimpleCollection<User>
  public friendRequestDao: FirestoreSimpleCollection<FriendRequest>
  public firestore: Firestore

  constructor ({ userDao, friendRequestDao, firestore }: {
    userDao: FirestoreSimpleCollection<User>,
    friendRequestDao: FirestoreSimpleCollection<FriendRequest>,
    firestore: Firestore,
  }) {
    this.userDao = userDao
    this.friendRequestDao = friendRequestDao
    this.firestore = firestore
  }

  // フレンド申請を出す
  public async request (fromUserId: string, toUserId: string) {
    // 相手が既にフレンドかどうかをチェック
    const friend = await this.userDao.subCollection<UserFriend>({ parent: fromUserId, path: 'friends' }).fetch(toUserId)
    if (friend) throw new Error('Already friends!!')

    // 2ユーザーの順番に依存しないようなユニークなidを生成
    const requestId = [fromUserId, toUserId].sort().join('_')
    await this.friendRequestDao.set({
      id: requestId,
      from: fromUserId,
      to: toUserId,
      status: 'pending',
      created: new Date(),
      updated: new Date(),
    })
  }

  public async getPendingRequest (userId: string) {
    const pendingRequests = await this.friendRequestDao
      .where('status', '==', 'pending')
      .where('to', '==', userId)
      .fetch()
    if (pendingRequests.length === 0) return null
    return pendingRequests[0]
  }

  // 受理したときにトランザクションのステータスを変更してupdatedも更新、
  public async accept (friendRequest: FriendRequest) {
    await this.friendRequestDao.set({ ...friendRequest, status: 'accepted', updated: new Date() })

    // お互いの/user/:userId/friends/にいつフレンドになったのかと、idを入れる
    const fromRef = this.userDao.docRef(friendRequest.from)
    const fromUserFriend = { id: friendRequest.from, name: friendRequest.from, created: new Date(), ref: fromRef }
    const toRef = this.userDao.docRef(friendRequest.to)
    const toUserFriend = { id: friendRequest.to, name: friendRequest.to, created: new Date(), ref: toRef }

    // fromのfriendにはto, toのfriendにはfromとお互いのフレンドリストに追加
    this.userDao.subCollection<UserFriend>({ parent: fromRef.id, path: 'friends' }).set(toUserFriend)
    this.userDao.subCollection<UserFriend>({ parent: toRef.id, path: 'friends' }).set(fromUserFriend)
  }
}

// クラスベースの場合は外からfirestoreSimpleのインスタンスをもらう
// 継承するクラスは、firestoreSimple.collection<User>が返すインスタンスのクラスである
// class SubClass extends FirestoreSimpleCollection<User> {
//   constructor (firestoreSimple) {
//     super({ firestoreSimple, path: 'user' })
//   }

//   public encode () { }
//   public decode () { }
// }

const main = async () => {
  const firestoreSimple = new FirestoreSimple(firestore)
  const userDao = firestoreSimple.collection<User>({ path: 'user' })
  const friendRequestDao = firestoreSimple.collection<FriendRequest>({ path: 'request_friend' })

  // 前回の結果を初期化
  const prevUsers = await userDao.fetchAll()
  await userDao.bulkDelete(prevUsers.map((user) => user.id))
  const prevRequests = await friendRequestDao.fetchAll()
  await friendRequestDao.bulkDelete(prevRequests.map((req) => req.id))
  await userDao.docRef('alice').collection('friends').doc('bob').delete()
  await userDao.docRef('bob').collection('friends').doc('alice').delete()

  // 素直に作るパターン
  // encode/decodeが必要なときに毎回作る必要があるのがいけていない
  // が、実装は楽そうなのでまずはこれから作ってみようか
  await userDao.subCollection<FriendRequest>({ parent: 'alice', path: 'friends' }).delete('bob')

  // 最初にサブコレクションを定義しておくパターン
  // 最初に作るのがダルいが、定義しておけばGenericsもencode/decodeも再度指定する必要がない
  // const subcollectionDao = firestoreSimple.collection<User>({ path: 'user',
  //   subCollection: {
  //     friends: firestoreSimple.subCollection<Friends>({ path: 'friends',
  //       // サブコレクションのネストもできるようにしておく必要がある
  //       subCollection: {
  //         logs: firestoreSimple.subCollection<UserFriendLog>({
  //           path: 'logs',
  //           decode: (doc) => {
  //             return {
  //               event: doc.event,
  //               created: doc.created.toDate(),
  //             }
  //           },
  //         }),
  //       },
  //     }),
  //   },
  // })
  // subcollectionDao.subCollection.friends('alice').delete('bob')
  // subcollectionDao.subCollection.friends('alice').subCollection.logs(1).delete('bob')

  // ここから開始
  const bob = await userDao.set({ id: 'bob', name: 'bob' })
  const alice = await userDao.set({ id: 'alice', name: 'alice' })

  const friendRequestUsecase = new FriendRequestUsecase({ userDao, friendRequestDao, firestore })
  // トランザクション開始
  // トランザクション処理中に他のトランザクションによってデータが更新されていた場合は、全ての処理が最初からやり直しになる
  // トランザクション内ではreadは必ずwriteより前に全て行っておく必要があり、write後にreadした場合はトランザクション失敗となる
  // batchはtransactionに似ているが、readに関して保証してくれないのでしっかり使い所を分ける必要がある
  await firestoreSimple.runTransaction(async (_tx) => {
    await friendRequestUsecase.request(bob.id, alice.id)
  })
  // トランザクション終了

  // 別のトランザクション開始
  // aliceがフレンド申請を確認する
  await firestoreSimple.runTransaction(async (_tx) => {
    const request = await friendRequestUsecase.getPendingRequest(alice.id)
    if (!request) return

    await friendRequestUsecase.accept(request)
  })
  // トランザクション終了
}
main()

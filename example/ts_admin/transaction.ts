import admin, { ServiceAccount } from 'firebase-admin'
import serviceAccount from '../../firebase_secret.json' // your firebase secret json
import { FirestoreSimple, FirestoreSimpleCollection } from '../../src'

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

interface FriendRequest {
  id: string,
  from: string,
  to: string,
  status: 'pending' | 'accepted'
  created: Date,
  updated: Date,
}

class FriendRequestUsecase {
  public firestoreSimple: FirestoreSimple
  public userDao: FirestoreSimpleCollection<User>
  public friendRequestDao: FirestoreSimpleCollection<FriendRequest>

  constructor ({ firestoreSimple, userDao, friendRequestDao }: {
    firestoreSimple: FirestoreSimple,
    userDao: FirestoreSimpleCollection<User>
    friendRequestDao: FirestoreSimpleCollection<FriendRequest>,
  }) {
    this.firestoreSimple = firestoreSimple
    this.userDao = userDao
    this.friendRequestDao = friendRequestDao
  }

  // フレンド申請を出す
  public async request (fromUserId: string, toUserId: string) {
    // 相手が既にフレンドかどうかをチェック
    const friendDao = this.firestoreSimple.collection<UserFriend>({ path: `user/${fromUserId}/friends`})
    const friend = await friendDao.fetch(toUserId)
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
    const toUserFriendDao = this.firestoreSimple.collection<UserFriend>({ path: `user/${toUserFriend}/friends`})
    const fromUserFriendDao = this.firestoreSimple.collection<UserFriend>({ path: `user/${fromUserFriend}/friends`})
    await fromUserFriendDao.set(toUserFriend)
    await toUserFriendDao.set(fromUserFriend)
  }
}

const main = async () => {
  const firestoreSimple = new FirestoreSimple(firestore)
  const userDao = firestoreSimple.collection<User>({ path: 'user'})
  const friendRequestDao = firestoreSimple.collection<FriendRequest>({ path: 'request_friend' })

  // 前回の結果を初期化
  const prevUsers = await userDao.fetchAll()
  await userDao.bulkDelete(prevUsers.map((user) => user.id))
  const prevRequests = await friendRequestDao.fetchAll()
  await friendRequestDao.bulkDelete(prevRequests.map((req) => req.id))
  await userDao.docRef('alice').collection('friends').doc('bob').delete()
  await userDao.docRef('bob').collection('friends').doc('alice').delete()

  // ここから開始
  const bob = await userDao.set({ id: 'bob', name: 'bob' })
  const alice = await userDao.set({ id: 'alice', name: 'alice' })

  const friendRequestUsecase = new FriendRequestUsecase({ firestoreSimple, userDao, friendRequestDao })
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

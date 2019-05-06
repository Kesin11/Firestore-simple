import admin, { ServiceAccount } from 'firebase-admin'
import serviceAccount from '../../firebase_secret.json' // your firebase secret json
import { FirestoreSimple, FirestoreSimpleCollection } from '../../src'

const ROOT_PATH = 'example/ts_admin_transaction'

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as ServiceAccount),
})
const firestore = admin.firestore()

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

  // Make friend request
  public async request (fromUserId: string, toUserId: string) {
    // Check is target user already friend.
    const friendDao = this.firestoreSimple.collection<UserFriend>({ path: `${ROOT_PATH}/user/${fromUserId}/friends` })
    const friend = await friendDao.fetch(toUserId)
    if (friend) throw new Error('Already friends!!')

    // Create a unique id that does not depend on the order of the two user.
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

  // Accept friend request
  public async accept (friendRequest: FriendRequest) {
    // Change status
    await this.friendRequestDao.set({ ...friendRequest, status: 'accepted', updated: new Date() })

    // Create each friend data that will set /user/:userId/friends/
    const fromRef = this.userDao.docRef(friendRequest.from)
    const fromUserFriend = { id: friendRequest.from, name: friendRequest.from, created: new Date(), ref: fromRef }
    const toRef = this.userDao.docRef(friendRequest.to)
    const toUserFriend = { id: friendRequest.to, name: friendRequest.to, created: new Date(), ref: toRef }

    // Register each other's data.
    const toUserFriendDao = this.firestoreSimple.collection<UserFriend>({ path: `${ROOT_PATH}/user/${toUserFriend}/friends` })
    const fromUserFriendDao = this.firestoreSimple.collection<UserFriend>({ path: `${ROOT_PATH}/user/${fromUserFriend}/friends` })
    await fromUserFriendDao.set(toUserFriend)
    await toUserFriendDao.set(fromUserFriend)
  }
}

const main = async () => {
  const firestoreSimple = new FirestoreSimple(firestore)
  const userDao = firestoreSimple.collection<User>({ path: `${ROOT_PATH}/user`})
  const friendRequestDao = firestoreSimple.collection<FriendRequest>({ path: `${ROOT_PATH}/request_friend` })

  // Clean before execute data
  const prevUsers = await userDao.fetchAll()
  await userDao.bulkDelete(prevUsers.map((user) => user.id))
  const prevRequests = await friendRequestDao.fetchAll()
  await friendRequestDao.bulkDelete(prevRequests.map((req) => req.id))
  await userDao.docRef('alice').collection('friends').doc('bob').delete()
  await userDao.docRef('bob').collection('friends').doc('alice').delete()

  // Setup two user data
  const bob = await userDao.set({ id: 'bob', name: 'bob' })
  const alice = await userDao.set({ id: 'alice', name: 'alice' })

  const friendRequestUsecase = new FriendRequestUsecase({ firestoreSimple, userDao, friendRequestDao })
  // Start transaction
  // Bob send friend request to alice
  await firestoreSimple.runTransaction(async (_tx) => {
    await friendRequestUsecase.request(bob.id, alice.id)
  })
  // End transaction

  // Start transaction
  // Alice check friend request and accept.
  await firestoreSimple.runTransaction(async (_tx) => {
    const request = await friendRequestUsecase.getPendingRequest(alice.id)
    if (!request) return

    await friendRequestUsecase.accept(request)
  })
  // End transaction
}
main()

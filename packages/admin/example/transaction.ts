import admin from 'firebase-admin'
import { FirestoreSimple, Collection } from '../src'

//
// Start Firestore local emulator in background before start this script.
// `npx firebase emulators:start --only firestore`
//

// hack for using local emulator
process.env.GCLOUD_PROJECT = 'firestore-simple-test'
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080'
admin.initializeApp({})
const firestore = admin.firestore()

const ROOT_PATH = 'example/admin_transaction'

interface User {
  id: string,
  name: string,
}

interface UserFriend {
  id: string,
  name: string,
  created: Date,
  ref: FirebaseFirestore.DocumentReference,
}

interface FriendRequest {
  id: string,
  from: string,
  to: string,
  status: 'pending' | 'accepted',
  created: Date,
  updated: Date,
}

class FriendRequestUsecase {
  firestoreSimple: FirestoreSimple
  userDao: Collection<User>
  friendRequestDao: Collection<FriendRequest>

  constructor ({ firestoreSimple, userDao, friendRequestDao }: {
    firestoreSimple: FirestoreSimple,
    userDao: Collection<User>,
    friendRequestDao: Collection<FriendRequest>,
  }) {
    this.firestoreSimple = firestoreSimple
    this.userDao = userDao
    this.friendRequestDao = friendRequestDao
  }

  // Make friend request
  async request (fromUserId: string, toUserId: string) {
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

  async getPendingRequest (userId: string) {
    const pendingRequests = await this.friendRequestDao
      .where('status', '==', 'pending')
      .where('to', '==', userId)
      .fetch()
    if (pendingRequests.length === 0) return null
    return pendingRequests[0]
  }

  // Accept friend request
  async accept (friendRequest: FriendRequest) {
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
  const userDao = firestoreSimple.collection<User>({ path: `${ROOT_PATH}/user` })
  const friendRequestDao = firestoreSimple.collection<FriendRequest>({ path: `${ROOT_PATH}/request_friend` })

  // Clean before execute data
  const prevUsers = await userDao.fetchAll()
  await userDao.bulkDelete(prevUsers.map((user) => user.id))
  const prevRequests = await friendRequestDao.fetchAll()
  await friendRequestDao.bulkDelete(prevRequests.map((req) => req.id))
  await userDao.docRef('alice').collection('friends').doc('bob').delete()
  await userDao.docRef('bob').collection('friends').doc('alice').delete()

  // Setup two user data
  const bobId = await userDao.set({ id: 'bob', name: 'bob' })
  const aliceId = await userDao.set({ id: 'alice', name: 'alice' })

  const friendRequestUsecase = new FriendRequestUsecase({ firestoreSimple, userDao, friendRequestDao })
  // Start transaction
  // Bob send friend request to alice
  await firestoreSimple.runTransaction(async (_tx) => {
    await friendRequestUsecase.request(bobId, aliceId)
  })
  // End transaction

  // Start transaction
  // Alice check friend request and accept.
  await firestoreSimple.runTransaction(async (_tx) => {
    const request = await friendRequestUsecase.getPendingRequest(aliceId)
    if (!request) return

    await friendRequestUsecase.accept(request)
  })
  // End transaction
}
main()

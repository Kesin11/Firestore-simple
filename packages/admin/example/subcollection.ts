import admin from 'firebase-admin'
import { FirestoreSimple } from '../src'

//
// Start Firestore local emulator in background before start this script.
// `npx firebase emulators:start --only firestore`
//

// hack for using local emulator
process.env.GCLOUD_PROJECT = 'firestore-simple-test'
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080'
admin.initializeApp({})
const firestore = admin.firestore()

const ROOT_PATH = 'example/admin_subcollection'

interface User {
  id: string,
  name: string,
}

interface UserFriend {
  id: string,
  name: string,
  created: Date,
}

const userNames = ['alice', 'bob', 'john']

const main = async () => {
  const firestoreSimple = new FirestoreSimple(firestore)
  // Root collection
  const userDao = firestoreSimple.collection<User>({ path: `${ROOT_PATH}/user` })
  await userDao.bulkSet(
    userNames.map((name) => {
      return { id: name, name }
    })
  )

  // Create factory with define decode function for subcollection
  const userFriendFactory = firestoreSimple.collectionFactory<UserFriend>({
    decode: (doc) => {
      return {
        id: doc.id,
        name: doc.name,
        created: doc.created.toDate()
      }
    }
  })

  const users = await userDao.fetchAll()
  for (const user of users) {
    // Create subcollection dao that has decode function previously defined in factory
    const userFriendDao = userFriendFactory.create(`${ROOT_PATH}/user/${user.id}/friend`)

    const friendNames = userNames.filter((name) => name !== user.name)
    await userFriendDao.bulkSet(friendNames.map((name) => {
      return { id: name, name, created: new Date() }
    }))

    const friends = await userFriendDao.fetchAll()
    console.log(user.id, friends)
  }
  // alice [ { id: 'bob', name: 'bob', created: 2019-05-12T07:20:52.816Z },
  //         { id: 'john', name: 'john', created: 2019-05-12T07:20:52.816Z } ]
  // bob   [ { id: 'alice', name: 'alice', created: 2019-05-12T07:20:53.664Z },
  //         { id: 'john', name: 'john', created: 2019-05-12T07:20:53.664Z } ]
  // john  [ { id: 'alice', name: 'alice', created: 2019-05-12T07:20:54.376Z },
  //         { id: 'bob', name: 'bob', created: 2019-05-12T07:20:54.376Z } ]

  // Remove documents
  for (const user of users) {
    const userFriendDao = userFriendFactory.create(`${ROOT_PATH}/user/${user.id}/friend`)
    const friends = await userFriendDao.fetchAll()

    await userDao.bulkDelete(friends.map((friend) => friend.id))
  }
  await userDao.bulkDelete(users.map((user) => user.id))
}
main()

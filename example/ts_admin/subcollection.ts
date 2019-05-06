import admin, { ServiceAccount } from 'firebase-admin'
import serviceAccount from '../../firebase_secret.json' // your firebase secret json
import { FirestoreSimple } from '../../src'

const ROOT_PATH = 'example/ts_admin_subcollection'

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
}

const main = async () => {
  const firestoreSimple = new FirestoreSimple(firestore)
  // Root collection
  const userDao = firestoreSimple.collection<User>({ path: `${ROOT_PATH}/user`})
  await userDao.set({ id: 'one', name: 'one'})
  const user = await userDao.fetch('one')

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

  // Create subcollection dao that has decode function previously defined in factory
  const userFriendDao = userFriendFactory.create(`${ROOT_PATH}/user/${user!.id}/friend`)

  await userFriendDao.set({ id: 'alice', name: 'alice', created: new Date() })
  const friend = await userFriendDao.fetch('alice')
  console.log(friend)
}
main()

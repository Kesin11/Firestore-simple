import admin, { ServiceAccount } from 'firebase-admin'
import serviceAccount from '../../firebase_secret.json' // your firebase secret json
import { FirestoreSimple } from '../../src'

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
}

const main = async () => {
  const firestoreSimple = new FirestoreSimple(firestore)
  // root collection
  const userDao = firestoreSimple.collection<User>({ path: 'user'})
  await userDao.set({ id: 'one', name: 'one'})
  const user = await userDao.fetch('one')

  // subcollection dao factory
  const userFriendFactory = firestoreSimple.collectionFactory<UserFriend>({
    decode: (doc) => {
      return {
        id: doc.id,
        name: doc.name,
        created: doc.created.toDate()
      }
    }
  })

  // subcollection
  const userFriendDao = userFriendFactory.create(`user/${user!.id}/friend`)

  await userFriendDao.set({ id: 'alice', name: 'alice', created: new Date() })
  const friend = await userFriendDao.fetch('alice')
  console.log(friend)
}
main()

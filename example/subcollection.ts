import admin, { ServiceAccount } from 'firebase-admin'
import serviceAccount from '../firebase_secret.json' // your firebase secret json
import { FirestoreSimple, FirestoreSimpleCollection } from '../src'

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

class UserCollection extends FirestoreSimpleCollection<User> { } 
class UserFriend extends FirestoreSimpleCollection<UserFriend> {
  public decode (doc) {
    return {
      id: doc.id,
      name: doc.name,
      created: doc.created.toDate()
    }
  }
}

// collectionClassを渡さない方法でもこうやって自分でラップすれば可能だが、いちいちやるのはめんどくさい
class userFriendCreator {
  constructor (public firestoreSimple: FirestoreSimple) { }
  create (path: string) {
    return this.firestoreSimple.collection<UserFriend>({
      path,
      decode: (doc) => {
        return {
          id: doc.id,
          name: doc.name,
          created: doc.created.toDate()
        }
      }
    })
  }
}

const main = async () => {
  const firestoreSimple = new FirestoreSimple(firestore)
  // root collection
  const userDao = firestoreSimple.collection<User>({ path: 'user'})
  await userDao.set({ id: 'one', name: 'one'})
  const user = await userDao.fetch('one')

  // subcollection
  const userFriendDao = firestoreSimple.collection<UserFriend>({
    path: `user/${user!.id}/friend`,
    decode: (doc) => {
      return {
        id: doc.id,
        name: doc.name,
        created: doc.created.toDate(),
      }
    }
  })

  await userFriendDao.set({ id: 'alice', name: 'alice', created: new Date() })
  const friend = await userFriendDao.fetch('alice')
  console.log(friend)

  // class based way
  const userDao2 = firestoreSimple.collection({ collectionClass: UserCollection, path: 'user' })
  const user2 = userDao2.fetch('one')
  const userFriendDao2 = firestoreSimple.collection({ collectionClass: UserCollection, path: `user/${user2}/friend`})
}
main()

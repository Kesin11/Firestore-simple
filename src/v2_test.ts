import admin, { ServiceAccount } from 'firebase-admin'
import serviceAccount from '../firebase_secret.json'
import { FirestoreSimpleV2 } from './v2'

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as ServiceAccount),
})
const firestore = admin.firestore()
firestore.settings({ timestampsInSnapshots: true })

interface User {
  id: string
  age: number
  name: string,
  createdAt: Date
}
const main = async () => {
  const userDao = new FirestoreSimpleV2<User>({ firestore, path: 'user',
    encode: (user: User) => {
      return {
        name: user.name,
        age: user.age,
        created_at: user.createdAt,
      }
    },
    decode: (obj) => {
      return {
        id: obj.id,
        age: obj.age,
        name: obj.name,
        createdAt: obj.created_at.toDate(),
      }
    },
  })
  const user = await userDao.fetchDocument('z4E1NZdNqH1dbcP53oER')
  console.log(user)
  await userDao.set({ id: '1', age: 20, name: 'bob', createdAt: new Date() })
}
main()

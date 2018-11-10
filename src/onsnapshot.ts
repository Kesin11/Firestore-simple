import admin, { ServiceAccount } from 'firebase-admin'
import { FirestoreSimple } from '.'
import serviceAccount from '../firebase_secret.json'

interface User {
  id: string
  age: number
  name: string,
  createdAt: Date
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as ServiceAccount),
})
const firestore = admin.firestore()
firestore.settings({ timestampsInSnapshots: true })

const userDao = new FirestoreSimple<User>({ firestore, path: 'user' })

const docObserver = userDao.collectionRef.doc('1').onSnapshot((docSnapshot) => {
  console.log('Received doc snapshot: ', docSnapshot.data())
})

const collectionObserver = userDao.collectionRef
  .onSnapshot((querySnapshot) => {
    querySnapshot.docChanges.forEach((change) => {
      if (change.type === 'added') {
        console.log(`added: ${change.doc.id}`, change.doc.data())
      }
      if (change.type === 'modified') {
        console.log(`modified: ${change.doc.id}`, change.doc.data())
      }
      if (change.type === 'removed') {
        console.log(`removed: ${change.doc.id}`, change.doc.data())
      }
    })
  })

const main = async () => {
  const user1 = await userDao.add({
    age: 22,
    name: 'test1',
    createdAt: new Date(),
  })
  const user2 = await userDao.add({
    age: 30,
    name: 'test2',
    createdAt: new Date(),
  })
  await userDao.set({
    id: user1.id,
    age: 20,
    name: 'set',
    createdAt: new Date(),
  })

  await userDao.delete(user1.id)
  await userDao.delete(user2.id)

  docObserver()
  collectionObserver()
}
main()

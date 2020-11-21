import firebase from 'firebase/app'
import 'firebase/firestore'
import { FirestoreSimple } from '../src/'

//
// Start Firestore local emulator in background before start this script.
// `npm run emulators:start`
// or `npx firebase emulators:start --only firestore`
//

const app = firebase.initializeApp({
  projectId: 'example'
})
const firestore = firebase.firestore()
firestore.useEmulator('localhost', 8080)

const ROOT_PATH = 'example/web_basic'

interface User {
  id: string,
  coin: number,
  timestamp: Date,
}

const main = async () => {
  const firestoreSimple = new FirestoreSimple(firestore)
  const dao = firestoreSimple.collection<User>({ path: `${ROOT_PATH}/user` })

  // Setup user
  const userId = await dao.add({ coin: 100, timestamp: firebase.firestore.FieldValue.serverTimestamp() })
  console.log(await dao.fetch(userId))
  // { id: 'E4pROVpeLaE3WBCYDDSh',
  // coin: 100,
  // timestamp: Timestamp { _seconds: 1560666401, _nanoseconds: 198000000 } }

  // Add 100 coin and update timestamp
  await dao.update({
    id: userId,
    coin: firebase.firestore.FieldValue.increment(100),
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  })
  console.log(await dao.fetch(userId))
  // { id: 'E4pROVpeLaE3WBCYDDSh',
  //   coin: 200,
  //   timestamp: Timestamp { _seconds: 1560666401, _nanoseconds: 731000000 } }

  // clean
  const docs = await dao.fetchAll()
  await dao.bulkDelete(docs.map((doc) => doc.id))

  await app.delete()
}

main()

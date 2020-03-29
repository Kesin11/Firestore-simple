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

const ROOT_PATH = 'example/admin_field_value'

interface User {
  id: string,
  coin: number,
  timestamp: Date,
}

const main = async () => {
  const firestoreSimple = new FirestoreSimple(firestore)
  const dao = firestoreSimple.collection<User>({ path: `${ROOT_PATH}/user` })

  // Setup user
  const userId = await dao.add({ coin: 100, timestamp: admin.firestore.FieldValue.serverTimestamp() })
  console.log(await dao.fetch(userId))
  // { id: 'E4pROVpeLaE3WBCYDDSh',
  // coin: 100,
  // timestamp: Timestamp { _seconds: 1560666401, _nanoseconds: 198000000 } }

  // Add 100 coin and update timestamp
  await dao.update({
    id: userId,
    coin: admin.firestore.FieldValue.increment(100),
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  })
  console.log(await dao.fetch(userId))
  // { id: 'E4pROVpeLaE3WBCYDDSh',
  //   coin: 200,
  //   timestamp: Timestamp { _seconds: 1560666401, _nanoseconds: 731000000 } }

  // clean
  const docs = await dao.fetchAll()
  await dao.bulkDelete(docs.map((doc) => doc.id))
}

main()

import admin, { ServiceAccount } from 'firebase-admin'
import serviceAccount from '../../firebase_secret.json' // prepare your firebase secret json before exec example
import { FirestoreSimple } from '../../src'
import { FieldValue } from '@google-cloud/firestore';

const ROOT_PATH = 'example/ts_admin_basic'

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as ServiceAccount),
})
const firestore = admin.firestore()

interface User {
  id: string,
  coin: number,
  timestamp: Date,
}

const main = async () => {
  const firestoreSimple = new FirestoreSimple(firestore)
  const dao = firestoreSimple.collection<User>({ path: `${ROOT_PATH}/user` })

  // Setup user
  const userId = await dao.add({ coin: 100, timestamp: FieldValue.serverTimestamp() })
  console.log(await dao.fetch(userId))
  // { id: 'E4pROVpeLaE3WBCYDDSh',
  // coin: 100,
  // timestamp: Timestamp { _seconds: 1560666401, _nanoseconds: 198000000 } }

  // Add 100 coin and update timestamp
  await dao.update({
    id: userId,
    coin: FieldValue.increment(100),
    timestamp: FieldValue.serverTimestamp()
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

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

const ROOT_PATH = 'example/admin_pagination'

interface Doc {
  id: string,
  name: string,
  order: number,
}

const main = async () => {
  const docs = [
    { id: '1', name: 'a', order: 1 },
    { id: '2', name: 'b', order: 2 },
    { id: '3', name: 'b', order: 3 },
    { id: '4', name: 'c', order: 4 },
    { id: '5', name: 'd', order: 5 },
    { id: '6', name: 'd', order: 6 },
    { id: '7', name: 'f', order: 7 },
  ]
  const firestoreSimple = new FirestoreSimple(firestore)
  const dao = firestoreSimple.collection<Doc>({ path: `${ROOT_PATH}/docs` })
  await dao.bulkSet(docs)

  let result

  console.log('--Real pagination sample--')
  const query = dao.orderBy('name').limit(2) // prepare base query
  result = await query.fetch()
  console.log(result)
  // [ { id: '1', order: 1, name: 'a' },
  //   { id: '2', order: 2, name: 'b' } ]

  const lastVisible = result[result.length - 1] // get last visible doc
  const lastVisibleSnapshot = await dao.docRef(lastVisible.id).get()

  result = await query.startAfter(lastVisibleSnapshot).fetch()
  console.log(result)
  // [ { id: '3', order: 3, name: 'b' },
  //   { id: '4', name: 'c', order: 4 } ]

  console.log('--startAt--')
  result = await dao.orderBy('name').startAt('b').fetch()
  console.log(result)
  // [ { id: '2', name: 'b', order: 2 },
  //   { id: '3', order: 3, name: 'b' },
  //   { id: '4', order: 4, name: 'c' },
  //   { id: '5', order: 5, name: 'd' },
  //   { id: '6', name: 'd', order: 6 },
  //   { id: '7', name: 'f', order: 7 } ]

  console.log('--startAfter--')
  result = await dao.orderBy('name').startAfter('b').fetch()
  console.log(result)
  // [ { id: '4', order: 4, name: 'c' },
  //   { id: '5', order: 5, name: 'd' },
  //   { id: '6', name: 'd', order: 6 },
  //   { id: '7', order: 7, name: 'f' } ]

  console.log('--endAt--')
  result = await dao.orderBy('name').endAt('d').fetch()
  console.log(result)
  // [ { id: '1', name: 'a', order: 1 },
  //   { id: '2', name: 'b', order: 2 },
  //   { id: '3', order: 3, name: 'b' },
  //   { id: '4', name: 'c', order: 4 },
  //   { id: '5', name: 'd', order: 5 },
  //   { id: '6', name: 'd', order: 6 } ]

  console.log('--endBefore--')
  result = await dao.orderBy('name').endBefore('d').fetch()
  console.log(result)
  // [ { id: '1', order: 1, name: 'a' },
  //   { id: '2', name: 'b', order: 2 },
  //   { id: '3', order: 3, name: 'b' },
  //   { id: '4', name: 'c', order: 4 } ]

  console.log('--startAt, endBefore--')
  result = await dao.orderBy('name').startAt('b').endBefore('f').fetch()
  console.log(result)
  // [ { id: '2', name: 'b', order: 2 },
  //   { id: '3', name: 'b', order: 3 },
  //   { id: '4', order: 4, name: 'c' },
  //   { id: '5', name: 'd', order: 5 },
  //   { id: '6', order: 6, name: 'd' } ]

  console.log('--startAt using document snapshot--')
  const startSnapshot = await dao.docRef('4').get()
  result = await dao.orderBy('name').startAt(startSnapshot).fetch()
  console.log(result)
  // [ { id: '4', order: 4, name: 'c' },
  //   { id: '5', order: 5, name: 'd' },
  //   { id: '6', order: 6, name: 'd' },
  //   { id: '7', order: 7, name: 'f' } ]

  console.log('--endAt multi values--')
  result = await dao
    .orderBy('name')
    .orderBy('order')
    .endAt('d', 5).fetch()
  console.log(result)
  // [ { id: '1', name: 'a', order: 1 },
  //   { id: '2', order: 2, name: 'b' },
  //   { id: '3', name: 'b', order: 3 },
  //   { id: '4', name: 'c', order: 4 },
  //   { id: '5', name: 'd', order: 5 } ]

  await dao.bulkDelete(docs.map((doc) => doc.id))
}

main()

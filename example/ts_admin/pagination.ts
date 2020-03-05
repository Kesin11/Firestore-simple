import admin, { ServiceAccount } from 'firebase-admin'
import { FirestoreSimpleAdmin } from '../../src'
import serviceAccount from '../../firebase_secret.json' // prepare your firebase secret json before exec example

const ROOT_PATH = 'example/pagination'

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as ServiceAccount),
})
const firestore = admin.firestore()

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
  const firestoreSimple = new FirestoreSimpleAdmin(firestore)
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

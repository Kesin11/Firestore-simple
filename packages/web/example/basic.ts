import * as firebase from 'firebase/app'
import 'firebase/firestore'
import { FirestoreSimple } from '../src/'
import { WebFirestoreTestUtil } from '../__tests__/util'

//
// Start Firestore local emulator in background before start this script.
// `npx firebase emulators:start --only firestore`
//

// hack for using local emulator
const util = new WebFirestoreTestUtil()
const firestore = util.webFirestore

const ROOT_PATH = 'example/web_basic'

interface User {
  id: string,
  name: string,
  age: number,
}

const main = async () => {
  // declaration
  const firestoreSimple = new FirestoreSimple(firestore)
  const dao = firestoreSimple.collection<User>({ path: `${ROOT_PATH}/user` })

  // add
  const bobId = await dao.add({ name: 'bob', age: 20 })

  // fetch(get)
  const bob: User | undefined = await dao.fetch(bobId)
  console.log(bob)
  // { id: '3Y5jwT8pB4cMqS1n3maj', age: 20, name: 'bob' }
  if (!bob) return

  // update
  await dao.set({
    id: bobId,
    name: 'bob',
    age: 30, // update 20 -> 30
  })

  // add or set
  // same as 'add' when id is not given
  const aliceId = await dao.addOrSet({ name: 'alice', age: 22 })
  // same as 'set' when id is given
  await dao.addOrSet({
    id: aliceId,
    name: 'alice',
    age: 30, // update 22 -> 30
  })
  const alice: User | undefined = await dao.fetch(aliceId)
  console.log(alice)
  // { name: 'alice', age: 30, id: 'YdfB2rkXoid603nKRX65' }

  // delete
  const deletedId = await dao.delete(bobId)
  console.log(deletedId)
  // 3Y5jwT8pB4cMqS1n3maj

  await dao.delete(aliceId)

  // multi set
  // `bulkSet` and `bulkDelete` are wrapper for WriteBatch
  const _bulkSetBatch = await dao.bulkSet([
    { id: '1', name: 'foo', age: 1 },
    { id: '2', name: 'bar', age: 2 },
  ])

  // multi fetch
  const users: User[] = await dao.fetchAll()
  console.log(users)
  // [
  //   { id: '1', name: 'foo', age: 1 },
  //   { id: '2', name: 'bar', age: 2 },
  // ]

  // fetch by query
  const fetchedByQueryUser: User[] = await dao.where('age', '>=', 1)
    .orderBy('age')
    .limit(1)
    .fetch()
  console.log(fetchedByQueryUser)
  // [ { id: '1', name: 'foo', age: 1 } ]

  // multi delete
  const _deletedDocBatch = await dao.bulkDelete(users.map((user) => user.id))
}

main()

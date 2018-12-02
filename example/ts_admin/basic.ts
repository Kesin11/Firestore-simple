import admin, { ServiceAccount } from 'firebase-admin'
import serviceAccount from '../../firebase_secret.json'
import { FirestoreSimple } from '../../src'

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as ServiceAccount),
})
const firestore = admin.firestore()
firestore.settings({ timestampsInSnapshots: true })

interface User {
  id: string,
  name: string,
  age: number,
}

const main = async () => {
  // declaration
  const dao = new FirestoreSimple<User>({ firestore, path: 'example/ts_admin/user' })

  // create
  const user: User = await dao.add({ name: 'bob', age: 20 })
  console.log(user)
  // { name: 'bob', age: 20, id: '3Y5jwT8pB4cMqS1n3maj' }

  // fetch
  let bob: User | undefined = await dao.fetch(user.id)
  console.log(bob)
  // { id: '3Y5jwT8pB4cMqS1n3maj', age: 20, name: 'bob' }
  if (!bob) return

  // update
  bob.age = 30
  bob = await dao.set(bob)

  // add or set
  // same as 'add' when id is not given
  let alice: User = await dao.addOrSet({ name: 'alice', age: 22 })
  console.log(alice)
  // { name: 'alice', age: 22, id: 'YdfB2rkXoid603nKRX65' }

  alice.age = 30
  alice = await dao.addOrSet(alice)
  console.log(alice)
  // { name: 'alice', age: 30, id: 'YdfB2rkXoid603nKRX65' }

  // delete
  const deletedId = await dao.delete(bob.id)
  console.log(deletedId)
  // 3Y5jwT8pB4cMqS1n3maj

  await dao.delete(alice.id)

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
  //   { id: '2', age: 2, name: 'bar' },
  // ]

  // fetch by query
  const fetchedByQueryUser: User[] = await dao.where('age', '>=', 1)
                                .orderBy('age')
                                .limit(1)
                                .get()
  console.log(fetchedByQueryUser)
  // [ { id: '1', name: 'foo', age: 1 } ]

  // multi delete
  const _deletedDocBatch = await dao.bulkDelete(users.map((user) => user.id))
}

main()

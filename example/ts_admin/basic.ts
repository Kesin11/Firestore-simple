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
  created: Date
}

const main = async () => {
  // declaration
  const dao = new FirestoreSimple<User>({ firestore, path: 'example/ts_admin/user',
    decode: (doc) => {
      return {
        id: doc.id,
        name: doc.name,
        age: doc.age,
        created: doc.created.toDate(),
      }
    },
  })

  // create
  const user = await dao.add({ name: 'bob', age: 20, created: new Date() })
  console.log('add', user)
  const userId = user.id

  // single fetch
  let bob = await dao.fetch(userId)
  console.log('fetch', user)
  if (!bob) return

  // update
  bob.age = 30
  bob = await dao.set(bob)

  // delete
  const _deletedId = await dao.delete(bob.id)

  // add or set
  let alice = await dao.addOrSet({ name: 'alice', age: 22, created: new Date() })
  console.log('addOrSer', alice)
  alice.age = 30
  alice = await dao.addOrSet(alice)

  // multi set
  const _bulkSetBatch = await dao.bulkSet([
    { id: '1', name: 'foo', age: 1, created: new Date() },
    { id: '2', name: 'bar', age: 2, created: new Date() },
  ])

  // multi fetch
  const users = await dao.fetchAll()
  console.log('fetchAll', users)

  // fetch by query
  const _fetchedByQueryUser = await dao.where('age', '>=', '20')
                                .orderBy('age')
                                .limit(1)
                                .get()

  // multi delete
  const _deletedDocBatch = await dao.bulkDelete(users.map((user) => user.id))

//   // convert before store to firestore
//   const encode = (obj: User): {[props: string]: any} => {
//     return {
//       id: doc.id,
//       name: doc.name,
//       age: doc.age + 10, // fix value
//       created_at: doc.created_at, // convert key name
//     }
//   })
//   // convert after fetch from firestore
//   const decode = (doc: {id: string, [prop: string]: any}): User => {
//     return {
//       id: doc.id,
//       name: doc.name,
//       age: doc.age - 10, // fix value
//       createdAt: doc.created_at, // convert key name
//     }
//   })
//   const dao = new FirestoreSimple<User>({ firestore, path: 'users', encode, decode })

//   // doc or collection reference
//   // decodeを活用してやってほしい。自動でネストを展開してしまうとネストが深いときによきせずメモリ食う可能性があるのであまり積極的にサポートしたくない

//   // sub collection
//   // 難しそう。docの要素とは別枠扱いなので、コンストラクタでネストさせればできそう？
//   const dao = new FirestoreSimple<User>({firestore, path: 'users', subcollection: {
//     books: new FirestoreSimple<Book>({ firestore, path: 'users/${id}/books' }),
//   }})
//   dao
//     .find(1) // user
//     .find(2) // book
// }
}

main()

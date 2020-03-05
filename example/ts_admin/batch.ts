import admin, { ServiceAccount } from 'firebase-admin'
import serviceAccount from '../../firebase_secret.json' // your firebase secret json
import { FirestoreSimpleAdmin } from '../../src'

const ROOT_PATH = 'example/ts_admin_transaction'

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as ServiceAccount),
})
const firestore = admin.firestore()

interface User {
  id: string,
  name: string,
  rank: number,
}
const userNames = ['bob', 'alice', 'john', 'meary', 'king']

const main = async (): Promise<void> => {
  const firestoreSimple = new FirestoreSimpleAdmin(firestore)
  const userDao = firestoreSimple.collection<User>({ path: `${ROOT_PATH}/user` })

  // add() convert batch.add() inside runBatch and batch.commit()
  await firestoreSimple.runBatch(async (_batch) => {
    let rank = 1
    for (const name of userNames) {
      await userDao.add({ name, rank })
      rank += 1
    }
    console.dir(await userDao.fetchAll()) // empty
  })
  // Exec batch.commit() automatically when end runBatch.

  let users = await userDao.orderBy('rank').fetch()
  console.dir(users)
  // [ { id: '5ouYv8W5yiku0ztWtqA0', name: 'bob', rank: 1 },
  // { id: 'PvoggKKdthKQgAFXtQb3', name: 'alice', rank: 2 },
  // { id: '6E9oCximPhqN9uvNnPVi', name: 'john', rank: 3 },
  // { id: 'PLv2JLyBRpkq7Xn6F23g', name: 'meary', rank: 4 },
  // { id: 'PIWntOJi4YM1IkpG4lLG', name: 'king', rank: 5 } ]

  // Can use update() and delete() also set().
  await firestoreSimple.runBatch(async (_batch) => {
    let rank = 0
    for (const user of users) {
      if (user.rank < 4) {
        // Update rank to zero start
        await userDao.update({ id: user.id, rank })
      } else {
        // Delete 'meary' and 'king'
        await userDao.delete(user.id)
      }
      rank += 1
    }
  })

  users = await userDao.orderBy('rank').fetch()
  console.dir(users)
  // [ { id: '5ouYv8W5yiku0ztWtqA0', name: 'bob', rank: 0 },
  // { id: 'PvoggKKdthKQgAFXtQb3', name: 'alice', rank: 1 },
  // { id: '6E9oCximPhqN9uvNnPVi', name: 'john', rank: 2 } ]

  // Remove documents
  await userDao.bulkDelete(users.map((user) => user.id))
}
main()

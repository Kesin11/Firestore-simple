import admin, { ServiceAccount } from 'firebase-admin'
import serviceAccount from '../../firebase_secret.json'
import { FirestoreSimple } from '../../src'

const ROOT_PATH = 'example/ts_admin_encode_decode'

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as ServiceAccount),
})
const firestore = admin.firestore()

class User {
  constructor(
    public id: string,
    public name: string,
    public created: Date,
    public updated?: Date,
  ) { }
}

const main = async () => {
  const firestoreSimple = new FirestoreSimple(firestore)
  const dao = firestoreSimple.collection<User>({
    path: `${ROOT_PATH}/user`,
    encode: (user) => {
      return {
        name: user.name,
        created: user.created,
        updated: admin.firestore.FieldValue.serverTimestamp() // Using Firebase server timestamp when set document
      }
    },
    decode: (doc) => {
      return new User(
        doc.id,
        doc.name,
        doc.created.toDate(), // Convert Firebase timestamp to js date object
        doc.updated.toDate()
      )
    }
  })

  let user: User | undefined
  // add
  const userId = await dao.add({ name: 'bob', created: new Date() })

  // fetch
  // 'updated' is added automatically.
  user = await dao.fetch(userId)
  console.log(user)
  // User {
  //   id: 'bSaICakQ59u62Qhsn2wA',
  //   name: 'bob',
  //   created: 2019-05-07T15:24:46.562Z,
  //   updated: 2019-05-07T15:24:47.185Z }
  if (!user) return

  // set
  user.name = 'alice'
  await dao.set(user)

  // fetch
  // 'updated' is updated automatically.
  user = await dao.fetch(userId)
  console.log(user)
  // User {
  //   id: 'bSaICakQ59u62Qhsn2wA',
  //   name: 'alice',
  //   created: 2019-05-07T15:24:46.562Z,
  //   updated: 2019-05-07T15:24:47.627Z }
  if (!user) return

  await dao.delete(userId)
}

main()

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
  user = await dao.add({ name: 'bob', created: new Date() })
  console.log(user)
  // TODO after fix return value of add()

  // fetch
  user = await dao.fetch(user.id)
  console.log(user)
  if (!user) return

  // update
  user.name = 'alice'
  user = await dao.set(user)
  console.log(user)

  // fetch
  user = await dao.fetch(user.id)
  console.log(user)
  if (!user) return

  await dao.delete(user.id)
}

main()

import firebase from 'firebase/app'
import 'firebase/firestore'
import { FirestoreSimple } from '../src/'

//
// Start Firestore local emulator in background before start this script.
// `npm run emulators:start`
// or `npx firebase emulators:start --only firestore`
//

const app = firebase.initializeApp({
  projectId: 'example'
})
const firestore = firebase.firestore()
firestore.useEmulator('localhost', 8080)

const ROOT_PATH = 'example/web_encode_decode'

class User {
  constructor (
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
        updated: firebase.firestore.FieldValue.serverTimestamp() // Using Firebase server timestamp when set document
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

  await app.delete()
}

main()

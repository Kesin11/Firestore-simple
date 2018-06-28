const admin = require('firebase-admin')
const { FirestoreSimple } = require ('firestore-simple')
const serviceAccount = require('./firebase_secret.json')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const main3 = async () => {
  const firestore = admin.firestore()
  const collectionPath = 'blog_origin_user'
  const dao = new FirestoreSimple(firestore, collectionPath)
  dao.collectionRef.onSnapshot((snapshot) => {
    snapshot.docChanges.forEach((change) =>{
      console.log(change.type)
      console.log(change.doc.data())
    })
  })
  await dao.add({ name: 'alice', age: 20})
  await dao.add({ name: 'bob', age: 22 })
  const users = await dao.fetchCollection()

  const ids = users.map((user) => user.id)
  await dao.bulkDelete(ids)
}
main3()

const main = async () => {
  const firestore = admin.firestore()
  const collectionPath = 'blog_origin_user'
  const dao = new FirestoreSimple(firestore, collectionPath)
  await dao.add({ name: 'alice', age: 20})
  await dao.add({ name: 'bob', age: 22 })

  const users = await dao.fetchCollection()
  console.log(users)

  const ids = users.map((user) => user.id)
  await dao.bulkDelete(ids)
}
main()

const main2 = async () => {
  const firestore = admin.firestore()
  const collectionPath = 'blog_origin_user_mapping'
  const dao = new FirestoreSimple(firestore, collectionPath, { mapping: {
    createdAt: "created_at"
  }})
  await dao.add({ name: 'alice', age: 20, createdAt: new Date() })
  await dao.add({ name: 'bob', age: 22, createdAt: new Date() })

  const users = await dao.fetchCollection()
  console.log(users)

  const ids = users.map((user) => user.id)
  await dao.bulkDelete(ids)
}
main2()
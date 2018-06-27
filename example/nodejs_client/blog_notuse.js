const admin = require('firebase-admin')
const serviceAccount = require('./firebase_secret.json')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const main = async () => {
  const firestore = admin.firestore()
  const collectionPath = 'blog_origin_user'
  await firestore.collection(collectionPath).add({ name: 'alice', age: 20 })
  await firestore.collection(collectionPath).add({ name: 'bob', age: 22 })

  const user_documents = await firestore.collection(collectionPath).get()
  const users = []
  user_documents.forEach((document) => {
    const data = document.data()
    users.push({ id: document.id, name: data.name, age: data.age })
  })
  console.log(users)

  const batch = firestore.batch()
  users.forEach((user) => {
    const documentRef = firestore.collection(collectionPath).doc(user.id)
    batch.delete(documentRef)
  })
  await batch.commit()

}
main()
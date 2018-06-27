const functions = require('firebase-functions');
const admin = require('firebase-admin')
const { FirestoreSimple } = require('firestore-simple')
admin.initializeApp()

exports.helloFirestore = functions.https.onRequest((request, response) => {
  const firestore = admin.firestore()
  const dao = new FirestoreSimple(firestore, 'cloud_function')
  dao.add({ name: 'alice', age: 20}).then(doc => {
    console.log(doc)
    return response.send("add { name: " + doc.name + ", age: " + doc.age + "}")
  })
})

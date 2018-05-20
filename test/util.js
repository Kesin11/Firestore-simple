const crypto = require('crypto')
const admin = require('firebase-admin')
// because this file path will be dist_test/test/util.js after tsc
const serviceAccount = require('../../firebase_secret.json')

const initFirestore = () => {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })
  return admin.firestore()
}

const deleteCollection = async (db, collectionPath) => {
  const batch = db.batch()
  const snapshot = await db.collection(collectionPath).get()
  snapshot.forEach(doc => {
    batch.delete(doc.ref)
  })
  await batch.commit()
}

const createRandomCollectionName = (prefix = 'firebase_simple_') => {
  const str = crypto.randomBytes(10).toString('hex')
  return prefix + str
}

module.exports = {
  initFirestore,
  deleteCollection,
  createRandomCollectionName,
}

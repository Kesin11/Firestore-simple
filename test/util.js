const crypto = require('crypto')

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
  deleteCollection,
  createRandomCollectionName,
}

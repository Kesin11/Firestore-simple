const deleteCollection = async (db, collectionPath) => {
  const batch = db.batch()
  const snapshot = await db.collection(collectionPath).get()
  snapshot.forEach(doc => {
    batch.delete(doc.ref)
  })
  await batch.commit()
}

module.exports = { deleteCollection }

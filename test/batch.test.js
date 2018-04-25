const admin = require('firebase-admin')
const serviceAccount = require('../firebase_secret.json')
const test = require('ava')
const { FirestoreSimple } = require('../src/index.js')
const { deleteCollection } = require('./util')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const db = admin.firestore()
const dao = new FirestoreSimple(db, 'test_collection_batch')

// Delete all documents. (= delete collection)
test.after.always(async t => {
  await deleteCollection(db, 'test_collection_batch')
})

test('setMulti', async t => {
  const docs = [
    {id: 'test1', title: 'aaa'},
    {id: 'test2', title: 'bbb'},
    {id: 'test3', title: 'ccc'},
  ]
  await dao.setMulti(docs)

  const actualDocs = await dao.fetchCollection()
  t.deepEqual(actualDocs, docs, 'success set multi docs')
})

test('deleteMulti', async t => {
  const docs = [
    {id: 'test1', title: 'aaa'},
    {id: 'test2', title: 'bbb'},
    {id: 'test3', title: 'ccc'},
  ]
  await dao.set(docs[0])
  await dao.set(docs[1])
  await dao.set(docs[2])

  const docIds = docs.map((docs) => docs.id)
  await dao.deleteMulti(docIds)

  const actualDocs = await dao.fetchCollection()
  t.deepEqual(actualDocs, [], 'success delete multi docs')
})

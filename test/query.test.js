const admin = require('firebase-admin')
const serviceAccount = require('../firebase_secret.json')
const test = require('ava')
const { FirestoreSimple } = require('../src/index.js')
const { deleteCollection } = require('./util')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const db = admin.firestore()
const dao = new FirestoreSimple(db, 'test_collection')
const existsDocId = 'test'
const existsDoc = {
  title: 'title',
  url: 'http://example.com',
}

test.before(async t => {
  await dao.collectionRef.doc(existsDocId).set(existsDoc)
  await dao.collectionRef.add({ title: 'aaa', order: 2 })
  await dao.collectionRef.add({ title: 'aaa', order: 1 })
  await dao.collectionRef.add({ title: 'bbb', order: 3 })
  await dao.collectionRef.add({ title: 'ccc', order: 4 })
})

// Delete all documents. (= delete collection)
test.after.always(async t => {
  await deleteCollection(db, 'test_collection')
})

test('where', async t => {
  const queryTitle = 'aaa'
  const query = dao.collectionRef.where('title', '=', queryTitle)
  const docs = await dao.fetchByQuery(query)

  const actualTitles = docs.map((doc) => doc.title)
  t.deepEqual(actualTitles, [queryTitle, queryTitle], 'where =')
})

test('order by', async t => {
  const query = dao.collectionRef.orderBy('order', 'desc')
  const docs = await dao.fetchByQuery(query)

  const actualOrders = docs.map((doc) => doc.order)
  t.deepEqual(actualOrders, [4, 3, 2, 1], 'order by desc')
})

test('limit', async t => {
  const query = dao.collectionRef.limit(1)
  const docs = await dao.fetchByQuery(query)

  t.is(docs.length, 1)
})

test('composition where + limit', async t => {
  const queryTitle = 'aaa'
  const query = dao.collectionRef
    .where('title', '=', queryTitle)
    .limit(1)

  const docs = await dao.fetchByQuery(query)
  t.is(docs.length, 1, 'limit')

  const doc = docs[0]
  t.is(doc.title, queryTitle, 'where')
})

test('composition order + limit', async t => {
  const query = dao.collectionRef
    .orderBy('order')
    .limit(2)

  const docs = await dao.fetchByQuery(query)
  t.is(docs.length, 2, 'limit')

  const actualOrders = docs.map((doc) => doc.order)
  t.deepEqual(actualOrders, [1, 2], 'order by')
})

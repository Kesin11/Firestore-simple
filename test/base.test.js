const admin = require('firebase-admin')
const serviceAccount = require('../firebase_secret.json')
const test = require('ava')
const { FirestoreSimple } = require('../src/index.js')
const { deleteCollection } = require('./util')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const db = admin.firestore()
const dao = new FirestoreSimple(db, 'test_collection_base')
const existsDocId = 'test'
const existsDoc = {
  title: 'title',
  url: 'http://example.com',
}

// Add fix id document and random id document
test.before(async t => {
  await dao.collectionRef.doc(existsDocId).set(existsDoc)
  await dao.collectionRef.add({
    title: 'before',
    url: 'http://example.com/before',
  })
})

// Delete all documents. (= delete collection)
test.after.always(async t => {
  await deleteCollection(db, 'test_collection_base')
})

test('fetchDocument', async t => {
  const doc = await dao.fetchDocument(existsDocId)
  const expectDoc = Object.assign({}, existsDoc, {id: existsDocId})

  t.deepEqual(doc, expectDoc)
})

test('fetchCollection', async t => {
  const docs = await dao.fetchCollection()

  t.true(docs.length >= 2)
})

test('add', async t => {
  const doc = {
    title: 'add',
    url: 'http://example.com/add',
  }
  const addedDoc = await dao.add(doc)
  t.deepEqual(Object.assign({}, {
    title: addedDoc.title,
    url: addedDoc.url,
  }), doc, 'return object')

  const fetchedDoc = await dao.fetchDocument(addedDoc.id)
  t.deepEqual(addedDoc, fetchedDoc, 'fetched object')
})

test('set', async t => {
  const addedDoc = await dao.collectionRef.add({
    title: 'hogehoge',
    url: 'http://example.com/hogehoge',
  })
  const setDoc = {
    id: addedDoc.id,
    title: 'set',
    url: 'http://example.com/set',
  }
  const setedDoc = await dao.set(setDoc)
  t.deepEqual(setedDoc, setDoc, 'return object')

  const fetchedDoc = await dao.fetchDocument(addedDoc.id)
  t.deepEqual(fetchedDoc, setDoc, 'fetched object')
})

test('set without id', async t => {
  await t.throws(
    dao.set({
      title: 'set',
      url: 'http://example.com/set',
    })
  )
})

test('delete', async t => {
  const doc = {
    title: 'add',
    url: 'http://example.com/add',
  }
  const addedDoc = await dao.add(doc)

  await dao.delete(addedDoc.id)
  const snapshot = await dao.collectionRef.doc(addedDoc.id).get()

  t.false(snapshot.exists)
})

const test = require('ava')
const { FirestoreSimple } = require('../src/index.js')
const { deleteCollection, createRandomCollectionName, initFirestore } = require('./util')

const db = initFirestore()
const collectionPath = createRandomCollectionName()
const dao = new FirestoreSimple(db, collectionPath)

// Delete all documents. (= delete collection)
test.after.always(async t => {
  await deleteCollection(db, collectionPath)
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

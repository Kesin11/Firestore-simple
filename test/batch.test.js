const test = require('ava')
const { FirestoreSimple } = require('../dist/index.js')
const { deleteCollection, createRandomCollectionName, initFirestore } = require('./util')

const db = initFirestore()
const collectionPath = createRandomCollectionName()
const dao = new FirestoreSimple(db, collectionPath, {
  bookTitle: "book_title",
})

// Delete all documents. (= delete collection)
test.after.always(async t => {
  await deleteCollection(db, collectionPath)
})

test('bulkSet', async t => {
  const docs = [
    {id: 'test1', bookTitle: 'aaa'},
    {id: 'test2', bookTitle: 'bbb'},
    {id: 'test3', bookTitle: 'ccc'},
  ]
  await dao.bulkSet(docs)

  const actualDocs = await dao.fetchCollection()
  t.deepEqual(actualDocs, docs, 'success set multi docs')
})

test('bulkDelete', async t => {
  const docs = [
    {id: 'test1', bookTitle: 'aaa'},
    {id: 'test2', bookTitle: 'bbb'},
    {id: 'test3', bookTitle: 'ccc'},
  ]
  await dao.set(docs[0])
  await dao.set(docs[1])
  await dao.set(docs[2])

  const docIds = docs.map((docs) => docs.id)
  await dao.bulkDelete(docIds)

  const actualDocs = await dao.fetchCollection()
  t.deepEqual(actualDocs, [], 'success delete multi docs')
})

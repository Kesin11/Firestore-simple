import test from 'ava'
import { FirestoreSimpleV2 } from '../../src/v2'
import { createRandomCollectionName, deleteCollection, initFirestore } from './util'

interface TestDoc {
  id: string,
  title: string,
  order: number
}

const firestore = initFirestore()
const collectionPath = createRandomCollectionName()
const dao = new FirestoreSimpleV2<TestDoc>({ firestore, path: collectionPath })

test.before(async (_t) => {
  await dao.collectionRef.add({ title: 'aaa', order: 2 })
  await dao.collectionRef.add({ title: 'aaa', order: 1 })
  await dao.collectionRef.add({ title: 'bbb', order: 3 })
  await dao.collectionRef.add({ title: 'ccc', order: 4 })
})

// Delete all documents. (= delete collection)
test.after.always(async (_t) => {
  await deleteCollection(firestore, collectionPath)
})

test('where', async (t) => {
  const queryTitle = 'aaa'
  const docs = await dao.where('title', '==', queryTitle).get()

  const actualTitles = docs.map((doc) => doc.title)
  t.deepEqual(actualTitles, [queryTitle, queryTitle], 'where =')
})

test('order by', async (t) => {
  const docs = await dao.orderBy('order', 'desc').get()

  const actualOrders = docs.map((doc) => doc.order)
  t.deepEqual(actualOrders, [4, 3, 2, 1], 'order by desc')
})

test('limit', async (t) => {
  const limit = 1
  const docs = await dao.limit(limit).get()

  t.is(docs.length, limit)
})

test('composition where + limit', async (t) => {
  const queryTitle = 'aaa'
  const limit = 1
  const docs = await dao
    .where('title', '==', queryTitle)
    .limit(limit)
    .get()

  t.is(docs.length, limit, 'limit')

  const doc = docs[0]
  t.is(doc.title, queryTitle, 'where')
})

test('composition order + limit', async (t) => {
  const limit = 2
  const query = await dao
    .orderBy('order')
    .limit(limit)

  const docs = await dao.fetchByQuery(query)
  t.is(docs.length, limit, 'limit')

  const actualOrders = docs.map((doc) => doc.order)
  t.deepEqual(actualOrders, [1, 2], 'order by')
})

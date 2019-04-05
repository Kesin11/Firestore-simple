import test from 'ava'
import { FirestoreSimple } from '../src'
import { createRandomCollectionName, deleteCollection, initFirestore } from './util'

interface TestDoc {
  id: string,
  title: string,
}

const firestore = initFirestore()
const collectionPath = createRandomCollectionName()
const firestoreSimple = new FirestoreSimple(firestore)
const dao = firestoreSimple.collection<TestDoc>({ path: collectionPath })

// Delete all documents. (= delete collection)
test.after.always(async (_t) => {
  await deleteCollection(firestore, collectionPath)
})

test('bulkSet', async (t) => {
  const docs = [
    { id: 'test1', title: 'aaa' },
    { id: 'test2', title: 'bbb' },
    { id: 'test3', title: 'ccc' },
  ]
  await dao.bulkSet(docs)

  const actualDocs = await dao.fetchCollection()
  t.deepEqual(actualDocs, docs, 'success set multi docs')
})

test('bulkDelete', async (t) => {
  const docs = [
    { id: 'test1', title: 'aaa' },
    { id: 'test2', title: 'bbb' },
    { id: 'test3', title: 'ccc' },
  ]
  await dao.set(docs[0])
  await dao.set(docs[1])
  await dao.set(docs[2])

  const docIds = docs.map((doc) => doc.id)
  await dao.bulkDelete(docIds)

  const actualDocs = await dao.fetchCollection()
  t.deepEqual(actualDocs, [], 'success delete multi docs')
})

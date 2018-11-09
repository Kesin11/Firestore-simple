import test from 'ava'
import { FirestoreSimpleV2 } from '../src/v2'
import { createRandomCollectionName, deleteCollection, initFirestore } from './util'

interface TestDoc {
  id: string,
  title: string,
  url: string
}

const firestore = initFirestore()
const collectionPath = createRandomCollectionName()
const dao = new FirestoreSimpleV2<TestDoc>({ firestore, path: collectionPath })
const existsDocId = 'test'
const existsDoc = {
  title: 'title',
  url: 'http://example.com',
}

// Add fix id document and random id document
test.before(async (_t) => {
  await dao.collectionRef.doc(existsDocId).set(existsDoc)
  await dao.collectionRef.add({
    title: 'before',
    url: 'http://example.com/before',
  })
})

// Delete all documents. (= delete collection)
test.after.always(async (_t) => {
  await deleteCollection(firestore, collectionPath)
})

test('fetch with exists document', async (t) => {
  const doc = await dao.fetch(existsDocId)
  const expectDoc = { ...existsDoc, ...{ id: existsDocId } }

  t.deepEqual(doc, expectDoc)
})

test('fetch with not exists document', async (t) => {
  const doc = await dao.fetch('not_exists_document_id')

  t.is(doc, undefined)
})

test('fetchAll', async (t) => {
  const docs = await dao.fetchAll()

  t.true(docs.length >= 2)
})

test('add', async (t) => {
  const doc = {
    title: 'add',
    url: 'http://example.com/add',
  }
  const addedDoc = await dao.add(doc)
  t.truthy(addedDoc.id)
  t.deepEqual({...{
    title: addedDoc.title,
    url: addedDoc.url,
  }}, doc, 'return added object')

  const fetchedDoc = await dao.fetch(addedDoc.id)
  t.deepEqual(addedDoc, fetchedDoc, 'fetched object')
})

test('set', async (t) => {
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

  const fetchedDoc = await dao.fetch(addedDoc.id)
  t.deepEqual(fetchedDoc, setDoc, 'fetched object')
})

test('addOrSet', async (t) => {
  // add
  const doc = {
    title: 'add',
    url: 'http://example.com/add',
  }
  const addedDoc = await dao.addOrSet(doc)
  t.truthy(addedDoc.id)
  t.deepEqual({...{
    title: addedDoc.title,
    url: addedDoc.url,
  }}, doc, 'return added object')

  const fetchedAddDoc = await dao.fetchDocument(addedDoc.id)
  t.deepEqual(addedDoc, fetchedAddDoc, 'fetched added object')

  // set
  const setDoc = {
    id: addedDoc.id,
    title: 'set',
    url: 'http://example.com/set',
  }
  const setedDoc = await dao.addOrSet(setDoc)
  t.deepEqual(setedDoc, setDoc, 'return seted object')

  const fetchedSetDoc = await dao.fetchDocument(addedDoc.id)
  t.deepEqual(fetchedSetDoc, setDoc, 'fetched set object')
})

test('delete', async (t) => {
  const doc = {
    title: 'add',
    url: 'http://example.com/add',
  }
  const addedDoc = await dao.add(doc)

  await dao.delete(addedDoc.id)
  const snapshot = await dao.collectionRef.doc(addedDoc.id).get()

  t.false(snapshot.exists)
})

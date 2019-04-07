import { FirestoreSimple } from '../src'
import { createRandomCollectionName, deleteCollection, initFirestore } from './util'

interface TestDoc {
  id: string,
  title: string,
  url: string
}

const firestore = initFirestore()
const collectionPath = createRandomCollectionName()
const firestoreSimple = new FirestoreSimple(firestore)

describe('Basic', () => {
  const dao = firestoreSimple.collection<TestDoc>({ path: collectionPath })
  const existsDocId = 'test'
  const existsDoc = {
    title: 'title',
    url: 'http://example.com',
  }
  // Add fix id document and random id document
  beforeEach(async () => {
    await dao.collectionRef.doc(existsDocId).set(existsDoc)
    await dao.collectionRef.add({
      title: 'before',
      url: 'http://example.com/before',
    })
  })

  // Delete all documents. (= delete collection)
  afterEach(async () => {
    await deleteCollection(firestore, collectionPath)
  })

  describe('fetch', () => {
    it('exists document', async () => {
      const doc = await dao.fetch(existsDocId)
      const expectDoc = { ...existsDoc, ...{ id: existsDocId } }

      expect(doc).toEqual(expectDoc)
    })

    it('does not exist document', async () => {
      const doc = await dao.fetch('not_exists_document_id')

      expect(doc).toEqual(undefined)
    })

    it('fetchAll', async () => {
      const docs = await dao.fetchAll()

      expect(docs.length).toBeGreaterThanOrEqual(2)
    })
  })

  it('add', async () => {
    const doc = {
      title: 'add',
      url: 'http://example.com/add',
    }

    const addedDoc = await dao.add(doc)
    expect(addedDoc.id).toBeTruthy()
    expect(doc).toEqual({...{
      title: addedDoc.title,
      url: addedDoc.url,
    }})

    const fetchedDoc = await dao.fetch(addedDoc.id)
    expect(fetchedDoc).toEqual(addedDoc)
  })

  it('set', async () => {
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
    expect(setedDoc).toEqual(setDoc)

    const fetchedDoc = await dao.fetch(addedDoc.id)
    expect(fetchedDoc).toEqual(setDoc)
  })

  describe('addOrSet', () => {
    it('add', async () => {
      const doc = {
        title: 'add',
        url: 'http://example.com/add',
      }

      const addedDoc = await dao.addOrSet(doc)
      expect(addedDoc.id).toBeTruthy()
      expect(doc).toEqual({
        title: addedDoc.title,
        url: addedDoc.url,
      })

      const fetchedAddDoc = await dao.fetchDocument(addedDoc.id)
      expect(fetchedAddDoc).toEqual(addedDoc)
    })

    it('set', async () => {
      const docId = 'addOrSet_set'
      const setDoc = {
        id: docId,
        title: 'set',
        url: 'http://example.com/set',
      }
      const setedDoc = await dao.addOrSet(setDoc)
      expect(setedDoc).toEqual(setDoc)

      const fetchedSetDoc = await dao.fetchDocument(docId)
      expect(fetchedSetDoc).toEqual(setDoc)
    })
  })

  it('delete', async () => {
    const doc = {
      title: 'delete',
      url: 'http://example.com/delete',
    }
    const addedDoc = await dao.add(doc)

    await dao.delete(addedDoc.id)
    const snapshot = await dao.collectionRef.doc(addedDoc.id).get()

    expect(snapshot.exists).toBeFalsy()
  })
})
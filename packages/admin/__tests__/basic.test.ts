import { FirestoreSimpleAdmin } from '../src'
import { FieldValue } from '@google-cloud/firestore'
import { AdminFirestoreTestUtil } from './util'

const util = new AdminFirestoreTestUtil()
const firestore = util.adminFirestore
const collectionPath = util.collectionPath
const firestoreSimple = new FirestoreSimpleAdmin(firestore)

interface TestDoc {
  id: string,
  title: string,
  num: number,
}

describe('Basic', () => {
  const dao = firestoreSimple.collection<TestDoc>({ path: collectionPath })
  const existsDocId = 'test'
  const existsDoc = {
    title: 'title',
    num: 10,
  }
  // Add fix id document and random id document
  beforeEach(async () => {
    await dao.collectionRef.doc(existsDocId).set(existsDoc)
    await dao.collectionRef.add({
      title: 'before',
      num: 10,
    })
  })

  afterAll(async () => {
    await util.deleteApps()
  })

  afterEach(async () => {
    await util.deleteCollection()
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
      num: 10,
    }

    const addedId = await dao.add(doc)

    const fetchedDoc = await dao.fetch(addedId)
    expect(fetchedDoc).toEqual({
      id: expect.anything(),
      title: doc.title,
      num: doc.num,
    })
  })

  it('set', async () => {
    const addedDoc = await dao.collectionRef.add({
      title: 'hogehoge',
      num: 10,
    })
    const setDoc = {
      id: addedDoc.id,
      title: 'set',
      num: 20,
    }

    const setedId = await dao.set(setDoc)

    const fetchedDoc = await dao.fetch(setedId)
    expect(fetchedDoc).toEqual(setDoc)
  })

  describe('addOrSet', () => {
    it('add', async () => {
      const doc = {
        title: 'add',
        num: 10,
      }

      const addedId = await dao.addOrSet(doc)
      expect(addedId).toBeTruthy()

      const fetchedAddDoc = await dao.fetch(addedId)
      expect(fetchedAddDoc).toEqual({
        id: expect.anything(),
        title: doc.title,
        num: doc.num,
      })
    })

    it('set', async () => {
      const docId = 'addOrSet_set'
      const setDoc = {
        id: docId,
        title: 'set',
        num: 10,
      }
      const setedId = await dao.addOrSet(setDoc)
      expect(setedId).toEqual(docId)

      const fetchedSetDoc = await dao.fetch(docId)
      expect(fetchedSetDoc).toEqual(setDoc)
    })
  })

  it('delete', async () => {
    const doc = {
      title: 'delete',
      num: 10,
    }
    const addedId = await dao.add(doc)

    await dao.delete(addedId)
    const snapshot = await dao.collectionRef.doc(addedId).get()

    expect(snapshot.exists).toBeFalsy()
  })

  describe('docRef', () => {
    it('with no argument should return new document ref', async () => {
      const docRef = dao.docRef()

      const fetchedDoc = await dao.fetch(docRef.id)
      expect(fetchedDoc).toBeUndefined()
    })

    it('with id argument should return exists document ref', async () => {
      const docRef = dao.docRef(existsDocId)

      const fetchedDoc = await dao.fetch(docRef.id)
      expect(fetchedDoc).not.toBeUndefined()
    })
  })

  describe('update', () => {
    it('with simple value', async () => {
      const addedDoc = await dao.collectionRef.add({
        title: 'hogehoge',
        num: 10,
      })

      const expectTitle = 'update'
      const updatedId = await dao.update({
        id: addedDoc.id,
        title: expectTitle,
      })

      expect(updatedId).toEqual(addedDoc.id)

      const fetchedDoc = await dao.fetch(updatedId)
      expect(fetchedDoc!.title).toEqual(expectTitle)
    })

    it('with FieldValue.increment', async () => {
      const baseNum = 10
      const addedDoc = await dao.collectionRef.add({
        title: 'FieldValue_increment',
        num: baseNum,
      })

      const incrementNum = 100
      const updatedId = await dao.update({
        id: addedDoc.id,
        num: FieldValue.increment(incrementNum)
      })

      const fetchedDoc = await dao.fetch(updatedId)
      expect(fetchedDoc!.num).toEqual(baseNum + incrementNum)
    })
  })
})

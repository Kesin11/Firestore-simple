import { FirestoreSimple, FirestoreSimpleCollection } from '../src'
import { createRandomCollectionName, deleteCollection, initFirestore } from './util'

interface TestDoc {
  id: string,
  title: string,
}

const firestore = initFirestore()
const collectionPath = createRandomCollectionName()
const firestoreSimple = new FirestoreSimple(firestore)

describe('transaction', () => {
  let txFirestoreSimple: FirestoreSimple
  let txDao: FirestoreSimpleCollection<TestDoc>
  const dao = firestoreSimple.collection<TestDoc>({ path: collectionPath })

  beforeEach(async () => {
    txFirestoreSimple = new FirestoreSimple(firestore)
    txDao = txFirestoreSimple.collection<TestDoc>({ path: collectionPath })
  })

  // Delete all documents. (= delete collection)
  afterEach(async () => {
    await deleteCollection(firestore, collectionPath)
  })

  describe('context.tx', () => {
    it('should be undefined before transaction', async () => {
      expect(txFirestoreSimple.context.tx).toBeUndefined()
    })

    it('should be assigned in transaction', async () => {
      await txFirestoreSimple.runTransaction(async (tx) => {
        expect(txFirestoreSimple.context.tx).toBe(tx)
      })
    })

    it('should be undefined after transaction', async () => {
      await txFirestoreSimple.runTransaction(async (_tx) => {
        expect(txFirestoreSimple.context.tx).not.toBeUndefined()
      })

      expect(txFirestoreSimple.context.tx).toBeUndefined()
    })
  })

  describe('Collection', () => {
    it('set', async () => {
      const doc = { id: 'test1', title: 'aaa' }
      const updatedDoc = { id: 'test1', title: 'bbb' }
      await dao.set(doc)

      await txFirestoreSimple.runTransaction(async () => {
        await txDao.set(updatedDoc)

        // updated can't see outside transaction
        const outTxFetched = await dao.fetch(doc.id)
        expect(outTxFetched).toEqual(doc)
      })

      // updated can see after transaction
      const fetched = await dao.fetch(doc.id)
      expect(fetched).toEqual(updatedDoc)
    })

    it('delete', async () => {
      const doc = { id: 'test1', title: 'aaa' }
      await dao.set(doc)

      await txFirestoreSimple.runTransaction(async () => {
        await txDao.delete(doc.id)

        // updated can't see outside transaction
        const outTxFetched = await dao.fetch(doc.id)
        expect(outTxFetched).toEqual(doc)
      })

      // updated can see after transaction
      const fetched = await dao.fetch(doc.id)
      expect(fetched).toBeUndefined()
    })

    it('fetch after set in transaction should be error', async () => {
      const doc = { id: 'test1', title: 'aaa' }
      const updatedDoc = { id: 'test1', title: 'bbb' }
      await dao.set(doc)

      await txFirestoreSimple.runTransaction(async () => {
        await txDao.set(updatedDoc)

        await expect(txDao.fetch(doc.id)).rejects.toThrow(
          'Firestore transactions require all reads to be executed before all writes.'
        )
      })
    })

    it('fetchAll after set in transaction should be error', async () => {
      const doc = { id: 'test1', title: 'aaa' }
      const updatedDoc = { id: 'test1', title: 'bbb' }
      await dao.set(doc)

      await txFirestoreSimple.runTransaction(async () => {
        await txDao.set(updatedDoc)

        await expect(txDao.fetchAll()).rejects.toThrow(
          'Firestore transactions require all reads to be executed before all writes.'
        )
      })
    })
  })

  describe('Collection.context.tx', () => {
    const anotherCollectionPath = createRandomCollectionName()
    let txAnotherDao: FirestoreSimpleCollection<TestDoc>

    beforeEach(async () => {
      txAnotherDao = txFirestoreSimple.collection<TestDoc>({ path: anotherCollectionPath })
    })

    afterEach(async () => {
      await deleteCollection(firestore, anotherCollectionPath)
    })

    it('each collections share same transaction context', async () => {
      await txFirestoreSimple.runTransaction(async (tx) => {
        expect(txDao.context.tx).toBe(tx)
        expect(txAnotherDao.context.tx).toBe(tx)
      })
    })

    it('transaction enables across each collections', async () => {
      const anotherDao = firestoreSimple.collection<TestDoc>({ path: anotherCollectionPath })

      const doc = { id: 'test1', title: 'aaa' }
      await dao.set(doc)
      const anotherDoc = { id: 'test1', title: 'another' }
      await anotherDao.set(anotherDoc)

      const updatedDoc = { id: 'test1', title: 'bbb' }
      const updatedAnotherDoc = { id: 'test1', title: 'another_bbb' }

      await txFirestoreSimple.runTransaction(async () => {
        await txDao.set(updatedDoc)
        await txAnotherDao.set(updatedAnotherDoc)

        // updated can't see outside transaction
        const outTxFetched = await dao.fetch(doc.id)
        expect(outTxFetched).toEqual(doc)
        const outTxAnotherFetched = await anotherDao.fetch(anotherDoc.id)
        expect(outTxAnotherFetched).toEqual(anotherDoc)
      })

      // updated can see after transaction
      const fetched = await dao.fetch(doc.id)
      expect(fetched).toEqual(updatedDoc)
      const anotherFetched = await anotherDao.fetch(anotherDoc.id)
      expect(anotherFetched).toEqual(updatedAnotherDoc)
    })
  })
})

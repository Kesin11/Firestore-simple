import { FirestoreSimple, Collection } from '../src'
import { WebFirestoreTestUtil } from './util'

const util = new WebFirestoreTestUtil()
const webFirestore = util.webFirestore
const collectionPath = 'abtch'

type TestDoc = {
  id: string,
  title: string,
}

type InvalidTestDoc = {
  id: string,
  title: string | undefined, // Firestore does not accept undefined!
}

describe('batch', () => {
  let firestoreSimple: FirestoreSimple
  let dao: Collection<TestDoc>
  let invalidDao: Collection<InvalidTestDoc>

  beforeEach(async () => {
    firestoreSimple = new FirestoreSimple(webFirestore)
    dao = firestoreSimple.collection<TestDoc>({ path: collectionPath })
    invalidDao = firestoreSimple.collection<InvalidTestDoc>({ path: collectionPath })
  })

  afterAll(async () => {
    await util.deleteApps()
  })

  afterEach(async () => {
    await util.clearFirestoreData()
  })

  describe('bulkAdd', () => {
    it('should be commited when no error', async () => {
      const docs = [
        { title: 'aaa' },
        { title: 'bbb' },
        { title: 'ccc' },
      ]
      await dao.bulkAdd(docs)
      const fetchedDocs = await dao.fetchAll()

      const actualTitles = fetchedDocs.map((doc) => doc.title).sort()
      const expectTitles = docs.map((doc) => doc.title).sort()
      expect(actualTitles).toEqual(expectTitles)
    })

    it('should not be commited when throw some error', async () => {
      const docs = [
        { title: 'aaa' },
        { title: undefined }, // invalid value
        { title: 'ccc' },
      ]

      await expect(invalidDao.bulkAdd(docs)).rejects.toThrow()

      const actualDocs = await invalidDao.fetchAll()
      expect(actualDocs).toEqual([])
    })
  })

  describe('bulkSet', () => {
    it('should be commited when no error', async () => {
      const docs = [
        { id: 'test1', title: 'aaa' },
        { id: 'test2', title: 'bbb' },
        { id: 'test3', title: 'ccc' },
      ]
      await dao.bulkSet(docs)

      const actualDocs = await dao.fetchAll()
      expect(actualDocs).toEqual(docs)
    })
    it('should not be commited when throw some error', async () => {
      const docs = [
        { id: 'test1', title: 'aaa' },
        { id: 'test2', title: undefined }, // invalid!
        { id: 'test3', title: 'ccc' },
      ]
      await expect(invalidDao.bulkSet(docs)).rejects.toThrow()

      const actualDocs = await invalidDao.fetchAll()
      expect(actualDocs).toEqual([])
    })
  })

  describe('bulkDelete', () => {
    it('should be commited when no error', async () => {
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

      const actualDocs = await dao.fetchAll()
      expect(actualDocs).toEqual([])
    })

    it('should not be commited when throw some error', async () => {
      const docs = [
        { id: 'test1', title: 'aaa' },
        { id: 'test2', title: 'bbb' },
        { id: 'test3', title: 'ccc' },
      ]
      await dao.set(docs[0])
      await dao.set(docs[1])
      await dao.set(docs[2])

      const invalidValue = () => { console.log('invalid') }
      await expect(
        dao.bulkDelete(['test1', invalidValue, 'test3'] as any[]) // invalid key
      ).rejects.toThrow()

      const actualDocs = await dao.fetchAll()
      expect(actualDocs).toEqual(docs)
    })
  })
})

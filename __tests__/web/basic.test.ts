import { FirestoreSimpleWeb } from '../../src/'
import { WebFirestoreTestUtil } from './util'

const util = new WebFirestoreTestUtil()
const webFirestore = util.webFirestore
const adminFirestore = util.adminFirestore
const collectionPath = 'basic'

type TestDoc = {
  id: string,
  title: string,
  num: number,
}

const firestoreSimple = new FirestoreSimpleWeb(webFirestore)

describe('Basic', () => {
  const dao = firestoreSimple.collection<TestDoc>({ path: collectionPath })
  const existsDocId = 'test'
  const existsDoc = {
    title: 'title',
    num: 10,
  }
  // Add fix id document and random id document
  beforeEach(async () => {
    await adminFirestore.collection(collectionPath).doc(existsDocId).set(existsDoc)
    await adminFirestore.collection(collectionPath).add({
      title: 'before',
      num: 10,
    })
  })

  afterAll(async () => {
    await util.deleteApps()
  })

  afterEach(async () => {
    await util.clearFirestoreData()
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
})

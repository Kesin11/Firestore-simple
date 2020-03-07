import { WebFirestoreTestUtil } from './util'

const util = new WebFirestoreTestUtil()
const webFirestore = util.webFirestore
const adminFirestore = util.adminFirestore
const collectionPath = 'basic'

describe('Basic', () => {
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
      const snapshot = await webFirestore.collection(collectionPath).doc(existsDocId).get()
      // const doc = await dao.fetch(existsDocId)
      // const expectDoc = { ...existsDoc, ...{ id: existsDocId } }

      // expect(doc).toEqual(expectDoc)
      expect(snapshot.data()).toEqual(existsDoc)
    })

    it('does not exist document', async () => {
      // const doc = await dao.fetch('not_exists_document_id')
      const snapshot = await webFirestore.collection(collectionPath).doc('not_exists_document_id').get()

      // expect(doc).toEqual(undefined)
      expect(snapshot.exists).toBeFalsy()
    })

    it('fetchAll', async () => {
      // const docs = await dao.fetchAll()
      const docs = await (await webFirestore.collection(collectionPath).get()).docs

      expect(docs.length).toBeGreaterThanOrEqual(2)
    })
  })
})

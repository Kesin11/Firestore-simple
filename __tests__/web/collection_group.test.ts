import { FirestoreSimpleWeb } from '../../src'
import { WebFirestoreTestUtil } from './util'

const util = new WebFirestoreTestUtil()
const webFirestore = util.webFirestore
const collectionPath = 'collection_group'

type TestDoc = {
  id: string,
  title: string,
}

const expectTitles = ['aaa', 'bbb', 'ccc', 'ddd']
const collectionId = 'collection_group'

const firestoreSimple = new FirestoreSimpleWeb(webFirestore)

describe('collectionGroup', () => {
  beforeEach(async () => {
    await webFirestore.collection(`${collectionPath}/1/${collectionId}`).add({ title: expectTitles[0] })
    await webFirestore.collection(`${collectionPath}/1/${collectionId}`).add({ title: expectTitles[1] })
    await webFirestore.collection(`${collectionPath}/2/${collectionId}`).add({ title: expectTitles[2] })
    await webFirestore.collection(`${collectionPath}/3/${collectionId}`).add({ title: expectTitles[3] })
  })

  afterAll(async () => {
    await util.deleteApps()
  })

  afterEach(async () => {
    await util.clearFirestoreData()
  })

  it('fetch', async () => {
    const query = firestoreSimple.collectionGroup<TestDoc>({ collectionId })
    const docs = await query.fetch()

    const actualTitles = docs.map((doc) => doc.title).sort()
    expect(actualTitles).toEqual(expectTitles)
  })

  it('where', async () => {
    const expectTitle = 'aaa'
    const query = firestoreSimple.collectionGroup<TestDoc>({ collectionId })
    const docs = await query.where('title', '==', 'aaa').fetch()

    const actualTitles = docs.map((doc) => doc.title)
    expect(actualTitles).toEqual([expectTitle])
  })
})

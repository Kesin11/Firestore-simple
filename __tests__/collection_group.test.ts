import { FirestoreSimple } from '../src'
import { createRandomCollectionName, deleteCollection, initFirestore } from './util'

interface TestDoc {
  id: string,
  title: string,
}

const expectTitles = ['aaa', 'bbb', 'ccc', 'ddd']
const collectionId = 'collection_group'

const firestore = initFirestore()
const collectionPath = createRandomCollectionName()
const firestoreSimple = new FirestoreSimple(firestore)

describe('collectionGroup', () => {
  beforeEach(async () => {
    await firestore.collection(`${collectionPath}/1/${collectionId}`).add({ title: expectTitles[0] })
    await firestore.collection(`${collectionPath}/1/${collectionId}`).add({ title: expectTitles[1] })
    await firestore.collection(`${collectionPath}/2/${collectionId}`).add({ title: expectTitles[2] })
    await firestore.collection(`${collectionPath}/3/${collectionId}`).add({ title: expectTitles[3] })
  })

  afterEach(async () => {
    await deleteCollection(firestore, `${collectionPath}/1/${collectionId}`)
    await deleteCollection(firestore, `${collectionPath}/2/${collectionId}`)
    await deleteCollection(firestore, `${collectionPath}/3/${collectionId}`)
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

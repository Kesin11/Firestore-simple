import { FirestoreSimpleWeb } from '../../src'
import { WebFirestoreTestUtil } from './util'

const util = new WebFirestoreTestUtil()
const webFirestore = util.webFirestore
const collectionPath = 'pagination'

type TestDoc = {
  id: string,
  title: string,
  order: number,
}

const firestoreSimple = new FirestoreSimpleWeb(webFirestore)

describe('pagination', () => {
  const dao = firestoreSimple.collection<TestDoc>({ path: collectionPath })

  beforeEach(async () => {
    const docs = [
      { id: '1', title: 'a', order: 1 },
      { id: '2', title: 'b', order: 2 },
      { id: '3', title: 'b', order: 3 },
      { id: '4', title: 'c', order: 4 },
      { id: '5', title: 'd', order: 5 },
      { id: '6', title: 'd', order: 6 },
      { id: '7', title: 'e', order: 7 },
    ]
    for (const doc of docs) {
      await dao.set(doc)
    }
  })

  afterAll(async () => {
    await util.deleteApps()
  })

  afterEach(async () => {
    await util.clearFirestoreData()
  })

  describe('startAt', () => {
    it('with field value', async () => {
      const fetched = await dao.orderBy('title').startAt('b').fetch()
      const actual = fetched[0]

      expect(actual).toEqual({ id: '2', title: 'b', order: 2 })
    })

    it('with multiple field values', async () => {
      const fetched = await dao
        .orderBy('title').orderBy('order')
        .startAt('b', 3)
        .fetch()
      const actual = fetched[0]

      expect(actual).toEqual({ id: '3', title: 'b', order: 3 })
    })

    it('with DocumentSnapshot', async () => {
      const snapshot = await dao.docRef('3').get()
      const fetched = await dao.orderBy('title').startAt(snapshot).fetch()
      const actual = fetched[0]

      expect(actual).toEqual({ id: '3', title: 'b', order: 3 })
    })
  })

  describe('startAfter', () => {
    it('with field value', async () => {
      const fetched = await dao.orderBy('title').startAfter('b').fetch()
      const actual = fetched[0]

      expect(actual).toEqual({ id: '4', title: 'c', order: 4 })
    })

    it('with DocumentSnapshot', async () => {
      const snapshot = await dao.docRef('3').get()
      const fetched = await dao.orderBy('title').startAfter(snapshot).fetch()
      const actual = fetched[0]

      expect(actual).toEqual({ id: '4', title: 'c', order: 4 })
    })
  })

  describe('endAt', () => {
    it('with field value', async () => {
      const fetched = await dao.orderBy('title').endAt('d').fetch()
      const actual = fetched[fetched.length - 1]

      expect(actual).toEqual({ id: '6', title: 'd', order: 6 })
    })

    it('with DocumentSnapshot', async () => {
      const snapshot = await dao.docRef('6').get()
      const fetched = await dao.orderBy('title').endAt(snapshot).fetch()
      const actual = fetched[fetched.length - 1]

      expect(actual).toEqual({ id: '6', title: 'd', order: 6 })
    })
  })

  describe('endBefore', () => {
    it('with field value', async () => {
      const fetched = await dao.orderBy('title').endBefore('e').fetch()
      const actual = fetched[fetched.length - 1]

      expect(actual).toEqual({ id: '6', title: 'd', order: 6 })
    })

    it('with DocumentSnapshot', async () => {
      const snapshot = await dao.docRef('7').get()
      const fetched = await dao.orderBy('title').endBefore(snapshot).fetch()
      const actual = fetched[fetched.length - 1]

      expect(actual).toEqual({ id: '6', title: 'd', order: 6 })
    })
  })

  describe('startAfter + endAt', () => {
    it('with field value', async () => {
      const fetched = await dao.orderBy('title')
        .startAfter('b')
        .endAt('d')
        .fetch()
      const actualFirst = fetched[0]
      const actualLast = fetched[fetched.length - 1]

      expect(actualFirst).toEqual({ id: '4', title: 'c', order: 4 })
      expect(actualLast).toEqual({ id: '6', title: 'd', order: 6 })
    })
  })
})

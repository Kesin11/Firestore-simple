import { FirestoreSimple, Encodable, Decodable, Collection } from '../src'
import { AdminFirestoreTestUtil } from './util'

const util = new AdminFirestoreTestUtil()
const firestore = util.adminFirestore
const collectionPath = util.collectionPath
const firestoreSimple = new FirestoreSimple(firestore)

interface Book {
  id: string,
  title: string,
  createdAt: Date,
}

interface BookDoc {
  title: string,
  created_at: Date,
}

describe('Factory and Subcollection', () => {
  afterAll(async () => {
    await util.deleteApps()
  })

  afterEach(async () => {
    await util.deleteCollection()
  })

  const encodeFunc: Encodable<Book, BookDoc> = (obj) => {
    return {
      title: obj.title,
      created_at: obj.createdAt,
    }
  }
  const decodeFunc: Decodable<Book, BookDoc> = (doc) => {
    return {
      id: doc.id,
      title: doc.title,
      createdAt: doc.created_at.toDate() // Firestore timestamp to JS Date
    }
  }

  describe('FirestoreSimple.collectionFactory', () => {
    it('should has same encode function', async () => {
      const factory = firestoreSimple.collectionFactory<Book, BookDoc>({
        encode: encodeFunc,
      })

      expect(factory.encode).toBe(encodeFunc)
    })

    it('should has same decode function', async () => {
      const factory = firestoreSimple.collectionFactory<Book, BookDoc>({
        decode: decodeFunc,
      })

      expect(factory.decode).toBe(decodeFunc)
    })
  })

  describe('FirestoreSimpleCollectionFactory.create', () => {
    const subcollectionPath = `${collectionPath}/test1/sub`
    const factory = firestoreSimple.collectionFactory<Book, BookDoc>({
      encode: encodeFunc,
      decode: decodeFunc,
    })
    let dao: Collection<Book, BookDoc>

    beforeEach(async () => {
      dao = factory.create(subcollectionPath)
    })

    it('should be same collection path', async () => {
      expect(dao.collectionRef.path).toEqual(subcollectionPath)
    })

    it('should has same context', async () => {
      expect(dao.context).toBe(firestoreSimple.context)
    })

    it('set with encode/decode by created dao', async () => {
      const now = new Date()
      const doc = {
        title: 'exists_book',
        created_at: now,
      }
      const docRef = await dao.collectionRef.add(doc)

      const title = 'set'
      const setBook = {
        id: docRef.id,
        title: title,
        createdAt: doc.created_at,
      }
      await dao.set(setBook)

      const fetchedBook = await dao.fetch(setBook.id)
      expect(fetchedBook).toEqual(setBook)
    })
  })
})

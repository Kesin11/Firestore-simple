import { FirestoreSimpleWeb } from '../src'
import { WebFirestoreTestUtil } from './util'

const util = new WebFirestoreTestUtil()
const webFirestore = util.webFirestore
const collectionPath = 'decode'

type Book = {
  id: string,
  bookTitle: string,
}

type BookDoc = {
  book_title: string,
}

class BookClass {
  constructor (public id: string, public bookTitle: string) { }
}

const firestoreSimple = new FirestoreSimpleWeb(webFirestore)

describe('decode', () => {
  afterAll(async () => {
    await util.deleteApps()
  })

  afterEach(async () => {
    await util.clearFirestoreData()
  })

  describe('to object with different key', () => {
    const dao = firestoreSimple.collection<Book, BookDoc>({
      path: collectionPath,
      decode: (doc) => {
        return {
          id: doc.id,
          bookTitle: doc.book_title,
        }
      },
    })

    it('fetch with decode', async () => {
      const title = 'add1'
      const docRef = await dao.collectionRef.add({
        book_title: title,
      })

      const fetchedDoc = await dao.fetch(docRef.id)
      expect(fetchedDoc).toEqual({ id: docRef.id, bookTitle: title })
    })

    it('where with decode', async () => {
      const title = 'add2'
      const docRef = await dao.collectionRef.add({
        book_title: title,
      })

      const fetchedDoc = await dao.where('book_title', '==', title).fetch()
      expect(fetchedDoc).toEqual([
        { id: docRef.id, bookTitle: title }
      ])
    })
  })

  describe('to class instance with same key', () => {
    const dao = firestoreSimple.collection<BookClass>({
      path: collectionPath,
      decode: (doc) => {
        return new BookClass(doc.id, doc.bookTitle)
      },
    })

    it('fetch with decode', async () => {
      const title = 'add1'
      const docRef = await dao.collectionRef.add({
        bookTitle: title,
      })

      const fetchedDoc = await dao.fetch(docRef.id)
      expect(fetchedDoc).toStrictEqual(new BookClass(docRef.id, title))
    })
  })
})

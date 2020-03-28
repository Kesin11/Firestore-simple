import { FirestoreSimple } from '../src'
import { WebFirestoreTestUtil } from './util'
const util = new WebFirestoreTestUtil()
const webFirestore = util.webFirestore
const collectionPath = 'encode'

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

const firestoreSimple = new FirestoreSimple(webFirestore)

describe('encode', () => {
  afterAll(async () => {
    await util.deleteApps()
  })

  afterEach(async () => {
    await util.clearFirestoreData()
  })

  describe('from object with different key', () => {
    const dao = firestoreSimple.collection<Book, BookDoc>({
      path: collectionPath,
      encode: (book) => {
        return {
          book_title: book.bookTitle,
        }
      },
    })

    it('add with encode', async () => {
      const title = 'add'
      const doc = {
        bookTitle: title,
      }
      const addedId = await dao.add(doc)

      const fetchedDoc = await dao.collectionRef.doc(addedId).get()
      expect(fetchedDoc.data()).toEqual({ book_title: title })
    })

    it('set with encode', async () => {
      const exsitDoc = await dao.collectionRef.add({
        book_title: 'hogehoge',
      })
      const title = 'set'
      const setDoc = {
        id: exsitDoc.id,
        bookTitle: title,
      }
      await dao.set(setDoc)

      const fetchedDoc = await dao.collectionRef.doc(exsitDoc.id).get()
      expect(fetchedDoc.data()).toEqual({ book_title: title })
    })
  })

  describe('from class instance with same key', () => {
    const dao = firestoreSimple.collection<Book>({
      path: collectionPath,
      encode: (book) => {
        return {
          bookTitle: book.bookTitle,
        }
      },
    })

    it('set with encode', async () => {
      const exsitDoc = await dao.collectionRef.add({
        bookTitle: 'hogehoge',
      })
      const title = 'set'
      const setDoc = new BookClass(exsitDoc.id, title)
      await dao.set(setDoc)

      const fetchedDoc = await dao.collectionRef.doc(exsitDoc.id).get()
      expect(fetchedDoc.data()).toEqual({ bookTitle: title })
    })
  })
})

import { FirestoreSimple } from '../src'
import { createRandomCollectionName, deleteCollection, initFirestore } from './util'

interface Book {
  id: string,
  bookTitle: string,
}

interface BookDoc {
  book_title: string,
}

class BookClass {
  constructor (public id: string, public bookTitle: string) { }
}

const firestore = initFirestore()
const collectionPath = createRandomCollectionName()
const firestoreSimple = new FirestoreSimple(firestore)

describe('decode', () => {
  // Delete all documents. (= delete collection)
  afterEach(async () => {
    await deleteCollection(firestore, collectionPath)
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

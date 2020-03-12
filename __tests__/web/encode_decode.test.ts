import { FirestoreSimpleWeb } from '../../src'
import { WebFirestoreTestUtil } from './util'

const util = new WebFirestoreTestUtil()
const webFirestore = util.webFirestore
const collectionPath = 'encode_decode'

type Book = {
  id: string,
  bookTitle: string,
  created: Date,
}

type BookDoc = {
  book_title: string,
  created: Date,
}

const firestoreSimple = new FirestoreSimpleWeb(webFirestore)

describe('encode and decode', () => {
  const dao = firestoreSimple.collection<Book, BookDoc>({
    path: collectionPath,
    encode: (book) => {
      return {
        book_title: book.bookTitle,
        created: book.created,
      }
    },
    decode: (doc) => {
      return {
        id: doc.id,
        bookTitle: doc.book_title,
        created: doc.created.toDate(), // Firestore timestamp to JS Date
      }
    },
  })
  const now = new Date()

  afterAll(async () => {
    await util.deleteApps()
  })

  afterEach(async () => {
    await util.clearFirestoreData()
  })

  it('add with encode/decode', async () => {
    const doc = {
      bookTitle: 'add',
      created: now,
    }
    const addedBookId = await dao.add(doc)

    const fetchedBook = await dao.fetch(addedBookId)
    expect(fetchedBook).toEqual({
      id: addedBookId,
      bookTitle: doc.bookTitle,
      created: doc.created,
    })
  })

  it('set with encode/decode', async () => {
    const doc = {
      book_title: 'exists_book',
      created: now,
    }
    const docRef = await dao.collectionRef.add(doc)

    const title = 'set'
    const setBook = {
      id: docRef.id,
      created: doc.created,
      bookTitle: title,
    }
    await dao.set(setBook)

    const fetchedBook = await dao.fetch(setBook.id)
    expect(fetchedBook).toEqual(setBook)
  })

  it('update with encode/decode accept "encoded" key name', async () => {
    const doc = {
      book_title: 'exists_book',
      created: now,
    }
    const docRef = await dao.collectionRef.add(doc)

    const updatedTitle = 'update'
    await dao.update({ id: docRef.id, book_title: updatedTitle })

    const fetchedBook = await dao.fetch(docRef.id)
    expect(fetchedBook!.bookTitle).toEqual(updatedTitle)
  })
})

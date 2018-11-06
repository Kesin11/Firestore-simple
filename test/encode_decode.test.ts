import test from 'ava'
import { FirestoreSimpleV2 } from '../src/v2'
import { createRandomCollectionName, deleteCollection, initFirestore } from './util'

interface Book {
  id: string,
  bookTitle: string
  created: Date
}

const firestore = initFirestore()
const collectionPath = createRandomCollectionName()
const dao = new FirestoreSimpleV2<Book>({firestore, path: collectionPath,
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

// Delete all documents. (= delete collection)
test.after.always(async (_t) => {
  await deleteCollection(firestore, collectionPath)
})

test('add with encode/decode', async (t) => {
  const doc = {
    bookTitle: 'add',
    created: now,
  }
  const addedBook = await dao.add(doc)

  const fetchedBook = await dao.fetch(addedBook.id)
  t.deepEqual(
    fetchedBook,
    {
      id: addedBook.id,
      bookTitle: doc.bookTitle,
      created: doc.created,
    }, 'fetched object')
})

test('set with encode/decode', async (t) => {
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
  t.deepEqual(fetchedBook, setBook, 'fetched object')
})

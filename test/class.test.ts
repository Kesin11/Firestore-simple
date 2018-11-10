import { Firestore } from '@google-cloud/firestore'
import test from 'ava'
import { FirestoreSimple } from '../src'
import { createRandomCollectionName, deleteCollection, initFirestore } from './util'

interface Book {
  id: string,
  bookTitle: string
  created: Date
}

// class based dao
class BookDao extends FirestoreSimple<Book> {
  constructor ({ firestore, path }: {firestore: Firestore, path: string}) {
    super({ firestore, path })
  }
  public encode (book: Book) {
    return {
      book_title: book.bookTitle,
      created: book.created,
    }
  }
  public decode (doc: {id: string, [props: string]: any}) {
    return {
      id: doc.id,
      bookTitle: doc.book_title,
      created: doc.created.toDate(),
    }
  }
}

const firestore = initFirestore()
const collectionPath = createRandomCollectionName()
const dao = new BookDao({ firestore, path: collectionPath })
const now = new Date()

// Delete all documents. (= delete collection)
test.after.always(async (_t) => {
  await deleteCollection(firestore, collectionPath)
})

test.beforeEach(async (t) => {
  const doc = {
    book_title: 'add',
    created: now,
  }
  const docRef = await dao.collectionRef.add(doc)
  t.context.existId = docRef.id
  t.context.existDoc = doc
})

test('fetch', async (t) => {
  const fetchedBook = await dao.fetch(t.context.existId)

  t.deepEqual(
    fetchedBook,
    {
      id: t.context.existId,
      bookTitle: t.context.existDoc.book_title,
      created: t.context.existDoc.created,
    }, 'fetched object')
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
  const title = 'set'
  const setDoc = {
    id: t.context.existId,
    created: t.context.existDoc.created,
    bookTitle: title,
  }
  await dao.set(setDoc)

  const fetchedDoc = await dao.fetch(setDoc.id)
  t.deepEqual(fetchedDoc, setDoc, 'fetched object')
})

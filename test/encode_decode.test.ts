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

test.beforeEach(async (t) => {
  const doc = {
    bookTitle: 'add',
    created: now,
  }
  const addedDoc = await dao.add(doc)
  t.context.existId = addedDoc.id
  t.context.existDoc = doc
})

test('add with encode/decode', async (t) => {
  const fetchedDoc = await dao.fetch(t.context.existId)
  t.deepEqual(
    fetchedDoc,
    {
      id: t.context.existId,
      bookTitle: t.context.existDoc.bookTitle,
      created: t.context.existDoc.created,
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

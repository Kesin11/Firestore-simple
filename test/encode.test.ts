import test from 'ava'
import { FirestoreSimpleV2 } from '../src/v2'
import { createRandomCollectionName, deleteCollection, initFirestore } from './util'

interface Book {
  id: string,
  bookTitle: string
}

const firestore = initFirestore()
const collectionPath = createRandomCollectionName()
const dao = new FirestoreSimpleV2<Book>({firestore, path: collectionPath,
  encode: (book) => {
    return {
      book_title: book.bookTitle,
    }
  },
})

// Delete all documents. (= delete collection)
test.after.always(async (_t) => {
  await deleteCollection(firestore, collectionPath)
})

test('add with encode', async (t) => {
  const title = 'add'
  const doc = {
    bookTitle: title,
  }
  const addedDoc = await dao.add(doc)

  const fetchedDoc = await dao.collectionRef.doc(addedDoc.id).get()
  t.deepEqual(fetchedDoc.data(), { book_title: title }, 'fetched object')
})

test('set with encode', async (t) => {
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
  t.deepEqual(fetchedDoc.data(), { book_title: title }, 'fetched object')
})

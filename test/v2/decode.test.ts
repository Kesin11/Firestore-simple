import test from 'ava'
import { FirestoreSimpleV2 } from '../../src/v2'
import { createRandomCollectionName, deleteCollection, initFirestore } from '../util'

interface Book {
  id: string,
  bookTitle: string
}

const firestore = initFirestore()
const collectionPath = createRandomCollectionName()
const dao = new FirestoreSimpleV2<Book>({firestore, path: collectionPath,
  decode: (doc) => {
    return {
      id: doc.id,
      bookTitle: doc.book_title,
    }
  },
})

// Delete all documents. (= delete collection)
test.after.always(async (_t) => {
  await deleteCollection(firestore, collectionPath)
})

test('fetch with decode', async (t) => {
  const title = 'add1'
  const docRef = await dao.collectionRef.add({
    book_title: title,
  })

  const fetchedDoc = await dao.fetch(docRef.id)
  t.deepEqual(fetchedDoc, { id: docRef.id, bookTitle: title }, 'fetched object')
})

test('where with decode', async (t) => {
  const title = 'add2'
  const docRef = await dao.collectionRef.add({
    book_title: title,
  })

  const fetchedDoc = await dao.where('book_title', '==', title).get()
  t.deepEqual(fetchedDoc, [{ id: docRef.id, bookTitle: title }], 'fetched object')
})

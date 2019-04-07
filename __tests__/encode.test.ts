import { FirestoreSimple } from '../src'
import { createRandomCollectionName, deleteCollection, initFirestore } from './util'

interface Book {
  id: string,
  bookTitle: string
}

const firestore = initFirestore()
const collectionPath = createRandomCollectionName()
const firestoreSimple = new FirestoreSimple(firestore)

describe('encode', () => {
  const dao = firestoreSimple.collection<Book>({path: collectionPath,
    encode: (book) => {
      return {
        book_title: book.bookTitle,
      }
    },
  })

  // Delete all documents. (= delete collection)
  afterEach(async () => {
    await deleteCollection(firestore, collectionPath)
  })

  it('add with encode', async () => {
    const title = 'add'
    const doc = {
      bookTitle: title,
    }
    const addedDoc = await dao.add(doc)

    const fetchedDoc = await dao.collectionRef.doc(addedDoc.id).get()
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

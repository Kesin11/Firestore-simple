import { FirestoreSimple } from '../src'
import { createRandomCollectionName, deleteCollection, initFirestore } from './util'

interface Book {
  id: string,
  bookTitle: string
}

interface BookDoc {
  book_title: string
}

const firestore = initFirestore()
const collectionPath = createRandomCollectionName()
const firestoreSimple = new FirestoreSimple(firestore)

describe('decode', () => {
  const dao = firestoreSimple.collection<Book, BookDoc>({path: collectionPath,
    decode: (doc) => {
      return {
        id: doc.id,
        bookTitle: doc.book_title,
      }
    },
  })

  // Delete all documents. (= delete collection)
  afterEach(async () => {
    await deleteCollection(firestore, collectionPath)
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
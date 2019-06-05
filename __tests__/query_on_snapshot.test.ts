import { FirestoreSimple } from '../src'
import { createRandomCollectionName, deleteCollection, initFirestore } from './util'

interface Book {
  id: string,
  bookTitle: string
  created: Date
  bookId: number,
}

interface BookDoc {
  book_title: string,
  created: Date,
  book_id: number
}

const firestore = initFirestore()
const collectionPath = createRandomCollectionName()
const firestoreSimple = new FirestoreSimple(firestore)

describe('query on_snapshot test', () => {
  const dao = firestoreSimple.collection<Book, BookDoc>({path: collectionPath,
    encode: (book) => {
      return {
        book_title: book.bookTitle,
        created: book.created,
        book_id: book.bookId,
      }
    },
    decode: (doc) => {
      return {
        id: doc.id,
        bookTitle: doc.book_title,
        created: doc.created.toDate(), // Firestore timestamp to JS Date
        bookId: doc.book_id,
      }
    },
  })
  let existsDoc: Book

  beforeEach(async () => {
    const addedDoc = {
      bookTitle: 'exists',
      created: new Date(),
      bookId: 1,
    }
    const addedId = await dao.add(addedDoc)
    existsDoc = {
      ...addedDoc,
      id: addedId,
    }
  })

  afterEach(async () => {
    await deleteCollection(firestore, collectionPath)
  })

  it('observe add change', async () => {
    const doc = {
      bookTitle: 'query_add',
      created: new Date(),
      bookId: 2
    }

    const promise = new Promise((resolve) => {
      dao.where('book_id', '==', doc.bookId)
        .onSnapshot((querySnapshot, toObject) => {
          querySnapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const changedDoc = toObject(change.doc)

              expect(changedDoc).toEqual({
                ...doc,
                id: expect.anything(),
              })
              resolve()
            }
          })
        })
      })

    await new Promise((resolve) => setTimeout(resolve, 100)) // for async stability
    await dao.add(doc)
    await promise
  })

  it('observe set changes', async () => {
    const doc = {
      ...existsDoc!,
      bookTitle: 'query_set',
    }

    const promise = new Promise((resolve) => {
      // where('book_title', '==', existsDoc) is not triggered modify existsDoc.
      // I don't know why, so book_id is hack for resolve this issue.
      dao.where('book_id', '==', 1)
        .onSnapshot((querySnapshot, toObject) => {
          querySnapshot.docChanges().forEach((change) => {
            if (change.type === 'modified') {
              const changedDoc = toObject(change.doc)

              expect(changedDoc).toEqual(doc)
              resolve()
            }
          })
      })
    })

    await new Promise((resolve) => setTimeout(resolve, 100)) // for async stability
    await dao.set(doc)
    await promise
  })

  it('observe delete change', async () => {
    const promise = new Promise((resolve) => {
      dao.where('book_title', '==', existsDoc.bookTitle).onSnapshot((querySnapshot, toObject) => {
        querySnapshot.docChanges().forEach((change) => {
          if (change.type === 'removed' && change.doc.data().book_title === existsDoc.bookTitle) {
            const changedDoc = toObject(change.doc)

            expect(changedDoc).toEqual(existsDoc)
            resolve()
          }
        })
      })
    })

    await new Promise((resolve) => setTimeout(resolve, 100)) // for async stability
    await dao.delete(existsDoc.id)
    await promise
  })
})
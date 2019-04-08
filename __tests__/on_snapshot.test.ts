import { FirestoreSimple } from '../src'
import { createRandomCollectionName, deleteCollection, initFirestore } from './util'

interface Book {
  id: string,
  bookTitle: string
  created: Date
}

const firestore = initFirestore()
const collectionPath = createRandomCollectionName()
const firestoreSimple = new FirestoreSimple(firestore)

describe('on_snapshot test', () => {
  const dao = firestoreSimple.collection<Book>({path: collectionPath,
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
  let existsDoc: Book

  beforeEach(async () => {
    existsDoc = await dao.add({
      bookTitle: 'exists',
      created: new Date(),
    })
  })

  afterEach(async () => {
    await deleteCollection(firestore, collectionPath)
  })

  it('observe add change', (done) => {
    const doc = {
      bookTitle: 'add',
      created: new Date(),
    }

    dao.onSnapshot((querySnapshot, toObject) => {
      querySnapshot.docChanges().forEach((change) => {
        if (change.type === 'added' && change.doc.data().book_title === doc.bookTitle) {
          const changedDoc = toObject(change.doc)

          expect(changedDoc).toEqual({
            ...doc,
            id: expect.anything()
          })
          done()
        }
      })
    })

    dao.add(doc)
  })

  it('observe set changes', (done) => {
    const doc = {
      ...existsDoc!,
      bookTitle: 'set'
    }

    dao.onSnapshot((querySnapshot, toObject) => {
      querySnapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          const changedDoc = toObject(change.doc)

          expect(changedDoc).toEqual(doc)
          done()
        }
      })
    })

    dao.set(doc)
  })

  it('observe delete change', (done) => {
    dao.onSnapshot((querySnapshot, toObject) => {
      querySnapshot.docChanges().forEach((change) => {
        if (change.type === 'removed') {
          const changedDoc = toObject(change.doc)

          expect(changedDoc).toEqual(existsDoc)
          done()
        }
      })
    })

    dao.delete(existsDoc.id)
  })

  // it('observe add change with query', (done) => {
  //   const addedDoc = {
  //     bookTitle: 'add_query',
  //     created: new Date()
  //   }

  //   firestore.collection(collectionPath).where('book_title', '==', addedDoc.bookTitle)
  //     .onSnapshot((querySnapshot) => {
  //       querySnapshot.docChanges().forEach((change) => {
  //         if (change.type === 'added') {
  //           expect(change.doc.data()).toEqual(addedDoc)
  //           done()
  //         }
  //       })
  //     })
    // dao.where('book_title', '==', addedDoc.bookTitle)
    //   .onSnapshot((querySnapshot, toObject) => {
    //     querySnapshot.docChanges().forEach((change) => {
    //       if (change.type === 'added') {
    //         const changedDoc = toObject(change.doc)

    //         expect(changedDoc).toEqual({
    //           ...addedDoc,
    //           id: expect.anything(),
    //         })
    //         done()
    //       }
    //     })
    //   })

  //   dao.add(addedDoc)
  // })
})
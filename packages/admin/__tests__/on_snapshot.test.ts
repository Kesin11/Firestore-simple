import { FirestoreSimpleAdmin } from '../src'
import { AdminFirestoreTestUtil } from './util'

const util = new AdminFirestoreTestUtil()
const firestore = util.adminFirestore
const collectionPath = util.collectionPath
const firestoreSimple = new FirestoreSimpleAdmin(firestore)

interface Book {
  id: string,
  bookTitle: string,
  created: Date,
}

interface BookDoc {
  book_title: string,
  created: Date,
}

describe('on_snapshot test', () => {
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
  let existsDoc: Book

  beforeEach(async () => {
    const addedDoc = {
      bookTitle: 'exists',
      created: new Date(),
    }
    const addedId = await dao.add(addedDoc)
    existsDoc = {
      ...addedDoc,
      id: addedId,
    }
  })

  afterAll(async () => {
    await util.deleteApps()
  })

  afterEach(async () => {
    await util.deleteCollection()
  })

  it('observe add change', async () => {
    const doc = {
      bookTitle: 'add',
      created: new Date(),
    }

    const promise = new Promise((resolve) => {
      dao.onSnapshot((querySnapshot, toObject) => {
        querySnapshot.docChanges().forEach((change) => {
          if (change.type === 'added' && change.doc.data().book_title === doc.bookTitle) {
            const changedDoc = toObject(change.doc)

            expect(changedDoc).toEqual({
              ...doc,
              id: expect.anything()
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
      ...existsDoc,
      bookTitle: 'set'
    }

    const promise = new Promise((resolve) => {
      dao.onSnapshot((querySnapshot, toObject) => {
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
    // prepare specific doc for delete onSnapshot()
    // because onSnapshot() also triggerd deleteCollection() events and it will be confilict.
    const deletedDoc = {
      bookTitle: 'deleted',
      created: new Date(),
    }
    const deletedId = await dao.add(deletedDoc)

    const promise = new Promise((resolve) => {
      dao.onSnapshot((querySnapshot, toObject) => {
        querySnapshot.docChanges().forEach((change) => {
          if (change.type === 'removed' && change.doc.data().book_title === deletedDoc.bookTitle) {
            const changedDoc = toObject(change.doc)

            expect(changedDoc).toEqual({
              id: expect.anything(),
              bookTitle: deletedDoc.bookTitle,
              created: deletedDoc.created,
            })
            resolve()
          }
        })
      })
    })

    await new Promise((resolve) => setTimeout(resolve, 100)) // for async stability
    await dao.delete(deletedId)
    await promise
  })
})

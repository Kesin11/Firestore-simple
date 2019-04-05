import test from 'ava'
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
const now = new Date()

// Delete all documents. (= delete collection)
test.afterEach(async (_t) => {
  await deleteCollection(firestore, collectionPath)
})

test.serial('observe add change', async (t) => {
  const existsDoc = await dao.add({
    bookTitle: 'add',
    created: now,
  })

  const promise = new Promise((resolve) => {
    dao.onSnapshot((querySnapshot, toObject) => {
      querySnapshot.docChanges.forEach((change) => {
        if (change.type === 'added') {
          const changedDoc = toObject(change.doc)

          if (changedDoc.id === existsDoc.id) {
            t.deepEqual(changedDoc, existsDoc, 'added object')
            resolve()
          }
        }
      })
    })
  })

  await promise
})

// This test is flaky so skip it
test.serial.skip('observe set change', async (t) => {
  const promise = new Promise((resolve) => {
    dao.onSnapshot((querySnapshot, toObject) => {
      querySnapshot.docChanges.forEach((change) => {
        if (change.type === 'modified') {
          const changedDoc = toObject(change.doc)

          t.deepEqual(changedDoc, doc, 'modified object')
          resolve()
        }
      })
    })
  })

  const existsDoc = await dao.add({
    bookTitle: 'exists',
    created: now,
  })

  const doc = {
    id: existsDoc.id,
    bookTitle: 'set',
    created: now,
  }

  await dao.set(doc)
  await promise
})

// This test is flaky so skip it
test.serial.skip('observe delete change', async (t) => {
  const promise = new Promise((resolve) => {
    dao.onSnapshot((querySnapshot, toObject) => {
      querySnapshot.docChanges.forEach((change) => {
        if (change.type === 'removed') {
          const changedDoc = toObject(change.doc)

          t.deepEqual(changedDoc, existsDoc, 'removed object')
          resolve()
        }
      })
    })
  })

  const existsDoc = await dao.add({
    bookTitle: 'exists',
    created: now,
  })
  await dao.delete(existsDoc.id)
  await promise
})

test.serial('observe add change with query', async (t) => {
  await dao.add({
    bookTitle: 'hoge document',
    created: now,
  })
  const existsDoc = await dao.add({
    bookTitle: 'add',
    created: now,
  })

  const promise = new Promise((resolve) => {
    dao.where('book_title', '==', 'add')
      .onSnapshot((querySnapshot, toObject) => {
        querySnapshot.docChanges.forEach((change) => {
          if (change.type === 'added') {
            const changedDoc = toObject(change.doc)

            if (changedDoc.id === existsDoc.id) {
              t.deepEqual(changedDoc, existsDoc, 'added object')
              resolve()
            }
          }
        })
      })
  })

  await promise
})

# Firestore-simple
[![npm version](https://badge.fury.io/js/firestore-simple.svg)](https://badge.fury.io/js/firestore-simple)
[![Build Status](https://travis-ci.org/Kesin11/Firestore-simple.svg?branch=master)](https://travis-ci.org/Kesin11/Firestore-simple)
[![codecov](https://codecov.io/gh/Kesin11/Firestore-simple/branch/master/graph/badge.svg)](https://codecov.io/gh/Kesin11/Firestore-simple)

A simple wrapper for js Firestore.

It supports [Web](https://firebase.google.com/docs/reference/js/firebase.firestore?hl=ja), [Node.js](https://cloud.google.com/nodejs/docs/reference/firestore/latest) and [Cloud Functions](https://firebase.google.com/docs/reference/functions/functions.firestore?hl=ja).

Blog posts (sorry Japanese only)

- [Firestoreをもっと手軽に使えるfirestore-simpleを作った](http://kesin.hatenablog.com/entry/2018/06/12/095020)
- [Firestoreをもっと手軽に使えるfirestore-simpleがバージョン2になりました](http://kesin.hatenablog.com/entry/firestore_simple_v2)

# Introduction
Firestore is very convenient data store for web/native client.
But I feel original API is little complicated using with JavaScript/TypeScript.

firestore-simple provides more simple and useful API that also familiar with **JavaScript pure object**. It helps convert fetched Firestore object to pure object or easy to mapping to some class instance.

And firestore-simple also support TypeScript. You will no longer need to add type to fetched document from Firestore yourself.

# Install
```
npm i firestore-simple
```

# Usage
Use with Node.js admin SDK sample.

```javascript
// TypeScript
import admin, { ServiceAccount } from 'firebase-admin'
import serviceAccount from './firebase_secret.json' // your firebase secret json
import { FirestoreSimple } from 'firestore-simple'

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as ServiceAccount),
})
const firestore = admin.firestore()
firestore.settings({ timestampsInSnapshots: true })

interface User {
  id: string,
  name: string,
  age: number,
}

const main = async () => {
  // declaration
  const dao = new FirestoreSimple<User>({ firestore, path: 'example/ts_admin/user' })

  // create
  const user: User = await dao.add({ name: 'bob', age: 20 })
  console.log(user)
  // { name: 'bob', age: 20, id: '3Y5jwT8pB4cMqS1n3maj' }

  // fetch
  let bob: User | undefined = await dao.fetch(user.id)
  console.log(bob)
  // { id: '3Y5jwT8pB4cMqS1n3maj', age: 20, name: 'bob' }
  if (!bob) return

  // update
  bob.age = 30
  bob = await dao.set(bob)

  // add or set
  // same as 'add' when id is not given
  let alice: User = await dao.addOrSet({ name: 'alice', age: 22 })
  console.log(alice)
  // { name: 'alice', age: 22, id: 'YdfB2rkXoid603nKRX65' }

  alice.age = 30
  alice = await dao.addOrSet(alice)
  console.log(alice)
  // { name: 'alice', age: 30, id: 'YdfB2rkXoid603nKRX65' }

  // delete
  const deletedId = await dao.delete(bob.id)
  console.log(deletedId)
  // 3Y5jwT8pB4cMqS1n3maj

  await dao.delete(alice.id)

  // multi set
  // `bulkSet` and `bulkDelete` are wrapper for WriteBatch
  const _bulkSetBatch = await dao.bulkSet([
    { id: '1', name: 'foo', age: 1 },
    { id: '2', name: 'bar', age: 2 },
  ])

  // multi fetch
  const users: User[] = await dao.fetchAll()
  console.log(users)
  // [
  //   { id: '1', name: 'foo', age: 1 },
  //   { id: '2', age: 2, name: 'bar' },
  // ]

  // fetch by query
  const fetchedByQueryUser: User[] = await dao.where('age', '>=', 1)
                                .orderBy('age')
                                .limit(1)
                                .get()
  console.log(fetchedByQueryUser)
  // [ { id: '1', name: 'foo', age: 1 } ]

  // multi delete
  const _deletedDocBatch = await dao.bulkDelete(users.map((user) => user.id))
}

main()
```

# encode/decode
You can hook and convert object that will post to Firestore when before post. And also same as after fetch from Firestore. `encode` called before post and `decode` called after fetch.

It useful for example change property name, convert value, map to model class.

```javascript
class Book {
  public id: string
  public title: string
  public created: Date

  constructor ({ title, created }: { title: string, created: Date }) {
    this.id = title
    this.title = title
    this.created = created
  }
}
const dao = new FirestoreSimple<Book>({ firestore, path: 'book',
  encode: (book) => {
    return {
      id: book.id, // `id` is Optional
      book_title: book.title, // save as `book_title` in Firestore
      created: book.created,
    }
  },
  decode: (doc) => {
    return new Book({ // map to `Book` class instance
      title: doc.book_title, // restore to `title`
      created: doc.created.toDate(), // convert Firestore.Timestamp to Date
    })
  },
})

const book = new Book({ title: 'foobar', created: new Date() })
await dao.set(book)
const fetchedBook = await dao.fetch(book.id) // fetchedBook is instance of Book class
```

# onSnapshot
firestore-simple supports `onSnapshot` partially. You can use `toObject()` for `decode` Firestore document to your object.

```javascript
dao.where('age', '>=', 20)
  .onSnapshot((querySnapshot, toObject) => {
    querySnapshot.docChanges.forEach((change) => {
      if (change.type === 'added') {
        const changedDoc = toObject(change.doc)
      }
    })
  })
```

# Create a Subclass
You can define specify collection class extends FirestoreSimple instead of create FirestoreSimple instance. Here is subclass way of sample code appear in `encode/docode` section.

```javascript
class Book {
  public id: string
  public title: string
  public created: Date

  constructor ({ title, created }: { title: string, created: Date }) {
    this.id = title
    this.title = title
    this.created = created
  }
}

class BookDao extends FirestoreSimple<Book> {
  constructor ({ firestore }: { firestore: Firestore }) {
    super({ firestore, path: 'book' })
  }
  // override
  public encode (book: Book) {
    return {
      id: book.id,
      book_title: book.title,
      created: book.created,
    }
  }
  // override
  public decode (doc: {id: string, [props: string]: any}) {
    return new Book({
      title: doc.book_title,
      created: doc.created.toDate(),
    })
  }
}

const bookDao = new BookDao({ firestore })
```

# Currently not supported these Firestore features
- transaction (maybe support in next version)
- reference
- subcollection
- update

# Development
Unit tests are using **REAL Firestore(Firebase)**, not mock!

So if you want to run unit test in your local machine, please put your firebase secret json as `firebase_secret.json` in root directory.

# License
MIT

# Firestore-simple
[![Build Status](https://github.com/Kesin11/Firestore-simple/workflows/CI/badge.svg)](https://github.com/Kesin11/Firestore-simple/actions)
[![codecov](https://codecov.io/gh/Kesin11/Firestore-simple/branch/master/graph/badge.svg)](https://codecov.io/gh/Kesin11/Firestore-simple)

![firestore-simple-logo](https://user-images.githubusercontent.com/1324862/77878373-1cf81200-7293-11ea-8905-7d63a7de95b7.png)

> More simple, powerful and TypeScript friendly Firestore wrapper.

## Features

||firestore-simple|
|----|----|
|**More simple API**|Original Firestore only provide a slightly complicated low-level API. firestore-simple provide a simple and easy to use API.|
|**TypeScript friendly**|firestore-simple helps you type the document. You no longer need to cast after getting a document from Firestore.|
|**Encoding and decoding**|Convert js object <-> Firestore document every time? You need define to convert function just only one time.|
|**Easy and safe transaction**|firestore-simple allow same CRUD API in `runTransaction`. No longer need to worry about transaction context.|


## Packages

|Pakcages|version|Support Firestore SDK|
|----|----|----|
|[\@firestore-simple/admin](./packages/admin)|[![admin](https://badgen.net/npm/v/@firestore-simple/admin)](https://www.npmjs.com/package/@firestore-simple/admin)|admin SDK|
|[\@firestore-simple/web](./packages/web)|[![web](https://badgen.net/npm/v/@firestore-simple/web)](https://www.npmjs.com/package/@firestore-simple/web)|web SDK|


## Blog posts (sorry Japanese only)

- [Firestoreをもっと手軽に使えるfirestore-simpleがバージョン2になりました](http://kesin.hatenablog.com/entry/firestore_simple_v2)
- [TypeScriptからFirestoreを使いやすくするfirestore-simple v4をリリースしました](https://qiita.com/Kesin11/items/c2a52e4e33d6f8e83723)
- [firestore-simple v5をリリースしました](https://qiita.com/Kesin11/items/999011de9b6aeba37e78)

# :warning: `firestore-simple` is DEPRECATED
Previous [firestore-simple](https://www.npmjs.com/package/firestore-simple) is **DEPRECATED!**

`firestore-simple` is moved to [`@firestore-simple/admin`](https://www.npmjs.com/package/@firestore-simple/admin) and [`@firestore-simple/web`](https://www.npmjs.com/package/@firestore-simple/web). Please use these packages insted of `firestore-simple`.

If you are using firestore-simple before v7.0.0 with admin SDK, migrate your code like this.

```ts
// old
import { FirestoreSimple } from 'firestore-simple'

// new
import { FirestoreSimple } from '@firestore-simple/admin'
```


# Install
Firestore has two SDK [admin](https://firebase.google.com/docs/reference/admin/node) and [web](https://firebase.google.com/docs/reference/node) for js/ts. Please install firestore-simple which corresponds to the SDK you are using.

with admin SDK

```bash
npm i @firestore-simple/admin
```

with web SDK

```bash
npm i @firestore-simple/web
```

# Usage
These code using `@firestore-simple/admin` with admin SDK, but `@firestore-simple/web` has almost same API. So you can use same code with `@firestore-simple/web` for web SDK.

```ts
// TypeScript

import admin, { ServiceAccount } from 'firebase-admin'
import serviceAccount from '../../firebase_secret.json' // prepare your firebase secret json before exec example
import { FirestoreSimple } from '@firestore-simple/admin'

const ROOT_PATH = 'example/usage'

admin.initializeApp({ credential: admin.credential.cert(serviceAccount as ServiceAccount) })
const firestore = admin.firestore()

interface User {
  id: string,
  name: string,
  age: number,
}

const main = async () => {
  // declaration
  const firestoreSimple = new FirestoreSimple(firestore)
  const dao = firestoreSimple.collection<User>({ path: `${ROOT_PATH}/user` })

  // add
  const bobId = await dao.add({ name: 'bob', age: 20 })
  // 3Y5jwT8pB4cMqS1n3maj

  // fetch(get)
  // A return document is typed as `User` automatically.
  const bob: User | undefined = await dao.fetch(bobId)
  // { id: '3Y5jwT8pB4cMqS1n3maj', age: 20, name: 'bob' }

  // update
  await dao.set({
    id: bobId,
    name: 'bob',
    age: 30, // update 20 -> 30
  })

  // delete
  const deletedId = await dao.delete(bobId)
  // 3Y5jwT8pB4cMqS1n3maj

  // multi set
  // `bulkSet`, `bulkAdd` and `bulkDelete` are wrapper for WriteBatch
  await dao.bulkSet([
    { id: '1', name: 'foo', age: 1 },
    { id: '2', name: 'bar', age: 2 },
  ])

  // multi fetch
  const users: User[] = await dao.fetchAll()
  // [
  //   { id: '1', name: 'foo', age: 1 },
  //   { id: '2', name: 'bar', age: 2 },
  // ]

  // multi delete
  await dao.bulkDelete(users.map((user) => user.id))
}

main()
```

# Auto typing document data
firestore-simple automatically types document data retrieved from a collection by TypeScript generics, you need to pass type arguments when creating a FirestoreSimpleCollection object.

```ts
interface User {
  id: string, // Must need `id: string` property
  name: string,
  age: number,
}

const firestoreSimple = new FirestoreSimple(firestore)
const dao = firestoreSimple.collection<User>({ path: `user` })
```

After that, type of document obtained from FirestoreSimpleCollection will be `User`.

```ts
// fetch(get)
const bob: User | undefined = await dao.fetch(bobId)
```

**:bulb: NOTICE:**  
The type passed to the type argument **MUST** have an **`id`** property. The reason is that firestore-simple treats `id` as firestore document id and relies on this limitation to provide a simple API(ex: `fetch`, `set`).

# encode/decode
You can hook and convert object before post to Firestore and after fetch from firestore. 
`encode` is called before post, and `decode` is called after fetch.

It useful for common usecase, for example change property name, convert value, map to class instances and so on.

Here is example code to realize following these features.

- encode
  - Map `User` class each property to Firestore document key/value before post
  - Update `updated` property using Firebase server timestamp when update document
- decode
  - Map document data fetched from firestore to `User` class instance
  - Convert firebase timestamp object to javascript Date object

```ts
class User {
  constructor(
    public id: string,
    public name: string,
    public created: Date,
    public updated?: Date,
  ) { }
}

const firestoreSimple = new FirestoreSimple(firestore)
const dao = firestoreSimple.collection<User>({
  path: `user`,
  // Map `User` to firestore document
  encode: (user) => {
    return {
      name: user.name,
      created: user.created,
      updated: admin.firestore.FieldValue.serverTimestamp() // Using Firebase server timestamp when set document
    }
  },
  // Map firestore document to `User`
  decode: (doc) => {
    return new User(
      doc.id,
      doc.name,
      doc.created.toDate(), // Convert Firebase timestamp to js date object
      doc.updated.toDate()
    )
  }
})
```

## Generics of `FirestoreSimple.collection`
`FirestoreSimple.collection<T, S>` has two of the type arguments `T` and `S`. If property names of `T` and property names of the document in Firestore as same, you no longer to need `S`. firestore-simple provide auto completion and restriction in most methods by using `T`.

On the other hand, if property names of the document in Firestore are different from `T`, you need to assign `S` that has same property names as the document in firestore.

```ts
// T: A type that firestore-simple types automatically after fetch.
interface Book {
  id: string,
  bookTitle: string
  created: Date
}

// S: A type that has same property names the document in firestore.
interface BookDoc {
  book_title: string,
  created: Date,
}

const dao = firestoreSimple.collection<Book, BookDoc>({path: collectionPath,
  // Return object has to has same property names of `BookDoc`
  encode: (book) => {
    return {
      book_title: book.bookTitle,
      created: book.created,
    }
  },
  // Return object has to has same property names of `Book`
  decode: (doc) => {
    return {
      id: doc.id,
      bookTitle: doc.book_title,
      created: doc.created.toDate(),
    }
  },
})
```

# onSnapshot
firestore-simple partially supports `onSnapshot`. You can map raw document data to an object with `decode` by using `toObject() `.

```ts
dao.where('age', '>=', 20)
  .onSnapshot((querySnapshot, toObject) => {
    querySnapshot.docChanges.forEach((change) => {
      if (change.type === 'added') {
        const changedDoc = toObject(change.doc) // changeDoc is mapped by `decode`.
      }
    })
  })
```

# Subcollection
firestore-simple does not provide API that direct manipulate subcollection. But `collectionFactory` is useful for subcollection.

It can define `encode` and `decode` but not `path`. You can create Collection instance from `CollectionFactory` with `path` and both `encode` and `decode` are inherited from the factory.

This is example using `collectionFactory` for subcollection.

```ts
// Subcollection: /user/${user.id}/friend
interface UserFriend {
  id: string,
  name: string,
  created: Date,
}

const userNames = ['alice', 'bob', 'john']

const main = async () => {
  const firestoreSimple = new FirestoreSimple(firestore)

  // Create factory with define `decode` function for subcollection
  const userFriendFactory = firestoreSimple.collectionFactory<UserFriend>({
    decode: (doc) => {
      return {
        id: doc.id,
        name: doc.name,
        created: doc.created.toDate()
      }
    }
  })

  const users = await userDao.fetchAll()
  for (const user of users) {
    // Create subcollection dao that inherited `decode` function defined in factory
    const userFriendDao = userFriendFactory.create(`user/${user.id}/friend`)

    const friends = await userFriendDao.fetchAll()
  }
```

# CollectionGroup
Firestore `CollectionGroup` is also supported. As same as `FirestoreSimple.collection`, `FirestoreSimple.collectionGroup` has generics and decode features too.

```ts
interface Review {
  id: string,
  userId: string,
  text: string,
  created: Date,
}

// Create CollectionGroup dao
const firestoreSimple = new FirestoreSimple(firestore)
const reviewCollectionGroup = firestoreSimple.collectionGroup<Review>({
  collectionId: 'review',
  decode: (doc) => {
    return {
      id: doc.id,
      userId: doc.userId,
      text: doc.text,
      created: doc.created.toDate() // Convert timestamp to Date
    }
  }
})

// Fetch CollectionGroup documents
const reviews = await reviewCollectionGroup.fetch()
```

# Transaction
When using `runTransaction` with the original firestore, some methods like `get()`, `set()` and `delete()` need to be called from the `transaction` object. This is complicated and not easy to use.  

firestore-simple allows you to use the same API in transactions. This way, you don't have to change your code depending on whether inside `runTransaction` block or not.

```ts
interface User {
  id: string,
  name: string,
}
const docId = 'alice'

// Original firestore transaction
const collection = firestore.collection(`${ROOT_PATH}/user`)
await firestore.runTransaction(async (transaction) => {
  const docRef = collection.doc(docId)
  // Get document lock
  await transaction.get(docRef)

  // Update document
  transaction.set(docRef, { name: docId })

  // Add new document
  const newDocRef = collection.doc()
  transaction.set(newDocRef, { name: newDocRef.id })
})

// firestore-simple transaction
const firestoreSimple = new FirestoreSimple(firestore)
const dao = firestoreSimple.collection<User>({ path: `${ROOT_PATH}/user` })
await firestoreSimple.runTransaction(async (_tx) => {
  await dao.fetch(docId)

  await dao.set({ id: docId, name: docId })

  await dao.add({ name: 'new doc' })
})
```

If you want to see more transaction example, please check [example code](./packages/admin/example) and [test code](./packages/admin/__tests__).

# Batch
firestore-simple provides `runBatch` it similar to `runTransaction`.  
`set()`, `update()`, `delete()` executed in the `runBatch` callback function are executed by `batch.commit()` at the end of the block. firestore-simple handles creating batch at start of `runBatch` and commit at end of `runBatch`.

```ts
interface User {
  id: string,
  name: string,
  rank: number,
}
const userNames = ['bob', 'alice', 'john', 'meary', 'king']

const firestoreSimple = new FirestoreSimple(firestore)
const userDao = firestoreSimple.collection<User>({ path: `${ROOT_PATH}/user` })

// add() convert batch.add() inside runBatch and batch.commit() called at end of block.
await firestoreSimple.runBatch(async (_batch) => {
  let rank = 1
  for (const name of userNames) {
    await userDao.add({ name, rank })
    rank += 1
  }
  console.dir(await userDao.fetchAll()) // Return empty at here.
})
// <- `batch.commit()`

// Can use update() and delete() also set().
await firestoreSimple.runBatch(async (_batch) => {
  let rank = 0
  for (const user of users) {
    if (user.rank < 4) {
      // Update rank to zero start
      await userDao.update({ id: user.id, rank })
    } else {
      // Delete 'meary' and 'king'
      await userDao.delete(user.id)
    }
    rank += 1
  }
})
// <- `batch.commit()`
```

If you want to see more runBatch example, please check [example code](./packages/admin/example) and [test code](./packages/admin/__tests__).


If you just want to add/set/delete documents with array, you can use `bulkAdd`, `bulkSet`, `bulkDelete`. These are simple wrapper of batch execution.

# FieldValue.increment
Firestore can increment or decrement a numeric field value. This is very useful for counter like fields.  
see: https://firebase.google.com/docs/firestore/manage-data/add-data?hl=en#increment_a_numeric_value


firestore-simple supports to `update` a document using special value of `FieldValue`. So of course you can use `FieldValue.increment` with update.

```ts
interface User {
  id: string,
  coin: number,
  timestamp: Date,
}

const firestoreSimple = new FirestoreSimple(firestore)
const dao = firestoreSimple.collection<User>({ path: `${ROOT_PATH}/user` })

// Setup user
const userId = await dao.add({
  coin: 100,
  timestamp: FieldValue.serverTimestamp()
})

// Add 100 coin and update timestamp
await dao.update({
  id: userId,
  coin: FieldValue.increment(100),
  timestamp: FieldValue.serverTimestamp()
})

console.log(await dao.fetch(userId))
// { id: 'E4pROVpeLaE3WBCYDDSh',
//   coin: 200,
//   timestamp: Timestamp { _seconds: 1560666401, _nanoseconds: 731000000 } }
```


# Fallback to use original Firestore document
Unfortunately firestore-simple does not support all the features of Firestore, so sometimes you may want to use raw collection references or document references.

In this case, you can get raw collection reference from Collection using `collectionRef` also document reference using `docRef(docId)`.

```ts
const firestoreSimple = new FirestoreSimple(firestore)
const dao = firestoreSimple.collection<User>({ path: `user` })

// Same as firestore.collection('user')
const collectionRef = dao.collectionRef

// Same as firestore.collection('user').doc('documentId')
const docRef = dao.docRef('documentId')
```

# More API and example
firestore-simple provide more API and support almost firestore features.  
ex: `addOrSet`, `update`, `where`, `orderBy`, `limit`.

You can find more example from [example directory](./packages/admin/example). Also [test code](./packages/admin/__tests__) maybe as good sample.

# API document
Sorry not yet. Please check [source code](./packages/admin/src) or look interface using your IDE.

# Feature works
- [x] Support [web SDK](https://firebase.google.com/docs/reference/js/firebase.firestore) with basic feature
- [ ] Support web SDK advanced feature (e.g. support web SDK only option in some methods like `get`, `onSnapshot`)
- [ ] API document

# Contribution
Patches are welcome!  
Also welcome fixing english documentation.

# Development
Unit tests are using [Firestore local emulator](https://firebase.google.com/docs/emulator-suite).

So if you want to run unit test in your local machine, start emulator in background before run test.

```bash
# setup monorepo
npm ci
npm run bootstrap

cd packages/admin # or packages/web

npm run emulators:start
npm run test
```

# Versioning

The versioning follows [Semantic Versioning](http://semver.org/):

> Given a version number MAJOR.MINOR.PATCH, increment the:
>
> 1. MAJOR version when you make incompatible API changes,
> 2. MINOR version when you add functionality in a backwards-compatible manner, and
> 3. PATCH version when you make backwards-compatible bug fixes.

# License
MIT

# Logo
<div>Icons made by <a href="https://www.flaticon.com/authors/those-icons" title="Those Icons">Those Icons</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></div>

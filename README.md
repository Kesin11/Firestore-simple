# Firestore-simple
[![npm version](https://badge.fury.io/js/firestore-simple.svg)](https://badge.fury.io/js/firestore-simple)
[![Build Status](https://travis-ci.org/Kesin11/Firestore-simple.svg?branch=master)](https://travis-ci.org/Kesin11/Firestore-simple)
[![codecov](https://codecov.io/gh/Kesin11/Firestore-simple/branch/master/graph/badge.svg)](https://codecov.io/gh/Kesin11/Firestore-simple)

More simple, powerful and TypeScript friendly Firestore wrapper.

- **More simple API:** Original Firestore only provide a slightly complicated low-level API. firestore-simple provide a simple and easy to use API.
- **TypeScript friendly:** firestore-simple helps you type the document. You no longer need to cast after getting a document from Firestore.
- **Encoding and decoding:** Convert js object <-> firestore document every time? You need define to convert function just only one time.
- **Easy and safe transaction:** firestore-simple allow same CRUD API in `runTransaction`. No longer need to worry about transaction context.
- **A lot of test:** Test many of the Firestore features using **REAL** Firestore instead of an emulator.

|Support Firestore SDK|
|----|
|[Cloud Functions](https://firebase.google.com/docs/reference/functions/functions.firestore)|
|[admin](https://firebase.google.com/docs/reference/admin/node/admin.firestore)|


Blog posts (sorry Japanese only)

- [Firestoreをもっと手軽に使えるfirestore-simpleを作った](http://kesin.hatenablog.com/entry/2018/06/12/095020)
- [Firestoreをもっと手軽に使えるfirestore-simpleがバージョン2になりました](http://kesin.hatenablog.com/entry/firestore_simple_v2)

# Install
```
npm i firestore-simple
```

# Usage
Use with Node.js admin SDK sample.

```javascript
// TypeScript
import admin, { ServiceAccount } from 'firebase-admin'
import serviceAccount from '../../firebase_secret.json' // prepare your firebase secret json before exec example
import { FirestoreSimple } from 'firestore-simple'

const ROOT_PATH = 'example/usage'

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as ServiceAccount),
})
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

  // fetch(get)
  const bob: User | undefined = await dao.fetch(bobId)
  console.log(bob)
  // { id: '3Y5jwT8pB4cMqS1n3maj', age: 20, name: 'bob' }
  if (!bob) return

  // update
  await dao.set({
    id: bobId,
    name: 'bob',
    age: 30, // update 20 -> 30
  })

  // add or set
  // same as 'add' when id is not given
  const aliceId = await dao.addOrSet({ name: 'alice', age: 22 })
  // same as 'set' when id is given
  await dao.addOrSet({
    id: aliceId,
    name: 'alice',
    age: 30, // update 22 -> 30
  })
  const alice: User | undefined = await dao.fetch(aliceId)
  console.log(alice)
  // { name: 'alice', age: 30, id: 'YdfB2rkXoid603nKRX65' }

  // delete
  const deletedId = await dao.delete(bobId)
  console.log(deletedId)
  // 3Y5jwT8pB4cMqS1n3maj

  await dao.delete(aliceId)

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
  //   { id: '2', name: 'bar', age: 2 },
  // ]

  // fetch by query
  const fetchedByQueryUser: User[] = await dao.where('age', '>=', 1)
                                .orderBy('age')
                                .limit(1)
                                .fetch()
  console.log(fetchedByQueryUser)
  // [ { id: '1', name: 'foo', age: 1 } ]

  // multi delete
  const _deletedDocBatch = await dao.bulkDelete(users.map((user) => user.id))
}

main()
```

# Auto typing document data
firestore-simple automatically types document data retrieved from a collection by TypeScript generics, you need to pass type arguments when creating a FirestoreSimpleCollection object.

```js
interface User {
  id: string, // Must need `id: string` property
  name: string,
  age: number,
}

const firestoreSimple = new FirestoreSimple(firestore)
const dao = firestoreSimple.collection<User>({ path: `user` })
```

After that, type of document obtained from FirestoreSimpleCollection will be `User`.

```js
// fetch(get)
const bob: User | undefined = await dao.fetch(bobId)
```

**NOTICE:** The type passed to the type argument **MUST** have an `id` property. The reason is that firestore-simple treats `id` as firestore document id and relies on this limitation to provide a simple API(ex: `fetch`, `set`).

# encode/decode
You can hook and convert object before post to firestore and after fetch from firestore. 
`encode` is called before post, and `decode` is called after fetch.

It useful for common usecase, for example change property name, convert value, map to class instances and so on.

Here is example code to realize following these features.

- encode
  - Map `User` class each property to firestore document key/value before post
  - Update `updated` property using Firebase server timestamp when update document
- decode
  - Map document data fetched from firestore to `User` class instance
  - Convert firebase timestamp object to javascript Date object

```js
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
  encode: (user) => {
    return {
      name: user.name,
      created: user.created,
      updated: admin.firestore.FieldValue.serverTimestamp() // Using Firebase server timestamp when set document
    }
  },
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

# onSnapshot
firestore-simple partially supports `onSnapshot`. You can map raw document data to an object with `decode` by using `toObject() `.

```js
dao.where('age', '>=', 20)
  .onSnapshot((querySnapshot, toObject) => {
    querySnapshot.docChanges.forEach((change) => {
      if (change.type === 'added') {
        const changedDoc = toObject(change.doc)
      }
    })
  })
```

# Subcollection
firestore-simple does not provide API that direct manipulate subcollection. But `collectionFactory` is useful for subcollection.

It can define `encode` and `decode` but not `path`. You can create FirestoreSimpleCollection from this factory with `path` and both `encode` and `decode` are inherited from the factory.

This is example using `collectionFactory` for subcollection.

```js
// Subcollection user/${user.id}/friend
interface UserFriend {
  id: string,
  name: string,
  created: Date,
}

const userNames = ['alice', 'bob', 'john']

const main = async () => {
  const firestoreSimple = new FirestoreSimple(firestore)

  // Create factory with define decode function for subcollection
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
    // Create subcollection dao that inherited decode function defined in factory
    const userFriendDao = userFriendFactory.create(`user/${user.id}/friend`)

    const friends = await userFriendDao.fetchAll()
  }
```

# Transaction
When using `runTransaction` with the original firestore, some methods like `get()`, `set()` and `delete()` need to be called from the `transaction` object. This is complicated and not easy to use.  

firestore-simple allows you to use the same API in transactions. This way, you don't have to change your code depending on whether inside `runTransaction` block or not.

```js
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

If you want to see more transaction example, please check [example code](./example) and [test code](./__tests__).

# FieldValue.increment
Firestore can increment or decrement a numeric field value. This is very useful for counter like fields.  
see: https://firebase.google.com/docs/firestore/manage-data/add-data?hl=en#increment_a_numeric_value


firestore-simple supports to update a document using special value of `FieldValue`. So of course you can use `FieldValue.increment` with update.

```js
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


# Fallback to use original firestore
Unfortunately firestore-simple does not support all the features of Firestore, so sometimes you may want to use raw collection references or document references.

In this case, you can get raw collection reference from FirestoreSimpleCollection using `collectionRef` also document reference using `docRef(docId)`.

```js
const firestoreSimple = new FirestoreSimple(firestore)
const dao = firestoreSimple.collection<User>({ path: `user` })

// Same as firestore.collection('user')
const collectionRef = dao.collectionRef

// Same as firestore.collection('user').doc('documentId')
const docRef = dao.docRef('documentId')
```

# More example
You can find more example from [example directory](./example). Also [test code](./__tests__) maybe as good sample.

# API document
Sorry not yet. Please check [source code](./src) or look interface using your IDE.

# Feature works
- [ ] Support new feature of firestore
  - incrementValue, collectionGroup, etc...
- [x] Support [pagination](https://firebase.google.com/docs/firestore/query-data/query-cursors)
- [ ] API document
- [ ] Lint with eslint
- [x] Continuous upgrade and test new firestore SDK using with [Renovate](https://renovatebot.com/)(or similar other tool)
- [ ] Support [web sdk](https://firebase.google.com/docs/reference/js/firebase.firestore)

# Contribution
Patches are welcome!  
Olso welcome fixing english documentation.

# Development
Unit tests are using **REAL Firestore(Firebase)**, not mock!

So if you want to run unit test in your local machine, please put your firebase secret json as `firebase_secret.json` in root directory.

# License
MIT

# Firestore-simple
[![Build Status](https://travis-ci.org/Kesin11/Firestore-simple.svg?branch=master)](https://travis-ci.org/Kesin11/Firestore-simple)

A simple wrapper for Firestore.

It support [nodejs](https://cloud.google.com/nodejs/docs/reference/firestore/0.13.x/) and [ReactNativeFirebase](https://rnfirebase.io/).  
I haven't tried [web JavaScript client](https://firebase.google.com/docs/reference/js/firebase.firestore) yet, but I think it maybe works.

# Introduction
Firestore is very convenient data store for web/native client.
But I think original API is little complicated using with JavaScript.

firestore-simple provides more simple and useful API that also familiar with JavaScript pure object. It allows you to achieve the same behavior as original Firestore API with fewer lines of code.

It just wrapper class for firestore object, so you can use for nodejs client and ReactNativeFirebase (and maybe web Javascript client) with same code.

# Install
```
npm i firestore-simple
```

# Usage
```javascript
import { FirestoreSimple } from 'firestore-simple'
import { Firestore } from '@google-cloud/firestore'
import admin from 'firebase-admin'
import serviceAccount from './firebase_secret.json' // need your firebase secret json

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})
const firestore = admin.firestore()
const collectionPath = 'sample_node'
const dao = new FirestoreSimple(firestore, collectionPath, {
  mapping: {
    createdAt: 'created_at'
  }
})

const main = async () => {
  const existsDoc = {
    title: 'title',
    url: 'http://example.com',
    createdAt: new Date()
  }

  let doc = await dao.add(existsDoc)
  console.log(doc)
  // {
  //   id: 'dQU413MsVLQRJ8elvr3y',
  //   title: 'title',
  //   url: 'http://example.com',
  //   createdAt: 2018-05-29T13:47:39.762Z
  // }

  doc.title = 'fixed_title'
  doc = await dao.set(doc)
  console.log(doc)
  // {
  //   id: 'dQU413MsVLQRJ8elvr3y',
  //   title: 'fixed_title',
  //   url: 'http://example.com',
  //   createdAt: 2018-05-29T13:47:39.762Z
  // }

  const deletedDocId = await dao.delete(doc.id)
  console.log(deletedDocId)
  // dQU413MsVLQRJ8elvr3y

  doc = await dao.addOrSet({title: 'add_or_set add'}) // same as 'add' when id is not given
  console.log(doc)
  // { id: 'RBb1uA94jsYn4QTUsvUr', title: 'add_or_set add' }

  doc.title = 'add_or_set set'
  doc = await dao.addOrSet(doc) // same as 'set' when id is given
  console.log(doc)
  // { id: 'RBb1uA94jsYn4QTUsvUr', title: 'add_or_set set' }

  // `bulkSet` and `bulkDelete` are wrapper for WriteBatch
  // https://cloud.google.com/nodejs/docs/reference/firestore/0.13.x/WriteBatch
  const bulkSetBatch = await dao.bulkSet([
    {
      id: '1',
      title: 'bulk_set1'
    },
    {
      id: '2',
      title: 'bulk_set2'
    }
  ])

  const fetchedDocs = await dao.fetchCollection()
  console.log(fetchedDocs)
  // [
  //   { id: '1', title: 'bulk_set1' },
  //   { id: '2', title: 'bulk_set2' } 
  // ]

  const query = dao.collectionRef
    .where('title', '==', 'bulk_set1')
    .orderBy('order')
    .limit(1)
  const queryFetchedDocs = await dao.fetchByQuery(query)
  console.log(queryFetchedDocs)
  // [ { id: '1', order: 2, title: 'bulk_set1' } ]

  const deletedDocBatch = await dao.bulkDelete(fetchedDocs.map((doc) => doc.id))
}

main()
```

[update](https://cloud.google.com/nodejs/docs/reference/firestore/0.13.x/DocumentReference#update) and [transaction](https://cloud.google.com/nodejs/docs/reference/firestore/0.13.x/Transaction) are not supported yet.

# TypeScript
firestore-simple is written by TypeScript and type file is included.

# Develop
Unit tests are using **REAL Firestore(Firebase)**, not mock!

So if you want to run unit test in your local machine, please put your firebase secret json as `firebase_secret.json` in root directory.

# License
MIT


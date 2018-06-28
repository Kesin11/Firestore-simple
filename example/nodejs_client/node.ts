import { FirestoreSimple } from 'firestore-simple'
import { Firestore } from '@google-cloud/firestore'
import admin from 'firebase-admin'
import serviceAccount from '../firebase_secret.json'

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
  console.log('add', doc)

  doc = await dao.fetchDocument(doc.id)
  console.log('fetchDocument')

  doc.title = 'fixed_title'
  doc = await dao.set(doc)
  console.log('set', doc)

  const deletedDocId = await dao.delete(doc.id)
  console.log('delete', deletedDocId)

  doc = await dao.addOrSet({title: 'add_or_set add'})
  console.log('addOrSet', doc)
  doc.title = 'add_or_set set'
  doc = await dao.addOrSet(doc)
  console.log('addOrSet', doc)

  await dao.delete(doc.id)

  const bulkSetBatch = await dao.bulkSet([
    {
      id: '1',
      order: 2,
      title: 'bulk_set1'
    },
    {
      id: '2',
      order: 1,
      title: 'bulk_set2'
    }
  ])
  console.log('bulkSet', bulkSetBatch)

  const fetchedDocs = await dao.fetchCollection()
  console.log('fetchCollectoin', fetchedDocs)

  const query = dao.collectionRef
    .where('title', '==', 'bulk_set1')
    .orderBy('order')
    .limit(1)
  const queryFetchedDocs = await dao.fetchByQuery(query)
  console.log('fetchByQuery', queryFetchedDocs)

  const deletedDocBatch = await dao.bulkDelete(fetchedDocs.map((doc) => doc.id))
  console.log('bulkDelete', deletedDocBatch)
}

main()
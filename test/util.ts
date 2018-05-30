import { Firestore } from '@google-cloud/firestore'
import crypto from 'crypto'
import admin from 'firebase-admin'
// because this file path will be dist_test/test/util.js after tsc
import serviceAccount from '../../firebase_secret.json'

export const initFirestore = () => {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })
  return admin.firestore()
}

export const deleteCollection = async (firestore: Firestore, collectionPath: string) => {
  const batch = firestore.batch()
  const snapshot = await firestore.collection(collectionPath).get()
  snapshot.forEach((doc) => {
    batch.delete(doc.ref)
  })
  await batch.commit()
}

export const createRandomCollectionName = (prefix = 'firebase_simple_') => {
  const str = crypto.randomBytes(10).toString('hex')
  return prefix + str
}

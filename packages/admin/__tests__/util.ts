import { Firestore } from '@google-cloud/firestore'
import crypto from 'crypto'
import admin, { ServiceAccount } from 'firebase-admin'
import serviceAccount from '../firebase_secret.json'

// Using local Firestore emulator
export const initFirestore = () => {
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080'
  admin.initializeApp({})
  const firestore = admin.firestore()
  firestore.settings({ timestampsInSnapshots: true })
  return firestore
}

// Using real Firestore
export const initRealFirestore = () => {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as ServiceAccount),
  })
  const firestore = admin.firestore()
  firestore.settings({ timestampsInSnapshots: true })
  return firestore
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

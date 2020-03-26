import { Firestore } from '@google-cloud/firestore'
import crypto from 'crypto'
import admin, { ServiceAccount } from 'firebase-admin'
import serviceAccount from '../firebase_secret.json'

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

export class AdminFirestoreTestUtil {
  adminFirestore: Firestore
  collectionPath: string

  static initFirestore (real: boolean) {
    if (real) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as ServiceAccount),
      })
    } else {
      // Firestore still need to resolve firebase project name even using local emulator, so set real firebase project id
      process.env.GCLOUD_PROJECT = 'firestore-simple-test'
      process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080'
      admin.initializeApp({})
    }
    return admin.firestore()
  }

  constructor ({ real }: {real?: boolean} = {}) {
    real = real || false
    // Use random collectionPath to separate each test namespace for concurrent testing
    this.collectionPath = crypto.randomBytes(10).toString('hex')
    this.adminFirestore = AdminFirestoreTestUtil.initFirestore(real)
  }

  // Clear collection all documents.
  // Use in 'afterEach'
  async deleteCollection () {
    const batch = this.adminFirestore.batch()
    const snapshot = await this.adminFirestore.collection(this.collectionPath).get()
    snapshot.forEach((doc) => {
      batch.delete(doc.ref)
    })
    await batch.commit()
  }

  // Delete firebase listner
  // Use in 'afterAll'
  async deleteApps () {
    await Promise.all(admin.apps.map((app) => app?.delete()))
  }
}

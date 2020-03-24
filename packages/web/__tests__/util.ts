// import fs from 'fs'
import * as firebase from '@firebase/testing'
import crypto from 'crypto'

// This is workaround for avoid error which occure using firestore.FieldValue.increment() with update() or set()
// FieldValue which from `import { firestore } from 'firebase'` maybe can not use when using local emulator.
// FieldValue which from @firebase/testing is OK. So export it for using FieldValue in each tests.
export const FieldValue = firebase.firestore.FieldValue

export class WebFirestoreTestUtil {
  projectId: string
  uid: string
  webFirestore: firebase.firestore.Firestore

  constructor () {
    // Use random projectId to separate emulator firestore namespace for concurrent testing
    const randomStr = crypto.randomBytes(10).toString('hex')
    this.projectId = `test-${randomStr}`
    this.uid = 'test-user'

    // Setup web Firestore and admin Firestore with using emulator
    this.webFirestore = firebase.initializeTestApp({
      projectId: this.projectId,
      auth: { uid: this.uid }
    }).firestore()
  }

  // Clear emulator Firestore data
  // Use in 'afterEach'
  async clearFirestoreData () {
    await firebase.clearFirestoreData({ projectId: this.projectId })
  }

  // Delete firebase listner
  // Use in 'afterAll'
  async deleteApps () {
    await Promise.all(firebase.apps().map(app => app.delete()))
  }
}

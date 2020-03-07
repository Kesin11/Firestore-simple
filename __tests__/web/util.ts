// import fs from 'fs'
import { Firestore } from '@google-cloud/firestore'
import * as firebase from '@firebase/testing'
import crypto from 'crypto'

export class WebFirestoreTestUtil {
  projectId: string
  uid: string
  webFirestore: firebase.firestore.Firestore
  adminFirestore: Firestore

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

    this.adminFirestore = firebase.initializeAdminApp({
      projectId: this.projectId
    }).firestore() as unknown as Firestore
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

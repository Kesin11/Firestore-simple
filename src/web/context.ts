import type { firestore } from 'firebase'

export class Context {
  firestore: firestore.Firestore
  constructor (firestore: firestore.Firestore) {
    this.firestore = firestore
  }
}

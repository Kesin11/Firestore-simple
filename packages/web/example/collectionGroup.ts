import firebase from 'firebase/app'
import 'firebase/firestore'
import { FirestoreSimple } from '../src/'

const app = firebase.initializeApp({
  projectId: 'example'
})
const firestore = firebase.firestore()
firestore.useEmulator('localhost', 8080)

const ROOT_PATH = 'example/web_collection_group'

interface Review {
  id: string,
  userId: string,
  text: string,
  created: Date,
}

const userNames = ['alice', 'bob', 'john']
const collectionId = 'review'

const main = async (): Promise<void> => {
  // Prepare review documents
  await firestore.collection(`${ROOT_PATH}/user/alice/${collectionId}`)
    .add({ userId: 'alice', text: 'aaa', created: firebase.firestore.FieldValue.serverTimestamp() })
  await firestore.collection(`${ROOT_PATH}/user/bob/${collectionId}`)
    .add({ userId: 'bob', text: 'bbb', created: firebase.firestore.FieldValue.serverTimestamp() })
  await firestore.collection(`${ROOT_PATH}/user/john/${collectionId}`)
    .add({ userId: 'john', text: 'ccc', created: firebase.firestore.FieldValue.serverTimestamp() })

  // Create CollectionGroup dao
  const firestoreSimple = new FirestoreSimple(firestore)
  const reviewCollectionGroup = firestoreSimple.collectionGroup<Review>({
    collectionId: 'review',
    decode: (doc) => {
      return {
        id: doc.id,
        userId: doc.userId,
        text: doc.text,
        created: doc.created.toDate()
      }
    }
  })

  // Fetch CollectionGroup documents
  const reviews = await reviewCollectionGroup.fetch()
  console.dir(reviews)
  // [ { id: 'sElJjoIFDgjGy89izlnK',
  //   userId: 'alice',
  //   text: 'aaa',
  //   created: 2019-12-26T15:33:17.883Z },
  // { id: 'upM1SLLjkVTf8uWFuYPp',
  //   userId: 'bob',
  //   text: 'bbb',
  //   created: 2019-12-26T15:33:18.171Z },
  // { id: 'k7b4wBzGhzxjyXg8KmCK',
  //   userId: 'john',
  //   text: 'ccc',
  //   created: 2019-12-26T15:33:18.411Z } ]

  // Remove documents
  for (const user of userNames) {
    const userReivewDao = firestoreSimple.collection({ path: `${ROOT_PATH}/user/${user}/review` })
    const reviews = await userReivewDao.fetchAll()

    await userReivewDao.bulkDelete(reviews.map((review) => review.id))
  }

  await app.delete()
}
main()

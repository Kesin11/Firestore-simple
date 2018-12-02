import { Firestore } from '@google-cloud/firestore'
import admin, { ServiceAccount } from 'firebase-admin'
import serviceAccount from '../../firebase_secret.json'
import { FirestoreSimple } from '../../src'

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as ServiceAccount),
})
const firestore = admin.firestore()
firestore.settings({ timestampsInSnapshots: true })

class Book {
  public id: string
  public title: string
  public created: Date

  constructor ({ title, created }: { title: string, created: Date }) {
    this.id = title
    this.title = title
    this.created = created
  }
}

class BookDao extends FirestoreSimple<Book> {
  constructor ({ firestore }: {firestore: Firestore}) {
    super({ firestore, path: 'example/ts_admin/book' })
  }
  // override
  public encode (book: Book) {
    return {
      id: book.id,
      book_title: book.title,
      created: book.created,
    }
  }
  // override
  public decode (doc: {id: string, [props: string]: any}) {
    return new Book({
      title: doc.book_title,
      created: doc.created.toDate(),
    })
  }
}

const main = async () => {
  const dao = new BookDao({ firestore })

  const book = new Book({ title: 'foobar', created: new Date() })
  console.log(book)
  await dao.set(book)

  const fetchedBook = await dao.fetch(book.id)
  console.log(fetchedBook)
}

main()

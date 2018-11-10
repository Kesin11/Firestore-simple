import { Firestore } from '@google-cloud/firestore'
import admin, { ServiceAccount } from 'firebase-admin'
import { Assign } from 'utility-types'
import { FirestoreSimple } from '.'
import serviceAccount from '../firebase_secret.json'

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as ServiceAccount),
})
const firestore = admin.firestore()
firestore.settings({ timestampsInSnapshots: true })

interface User {
  id: string
  age: number
  name: string,
  createdAt: Date
}
const main = async () => {
  const userDao = new FirestoreSimple<User>({ firestore, path: 'user',
    encode: (user) => {
      return {
        name: user.name,
        age: user.age,
        created_at: user.createdAt,
      }
    },
    decode: (obj) => {
      return {
        id: obj.id,
        age: obj.age,
        name: obj.name,
        createdAt: obj.created_at.toDate(),
      }
    },
  })
  const user = await userDao.fetch('z4E1NZdNqH1dbcP53oER')
  console.log(user)
  await userDao.set({ id: '1', age: 20, name: 'bob', createdAt: new Date() })
  const newUser = await userDao.add({ id: 'dummy', age: 22, name: 'add', createdAt: new Date() })
  await userDao.delete(newUser.id)
}
main()

interface Book {
  id: string,
  name: string,
  ISBN: number
}
class BookDao extends FirestoreSimple<Book> {
  constructor ({ firestore, path }: {firestore: Firestore, path: string}) {
    super({ firestore, path })
  }

  public encode (book: Assign<Book, {id?: string}>) {
    return {
      name: book.name,
      isbn: book.ISBN,
    }
  }

  public decode (book: {id: string, [props: string]: any}) {
    return {
      id: book.id,
      name: book.name,
      ISBN: book.isbn,
    }
  }
}

const main2 = async () => {
  const bookDao = new BookDao({ firestore, path: 'book' })
  await bookDao.add({ name: 'book1', ISBN: 1111 })
}
main2()

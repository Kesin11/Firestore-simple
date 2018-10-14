# Firestore-simple

# Usage
## nodejs client

```typescript
const firestore = admin.firestore()
interface User {
  id: string,
  name: string,
  age: number,
  createdAt: Date
}
// declaration
const dao = new FirestoreSimple<User>({firestore, path: 'users'})

// create
const user = await dao.add({name: 'bob', age: 20, createdAt: new Date()})
const userId = user.id

// single read
let bob = await dao.fetch(userId)

// update
bob.age = 30
bob = await dao.set(bob)

// delete
const deletedId = await dao.delete(bob.id)

// add or create
let doc = await dao.addOrSet({name: 'alice', age: 22, createdAt: new Date()})
doc.name = 'find_or_set'
doc = await dao.addOrSet(doc)

// multi set
const bulkSetBatch = await dao.bulkSet([
  { name: 'foo', age, 1, createdAt: new Date()},
  { name: 'bar', age, 2, createdAt: new Date()},
])

// multi fetch
const users = await dao.fetchAll()

// multi delete
const deletedDocBatch = await dao.bulkDelete(users.map((user) => user.id))
const deletedDocBatch = await dao.bulkDelete(users) // overload

// query
// 従来はcollectionRefを露出させていたが、それも隠蔽したい
// whereClause?的なオブジェクト生成してメソッドチェーンでクエリを渡して、最後にget()を呼べばできそうな気がする
const fetchedByQueryUser = dao.where('age', '==', '20')
                              .orderBy('age')
                              .limit(1)
                              .fetch()

// convert before store to firestore
const encode = (obj: User): {[props: string]: any} => {
  return {
    id: doc.id,
    name: doc.name,
    age: doc.age + 10, // fix value
    created_at: doc.created_at // convert key name
  }
})
// convert after fetch from firestore
const decode = (doc: {id: string, [prop: string]: any}): User => {
  return {
    id: doc.id,
    name: doc.name,
    age: doc.age - 10, // fix value
    createdAt: doc.created_at // convert key name
  }
})
const dao = new FirestoreSimple<User>({firestore, path: 'users', encode, decode})

// doc or collection reference
// decodeを活用してやってほしい。自動でネストを展開してしまうとネストが深いときによきせずメモリ食う可能性があるのであまり積極的にサポートしたくない

// sub collection
// 難しそう。docの要素とは別枠扱いなので、コンストラクタでネストさせればできそう？
const dao = new FirestoreSimple<User>({firestore, path: 'users', subcollection: {
  books: new FirestoreSimple<Book>({firestore, path: 'users/${id}/books'})
}})
dao
  .find(1) // user
  .find(2) // book

// on

// class
// extendsでクラスとして作る方法。dixie.jsを参考にしたい



```

# License
MIT

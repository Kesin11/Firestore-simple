# [7.0.0-1](https://github.com/Kesin11/Firestore-simple/compare/v7.0.0-6...v7.0.0-1) (2020-03-30)



## [6.0.1](https://github.com/Kesin11/Firestore-simple/compare/v5.0.1...v6.0.1) (2020-03-05)
* chore(test): Skip flaky tests [#122](https://github.com/Kesin11/Firestore-simple/pull/122)


# [6.0.0](https://github.com/Kesin11/Firestore-simple/compare/v5.0.1...v6.0.0) (2020-03-05)

### BREAKING CHANGES
* Rename module name 'FirestoreSimple' to 'FirestoreSimpleAdmin'([3c6fafe](https://github.com/Kesin11/Firestore-simple/commit/3c6fafea580992402b248dd6a6bf53fbc294754e))

Exported class name `FirestoreSimple` was **DEPRECATED**. Please use `FirestoreSimpleAdmin` instead.
You can still import `FirestoreSimple`, but it will be removed in future versoin.

If you use firestore-simple before v6.0.0, migrate your code like this.

```ts
// old
import { FirestoreSimple } from 'firestore-simple'

// new
import { FirestoreSimpleAdmin } from 'firestore-simple'
```


## [5.0.1](https://github.com/Kesin11/Firestore-simple/compare/v5.0.0...v5.0.1) (2019-12-28)

v5.0.0 was failed to release. So v5.0.1 is just republishing to npm.

# [5.0.0](https://github.com/Kesin11/Firestore-simple/compare/v4.0.1...v5.0.0) (2019-12-28)

### BREAKING CHANGES

* Bugfix 'update' accept generic type S([ed3258e](https://github.com/Kesin11/Firestore-simple/commit/ed3258e8728d54c2324a8ed9be558ce3e544a406))
* Remove fetchByQuery ([b3ae47a](https://github.com/Kesin11/Firestore-simple/commit/b3ae47a9638d699cc0e822402dab8a94c34f796b))

### Bug Fixes

* throw error when nesting batch or bulkSet/bulkDelete ([a7e2b74](https://github.com/Kesin11/Firestore-simple/commit/a7e2b74aeec7cb1058bbfb0cd0f9e36bbffb2c97))


### Features

* Add bulkAdd() ([dc50489](https://github.com/Kesin11/Firestore-simple/commit/dc50489dbe51c31f694979f441662c4668cc0010))
* Add collectionGroup() ([bd11452](https://github.com/Kesin11/Firestore-simple/commit/bd11452ccbba62b0294e0c7f0f72e1c398a685b9))
* Add runBatch() and tests ([760e8ae](https://github.com/Kesin11/Firestore-simple/commit/760e8aefb2d8d85561f914df6efc7ec5bee5a7a0))


## v4.0.1 2019/11/5
https://github.com/Kesin11/Firestore-simple/compare/v4.0.0..v4.0.1

- **Braking changes**
  - Nothing
- [#36](https://github.com/Kesin11/Firestore-simple/pull/36) Refactoring _encode, _decode
- [#42](https://github.com/Kesin11/Firestore-simple/pull/42) tslint to eslint
- [#61](https://github.com/Kesin11/Firestore-simple/pull/61) Add retry for flaky callback tests
- [#63](https://github.com/Kesin11/Firestore-simple/pull/63) Change CI TravisCI to Github Actions
- Update some dependencies by Renovate

## v4.0.0 2019/06/26
https://github.com/Kesin11/Firestore-simple/compare/v3.1.0..v4.0.0

- **Braking changes**
  - Fix FirestoreSimple.collection generics type arguments
    - `FirestoreSimple.collection<T>` to `FirestoreSimple.collection<T, S>`
    - For this changes, improve property name completion and restriction in most methods
  - Remove deprecated methods `fetchDocument` and `fetchCollection`
- [#23](https://github.com/Kesin11/Firestore-simple/pull/23) Improve generic typing
  - `encode()` argument can now assign `Firestore.FieldValue` type.
- [#25](https://github.com/Kesin11/Firestore-simple/pull/25) Remove deprecated methods
- [#27](https://github.com/Kesin11/Firestore-simple/pull/27) Support firestore 'update'
- Bump some dependencies by Renovate

## v3.1.0 2019/05/25
https://github.com/Kesin11/Firestore-simple/compare/v3.0.0..v3.1.0

- [#17](https://github.com/Kesin11/Firestore-simple/pull/17) Support add() inside runTransaction(). This is firestore-simple original feature.
- [#19](https://github.com/Kesin11/Firestore-simple/pull/19) Support pagination method: startAt, startAfter, endAt, endBefore
- Bump some dependencies

## v3.0.0 2019/05/13
https://github.com/Kesin11/Firestore-simple/compare/v2.0.1..v3.0.0

- **Change almost API.**
- **Unsupport sub class way introduced from v2.0.1**
- **Unsupport ReactNative firebase**
- **`add()` and `set()` will return only document id**
- Support transaction.
- Add `collectionFactory` for subcollection.
- Rewrite all test code using jest.
- Rewrite all example code with v3.

## v2.0.1 2018/12/03
- More TypeScript friendly using generic typing.
- Add `encode` and `decode` for convert object when before post and after fetch.
- Support subclass based way.
- Support `onSnapshot` partially.

## v1.0.1 2018/06/01
- First stable release

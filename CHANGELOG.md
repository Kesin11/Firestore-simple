# [5.0.0](https://github.com/Kesin11/Firestore-simple/compare/v4.0.1...v5.0.0) (2019-12-28)


### Bug Fixes

* throw error when nesting batch or bulkSet/bulkDelete ([a7e2b74](https://github.com/Kesin11/Firestore-simple/commit/a7e2b74aeec7cb1058bbfb0cd0f9e36bbffb2c97))


### Features

* Add bulkAdd() ([dc50489](https://github.com/Kesin11/Firestore-simple/commit/dc50489dbe51c31f694979f441662c4668cc0010))
* Add collectionGroup() ([bd11452](https://github.com/Kesin11/Firestore-simple/commit/bd11452ccbba62b0294e0c7f0f72e1c398a685b9))
* Add runBatch() and tests ([760e8ae](https://github.com/Kesin11/Firestore-simple/commit/760e8aefb2d8d85561f914df6efc7ec5bee5a7a0))


### Performance Improvements

* Add FirestoreSimpleConverter and refactoring for prepare implementing collectionGroup ([b3ae47a](https://github.com/Kesin11/Firestore-simple/commit/b3ae47a9638d699cc0e822402dab8a94c34f796b))
* Change runTransaction/runBatch args type and refactoring ([46c04c6](https://github.com/Kesin11/Firestore-simple/commit/46c04c6edb1d26c4fac300e1db43dc15825e8084))


### Reverts

* Revert "chore: Temporary remove renovate eslint schedule" ([048fb51](https://github.com/Kesin11/Firestore-simple/commit/048fb51ed27c8a00cd4a79de54b702730dd287cb))



# The revision history of Firestore-simple

The versioning follows [Semantic Versioning](http://semver.org/):

> Given a version number MAJOR.MINOR.PATCH, increment the:
>
> 1. MAJOR version when you make incompatible API changes,
> 2. MINOR version when you add functionality in a backwards-compatible manner, and
> 3. PATCH version when you make backwards-compatible bug fixes.

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
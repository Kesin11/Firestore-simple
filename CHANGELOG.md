# The revision history of Firestore-simple

The versioning follows [Semantic Versioning](http://semver.org/):

> Given a version number MAJOR.MINOR.PATCH, increment the:
>
> 1. MAJOR version when you make incompatible API changes,
> 2. MINOR version when you add functionality in a backwards-compatible manner, and
> 3. PATCH version when you make backwards-compatible bug fixes.

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
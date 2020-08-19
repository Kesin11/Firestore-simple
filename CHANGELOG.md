# [](https://github.com/Kesin11/Firestore-simple/compare/v7.0.1...v) (2020-08-19)


### Bug Fixes

* **admin:** Change firebase-admin dependency type 'dependencies' to 'peerDependencies' ([f01fe22](https://github.com/Kesin11/Firestore-simple/commit/f01fe22e6e96950e63fa548dd0d5d41ed1cad025))
* **web:** Change firebase dependency type 'dependencies' to 'peerDependencies' ([d4e72e3](https://github.com/Kesin11/Firestore-simple/commit/d4e72e377c3e271e93782aaba22962fca00c3254))



# [7.0.1](https://github.com/Kesin11/Firestore-simple/compare/v7.0.0...v7.0.1) (2020-06-14)


### Bug Fixes

* **admin:** Bugfix batch methods execute unexpected commit when throw some error ([154663f](https://github.com/Kesin11/Firestore-simple/commit/154663f93a1f39b26d0c198fc875ea6b5f408396))
* **admin:** Bugfix runTransaction() execute unexpected commit when throw some error ([0f72ae9](https://github.com/Kesin11/Firestore-simple/commit/0f72ae900c4323200f7ec0bd76bbfd92c145e1f7))
* **web:** Bugfix batch methods execute unexpected commit when throw some error ([c643b5c](https://github.com/Kesin11/Firestore-simple/commit/c643b5c7ce5085de2ee33d5fc41198575d2d3b06))
* **web:** Bugfix runTransaction() execute unexpected commit when throw some error ([edb4f3d](https://github.com/Kesin11/Firestore-simple/commit/edb4f3dfb7ca6d47e13aa174b3e9ecd95485b575))



# [7.0.0](https://github.com/Kesin11/Firestore-simple/compare/v6.0.1...v7.0.0) (2020-03-30)
### BREAKING CHANGES
* Change to monorepo and introduce `@firestore-simple/admin` and `@firestore-simple/web` ([#132](https://github.com/Kesin11/Firestore-simple/pull/132))

:warning: Previous [firestore-simple](https://www.npmjs.com/package/firestore-simple) is **DEPRECATED!**

`firestore-simple` is moved to [`@firestore-simple/admin`](https://www.npmjs.com/package/@firestore-simple/admin) and [`@firestore-simple/web`](https://www.npmjs.com/package/@firestore-simple/web). Please use these packages insted of `firestore-simple`.

If you are using firestore-simple before v7.0.0 with admin SDK, migrate your code like this.

```ts
// old
import { FirestoreSimple } from 'firestore-simple'

// new
import { FirestoreSimple } from '@firestore-simple/admin'
```

### New feature
:tada: Introduce new `@firestore-simple/web` for web SDK.  
`@firestore-simple/web` has almost same API as `@firestore-simple/admin`. So you can use same code with `@firestore-simple/web` for web SDK.

### Features

- feat: monorepo [#132](https://github.com/Kesin11/Firestore-simple/pull/132)
- Fix class name more simply. [#141](https://github.com/Kesin11/Firestore-simple/pull/141)
- Fix export from index.ts [#142](https://github.com/Kesin11/Firestore-simple/pull/142)


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

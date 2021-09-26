# `@firestore-simple/admin`

FirestoreSimple for admin SDK

# :city_sunset: @firestore-simple/admin and @firestore-simple/web are ARCHIVED
Thank you for using `@firestore-simple/admin` and `@firestore-simple/web` to date. Unfortunately, I decided to end maintaining `@firestore-simple/admin` and `@firestore-simple/web`, so these do not support the new Firebase SDK v9.  
If you want to find another TypeScript friendly Firestore package, [Firebase Open Source](https://firebaseopensource.com/) will be helpful.

## Install
```
npm i @firestore-simple/admin
```

## Usage
See [README](https://github.com/Kesin11/Firestore-simple).

Also [example](./example) or [tests](./__tests__) are good sample.

## CHANGELOG
See [CHANGELOG](../../CHANGELOG) or [Releases](https://github.com/Kesin11/Firestore-simple/releases)

## Test
Unit tests are using [Firestore local emulator](https://firebase.google.com/docs/emulator-suite).

So if you want to run unit test in your local machine, start emulator in background before run test.

```bash
# setup monorepo
npm ci
npm run bootstrap

cd packages/admin

npm run emulators:start
npm run test
```

# License
MIT

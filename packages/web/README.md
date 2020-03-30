# `@firestore-simple/web`

FirestoreSimple for web SDK

## Install
```
npm i @firestore-simple/web
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

cd packages/web

npm run emulators:start
npm run test
```

# License
MIT

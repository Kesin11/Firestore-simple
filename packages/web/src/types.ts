import firebase from 'firebase/app'
import { Omit, Optional } from 'utility-types'

export type HasId = { id: string }
export type HasIdObject = { id: string, [key: string]: any }
// Accpet original type and Firestore.FieldValue without 'id' property
export type Storable<T> = { [P in keyof T]: P extends 'id' ? T[P] : T[P] | firebase.firestore.FieldValue }
// Storable but only 'id' is optional
export type OptionalIdStorable<T extends HasId> = Optional<Storable<T>, 'id'>
// Storable but all keys exclude 'id' are optional
export type PartialStorable<T extends HasId> = Partial<Storable<T>> & HasId

type HasSameKeyObject<T> = { [P in keyof T]: any }
export type QueryKey<T> = { [K in keyof T]: K }[keyof T] | firebase.firestore.FieldPath
// Convert 'id' property to optional type
export type OmitId<T> = Omit<T, 'id'>
export type Encodable<T extends HasId, S = firebase.firestore.DocumentData> = (obj: OptionalIdStorable<T>) => Storable<S>
export type Decodable<T extends HasId, S = HasIdObject> = (doc: HasSameKeyObject<S> & HasId) => T

// Export Firestore firebase.firestore
export import Firestore = firebase.firestore.Firestore
export import DocumentReference = firebase.firestore.DocumentReference
export import CollectionReference = firebase.firestore.CollectionReference
export import DocumentSnapshot = firebase.firestore.DocumentSnapshot
export import QuerySnapshot = firebase.firestore.QuerySnapshot
export import Transaction = firebase.firestore.Transaction
export import WriteBatch = firebase.firestore.WriteBatch
export import Query = firebase.firestore.Query
export import WhereFilterOp = firebase.firestore.WhereFilterOp
export import FieldPath = firebase.firestore.FieldPath
export import OrderByDirection = firebase.firestore.OrderByDirection
export import FieldValue = firebase.firestore.FieldValue

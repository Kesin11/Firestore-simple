import type { firestore } from 'firebase'
import { Omit, Optional } from 'utility-types'

export type HasId = { id: string }
export type HasIdObject = { id: string, [key: string]: any }
// Accpet original type and Firestore.FieldValue without 'id' property
export type Storable<T> = { [P in keyof T]: P extends 'id' ? T[P] : T[P] | firestore.FieldValue }
// Storable but only 'id' is optional
export type OptionalIdStorable<T extends HasId> = Optional<Storable<T>, 'id'>
// Storable but all keys exclude 'id' are optional
export type PartialStorable<T extends HasId> = Partial<Storable<T>> & HasId

type HasSameKeyObject<T> = { [P in keyof T]: any }
export type QueryKey<T> = { [K in keyof T]: K }[keyof T] | firestore.FieldPath
// Convert 'id' property to optional type
export type OmitId<T> = Omit<T, 'id'>
export type Encodable<T extends HasId, S = firestore.DocumentData> = (obj: OptionalIdStorable<T>) => Storable<S>
export type Decodable<T extends HasId, S = HasIdObject> = (doc: HasSameKeyObject<S> & HasId) => T

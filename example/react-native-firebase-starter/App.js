import React from 'react';
import { StyleSheet, Platform, Image, Text, View, ScrollView } from 'react-native';
import { FirestoreSimple } from 'firestore-simple'

import firebase from 'react-native-firebase';

export default class App extends React.Component {
  constructor() {
    super();
    this.state = {
      // firebase things?
    };
  }

  async componentDidMount() {
    const firestore = await this.getFirestore()
    console.log('firebase get firestore')
    const collectionPath = 'sample_react_native'
    const dao = new FirestoreSimple(firestore, collectionPath, {
      mapping: {
        createdAt: 'created_at'
      }
    })

    const existsDoc = {
      title: 'title',
      url: 'http://example.com',
      createdAt: 1
    }

    let doc = await dao.add(existsDoc)
    console.log('add', doc)

    doc = await dao.fetchDocument(doc.id)
    console.log('fetchDocument', doc)

    doc.title = 'fixed_title'
    doc = await dao.set(doc)
    console.log('set', doc)

    const deletedDocId = await dao.delete(doc.id)
    console.log('delete', deletedDocId)

    const bulkSetBatch = await dao.bulkSet([
      {
        id: '1',
        order: 2,
        title: 'bulk_set1'
      },
      {
        id: '2',
        order: 1,
        title: 'bulk_set2'
      }
    ])
    console.log('bulkSet', bulkSetBatch)

    const fetchedDocs = await dao.fetchCollection()
    console.log('fetchCollectoin', fetchedDocs)

    const query = dao.collectionRef
      .where('title', '==', 'bulk_set1')
      .orderBy('order')
      .limit(1)
    const queryFetchedDocs = await dao.fetchByQuery(query)
    console.log('fetchByQuery', queryFetchedDocs)

    const deletedDocBatch = await dao.bulkDelete(fetchedDocs.map((doc) => doc.id))
    console.log('bulkDelete', deletedDocBatch)
  }

  async getFirestore() {
    console.log('firebase auth')
    await firebase.auth().signInAnonymouslyAndRetrieveData()
    console.log('will firebase.firestore')
    return firebase.firestore()
  }

  render() {
    return (
      <ScrollView>
        <View style={styles.container}>
        <Image source={require('./assets/RNFirebase.png')} style={[styles.logo]} />
        <Text style={styles.welcome}>
          Welcome to the React Native{'\n'}Firebase starter project!
        </Text>
        <Text style={styles.instructions}>
          To get started, edit App.js
        </Text>
        {Platform.OS === 'ios' ? (
          <Text style={styles.instructions}>
            Press Cmd+R to reload,{'\n'}
            Cmd+D or shake for dev menu
          </Text>
        ) : (
          <Text style={styles.instructions}>
            Double tap R on your keyboard to reload,{'\n'}
            Cmd+M or shake for dev menu
          </Text>
        )}
        <View style={styles.modules}>
          <Text style={styles.modulesHeader}>The following Firebase modules are enabled:</Text>
          {firebase.admob.nativeModuleExists && <Text style={styles.module}>Admob</Text>}
          {firebase.analytics.nativeModuleExists && <Text style={styles.module}>Analytics</Text>}
          {firebase.auth.nativeModuleExists && <Text style={styles.module}>Authentication</Text>}
          {firebase.crashlytics.nativeModuleExists && <Text style={styles.module}>Crashlytics</Text>}
          {firebase.firestore.nativeModuleExists && <Text style={styles.module}>Cloud Firestore</Text>}
          {firebase.messaging.nativeModuleExists && <Text style={styles.module}>Cloud Messaging</Text>}
          {firebase.links.nativeModuleExists && <Text style={styles.module}>Dynamic Links</Text>}
          {firebase.iid.nativeModuleExists && <Text style={styles.module}>Instance ID</Text>}
          {firebase.notifications.nativeModuleExists && <Text style={styles.module}>Notifications</Text>}
          {firebase.perf.nativeModuleExists && <Text style={styles.module}>Performance Monitoring</Text>}
          {firebase.database.nativeModuleExists && <Text style={styles.module}>Realtime Database</Text>}
          {firebase.config.nativeModuleExists && <Text style={styles.module}>Remote Config</Text>}
          {firebase.storage.nativeModuleExists && <Text style={styles.module}>Storage</Text>}
        </View>
        </View>    
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  logo: {
    height: 80,
    marginBottom: 16,
    marginTop: 32,
    width: 80,
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
  modules: {
    margin: 20,
  },
  modulesHeader: {
    fontSize: 16,
    marginBottom: 8,
  },
  module: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  }
});

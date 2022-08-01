const admin = require('firebase-admin');
const serviceAccount = require('../../../data/avolar-app-firebase.json');

class FirestoreDB {
    constructor () {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        this.db = admin.firestore();
        console.log('FirestoreDB initialized');
    }

    async get (collection, id) {
        const docRef = this.db.collection(collection).doc(id);
        const doc = await docRef.get();
        return doc.data();
    }

    async getAll (collection) {
        const docRef = this.db.collection(collection);
        const docs = await docRef.get();
        return docs.docs.map(doc => doc.data());
    }

    async getAllByField (collection, field, value) {
        const docRef = this.db.collection(collection).where(field, '==', value);
        const docs = await docRef.get();
        return docs.docs.map(doc => doc.data());
    }

    async getAllByFields (collection, fields) {
        const docRef = this.db.collection(collection);
        const docs = await docRef.get();
        return docs.docs.map(doc => doc.data());
    }

    async create (collection, data) {
        const docRef = this.db.collection(collection).add(data);
        return docRef.id;
    }

    async createDocument (collection, id, data) {
        const docRef = this.db.collection(collection).doc(id);
        await docRef.set(data);
    }

    async update (collection, id, data) {
        const docRef = this.db.collection(collection).doc(id);
        await docRef.update(data);
    }

    async delete (collection, id) {
        const docRef = this.db.collection(collection).doc(id);
        await docRef.delete();
    }

    async deleteAll (collection) {
        const docRef = this.db.collection(collection);
        await docRef.get().then(snapshot => {
            snapshot.forEach(doc => {
                doc.ref.delete();
            });
        });
    }

    async addField (collection, id, field, value) {
        const docRef = this.db.collection(collection).doc(id);
        await docRef.update({
            [field]: value
        });
    }
}

module.exports = new FirestoreDB();

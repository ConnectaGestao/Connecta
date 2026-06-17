// Inicializa o Firebase compatível com SDK anterior (v8 compat)
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Ativa a persistência offline agressiva (Otimização Extrema)
db.enablePersistence({ synchronizeTabs: true })
  .catch(function(err) {
      if (err.code == 'failed-precondition') {
          console.warn("Múltiplas abas abertas, persistência ativada apenas na primeira.");
      } else if (err.code == 'unimplemented') {
          console.warn("O navegador não suporta persistência offline do Firebase.");
      }
  });

// Coloca globais para api.js
window.db = db;
window.auth = firebase.auth();
window.storage = firebase.storage();
window.collection = (db, name) => db.collection(name);
window.getDocs = async (ref) => await ref.get();
window.getDoc = async (ref) => await ref.get();
window.doc = (dbOrColl, ...paths) => {
    if (typeof dbOrColl.doc === 'function' && paths.length === 0) return dbOrColl.doc();
    if (typeof dbOrColl.doc === 'function' && paths.length === 1) return dbOrColl.doc(paths[0]);
    if (paths.length === 2) return dbOrColl.collection(paths[0]).doc(paths[1]);
    return dbOrColl; // Simplificado
};
window.addDoc = async (coll, data) => await coll.add(data);
window.setDoc = async (docRef, data) => await docRef.set(data);
window.updateDoc = async (docRef, data) => await docRef.update(data);
window.deleteDoc = async (docRef) => await docRef.delete();
window.query = (coll, ...clauses) => {
    let q = coll;
    clauses.forEach(c => {
        if (c.type === 'where') q = q.where(c.field, c.op, c.value);
        if (c.type === 'orderBy') q = q.orderBy(c.field, c.dir);
        if (c.type === 'limit') q = q.limit(c.limit);
    });
    return q;
};
window.where = (field, op, value) => ({type: 'where', field, op, value});
window.orderBy = (field, dir='asc') => ({type: 'orderBy', field, dir});
window.limit = (n) => ({type: 'limit', limit: n});
window.writeBatch = (db) => db.batch();

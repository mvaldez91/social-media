const functions = require('firebase-functions');
const {db} = require('./util/admin');
require('dotenv').config();

const {getAllScreams, postOneScream,getScream,
    commentOnScream, likeOnScream, unlikeScream,
    deleteScream, COLLECTIONS} = require('./handlers/screams');
const {userSignUp, login, uploadImage,
       addUserDetails,getAuthenticatedUser,
       getUserDetails, markNotificationRead} = require('./handlers/users');
const {FBAuth} = require('./util/FBAuth');

const app = require('express')();

//screams routes
app.get('/scream', FBAuth, getAllScreams);
app.get('/scream/:screamId', FBAuth, getScream);
app.post('/scream', FBAuth, postOneScream );
app.post('/scream/:screamId/comment', FBAuth, commentOnScream);
app.get('/scream/:screamId/like', FBAuth, likeOnScream);
app.get('/scream/:screamId/unlike', FBAuth, unlikeScream);
app.delete('/scream/:screamId', deleteScream);

//Signup route
app.post('/signup', userSignUp);
app.post('/login', login);

app.post('/user/image', FBAuth, uploadImage);
app.post('/user', FBAuth, addUserDetails);
app.get('/user', FBAuth, getAuthenticatedUser);
app.get('/user/:handle', getUserDetails);
app.post('/notifications', FBAuth, markNotificationRead);


exports.api = functions.region('us-central1').https.onRequest(app);
exports.createNotificationsOnLike = functions.region('us-central1').firestore.document('likes/{id}')
.onCreate((async snapshot => {
    try {
        let doc = await db.doc(`${COLLECTIONS.SCREAMS}/${snapshot.data().screamId}`).get();
        if (!doc.exists || doc.data().userHandle === snapshot.data().userHandle){
            return true;
        }
        await db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            type: 'like',
            read: false,
            screamId: doc.id
        });
    }
    catch(err){
        console.error(err);
    }
}));

exports.createNotificationsOnComment = functions.region('us-central1').firestore.document('comments/{id}')
    .onCreate((async snapshot => {
        try {
            let doc = await db.doc(`${COLLECTIONS.SCREAMS}/${snapshot.data().screamId}`).get();
            if (!doc.exists || doc.data().userHandle === snapshot.data().userHandle){
                return true;
            }
            await db.doc(`/notifications/${snapshot.id}`).set({
                createdAt: new Date().toISOString(),
                recipient: doc.data().userHandle,
                sender: snapshot.data().userHandle,
                type: 'like',
                read: false,
                screamId: doc.id
            });
        }
        catch(err){
            console.error(err);
        }
    }));

exports.deleteNotificationsOnUnLike = functions.region('us-central1').firestore.document('likes/{id}')
    .onDelete((async snapshot => {
        try {
            await db.doc(`/notifications/${snapshot.id}`).delete();
        }
        catch(err){
            console.error(err);
        }
    }));

exports.onUserImageChange = functions.region('us-central1').firestore.document('users/{userId}')
    .onUpdate(async (change)=>{
        console.log(change.before.data());
        console.log(change.after.data());
        if (change.before.data().imageUrl === change.after.data().imageUrl){
            return true;
        }
        try{
            let batch = db.batch();
            const screams= await db.collection(COLLECTIONS.SCREAMS).where('userHandle', '==', change.before.data().handle).get();
            screams.forEach(doc=>{
                const scream = db.doc(`${COLLECTIONS.SCREAMS}/${doc.id}`);
                batch.update(scream, {userImage: change.after.data().imageUrl});
            });
            return batch.commit();
        }catch(err){
            console.error(err);
        }
    });

exports.onScreamDelete = functions.region('us-central1').firestore.document('screams/{screamId}')
.onDelete( async (snapshot,context)=>{
   const screamId = context.params.screamId;
   const batch = db.batch();
    try{
        const commentsCollection = await db.collection(COLLECTIONS.COMMENTS).where('screamId', '==', screamId).get();
        const likesCollection = await db.collection(COLLECTIONS.LIKES).where('screamId', '==', screamId).get();
        const notificationsCollection = await db.collection(COLLECTIONS.NOTIFICATIONS).where('screamId', '==', screamId).get();

        const addToBatchForDelete = (collectionName, collection)=>{
            collection.forEach(doc=>{
                batch.delete(db.doc(`/${collectionName}/${doc.id}`));
            })
        };
        addToBatchForDelete(COLLECTIONS.COMMENTS, commentsCollection);
        addToBatchForDelete(COLLECTIONS.LIKES, likesCollection);
        addToBatchForDelete(COLLECTIONS.NOTIFICATIONS, notificationsCollection);
        return batch.commit();
    }catch(err){
        console.error(err);
    }
});
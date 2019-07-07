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
app.post('/notifications', FBAuth, getUserDetails);


exports.api = functions.region('us-central1').https.onRequest(app);
exports.createNotificationsOnLike = functions.region('us-central1').firestore.document('likes/{id}')
.onCreate((async snapshot => {
    try {
        let doc = await db.doc(`${COLLECTIONS.SCREAMS}/${snapshot.data().screamId}`).get();
        if (!doc.exists){
            return;
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
        return;
    }
}));

exports.createNotificationsOnComment = functions.region('us-central1').firestore.document('comments/{id}')
    .onCreate((async snapshot => {
        try {
            let doc = await db.doc(`${COLLECTIONS.SCREAMS}/${snapshot.data().screamId}`).get();
            if (!doc.exists){
                return;
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
            return;
        }
    }));

exports.deleteNotificationsOnUnLike = functions.region('us-central1').firestore.document('likes/{id}')
    .onDelete((async snapshot => {
        try {
            await db.doc(`/notifications/${snapshot.id}`).delete();
        }
        catch(err){
            console.error(err);
            return;
        }
    }));
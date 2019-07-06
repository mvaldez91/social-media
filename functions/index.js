const functions = require('firebase-functions');
require('dotenv').config();

const {getAllScreams, postOneScream,getScream, commentOnScream, likeOnScream,unlikeScream, deleteScream} = require('./handlers/screams');
const {userSignUp, login, uploadImage, addUserDetails,getAuthenticatedUser} = require('./handlers/users');
const {FBAuth} = require('./util/FBAuth');

const app = require('express')();

//screams routes
app.get('/scream', FBAuth, getAllScreams);
app.get('/scream/:screamId', FBAuth, getScream);
app.post('/scream',postOneScream );
app.post('/scream/:screamId/comment', FBAuth, commentOnScream);
app.get('/scream/:screamId/like', FBAuth, likeOnScream);
app.get('/scream/:screamId/unlike', FBAuth, unlikeScream);
app.delete('/scream/:screamId', FBAuth, deleteScream);


//Signup route
app.post('/signup', userSignUp);
app.post('/login', login);

app.post('/user/image', FBAuth, uploadImage);
app.post('/user', FBAuth, addUserDetails);
app.get('/user', FBAuth, getAuthenticatedUser);


exports.api = functions.https.onRequest(app);
const LANGUAGE = 'EN';
const functions = require('firebase-functions');
const MSGS = require('./messages')[LANGUAGE];

require('dotenv').config();

const {getAllScreams, postOneScream,getScream, commentOnScream} = require('./handlers/screams');
const {userSignUp, login, uploadImage, addUserDetails,getAuthenticatedUser} = require('./handlers/users');
const {FBAuth} = require('./util/FBAuth');

const routes = {
    SCREAM: 'scream',
    SIGNUP: 'signup',
    LOGIN: 'login',
    USER: 'user',
    COMMENT: 'comment'
};

const subRoutes = {
    IMAGE: 'image',

};

const app = require('express')();

//screams routes
app.get(`/${routes.SCREAM}`, FBAuth, getAllScreams);
app.get(`/${routes.SCREAM}/:screamId`, FBAuth, getScream);
app.post(`/${routes.SCREAM}`,postOneScream );
app.post(`/${routes.SCREAM}/:screamId/${routes.COMMENT}`, FBAuth, commentOnScream);

//Signup route
app.post(`/${routes.SIGNUP}`, userSignUp);
app.post(`/${routes.LOGIN}`, login);
app.post(`/${routes.USER}/${subRoutes.IMAGE}`, FBAuth, uploadImage);
app.post(`/${routes.USER}`, FBAuth, addUserDetails);
app.get(`/${routes.USER}`, FBAuth, getAuthenticatedUser);


exports.api = functions.https.onRequest(app);
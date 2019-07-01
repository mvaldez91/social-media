const functions = require('firebase-functions');
const admin= require('firebase-admin');

admin.initializeApp();

const firebaseConfig = {
    apiKey: "AIzaSyCDP8ssUCEzcnqkuwdz-hTsfnl9nro0fAM",
    authDomain: "react-social-network-2e7aa.firebaseapp.com",
    databaseURL: "https://react-social-network-2e7aa.firebaseio.com",
    projectId: "react-social-network-2e7aa",
    storageBucket: "react-social-network-2e7aa.appspot.com",
    messagingSenderId: "1081548697622",
    appId: "1:1081548697622:web:74d850e8b7888520"
};

const express = require('express');
const app = express();

const firebase = require('firebase');
firebase.initializeApp(firebaseConfig );

const db = admin.firestore();

app.get('/screams', (req,res)=>{
    db.collection('screams')
        .orderBy('createdAt', 'desc')
        .get()
        .then((r)=>{
            let screams= [];
            r.forEach((doc)=>{
                screams.push(doc.data());
            });
            return res.json(screams);
        })
        .catch(err=>{
            console.error(err);
        })
});

app.post('/scream',(req,res)=>{
    const newScream = {
        body: req.body.body,
        userHandle: req.body.userHandle,
        createdAt: new Date().toISOString()
    }
    db
        .collection('screams')
        .add(newScream)
        .then(doc=>{
            res.json({message: `document ${doc.id} created successfully!`});
        })
        .catch(err=>{
            console.error(err);
            res.status(500).json({error: 'something went wrong!'});
        })
});

// https;//baseurl.com/api/

//Signup route
app.post('/signup', (req,res)=>{
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle,
    };
    let userId = '';
    let tokenRetrieved = '';
    db.doc(`/users/${newUser.handle}`).get()

        .then((doc)=>{
           if(doc.exists){
               return res.status(400).json({handle: 'This handle is already taken'});
           }
           else{
               return firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password);
           }
        }).then((data=>{
            userId = data.user.uid;
            return data.user.getIdToken()
    }))
        .then(token=>{
            tokenRetrieved = token;
            const userCredentials = {
                handle: newUser.handle,
                email: newUser.email,
                createdAt: new Date().toISOString(),
                userId
            };
           return db.doc(`/users/${newUser.handle}`).set(userCredentials);
        })
        .then(()=>{
            return res.status(201).json({token: tokenRetrieved})
        })
        .catch((err)=>{
            console.error(err);
            if (err.code === 'auth/email-already-in-use'){
                return res.status(400).json({email: 'Email already in use'});
            }
            else{
                return res.status(500).json({error: err.code});
            }

        });

});

exports.api = functions.https.onRequest(app);
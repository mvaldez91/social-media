const {CONFIG,LANG} = require('../util/config');
const MESSAGES = require('../messages')[LANG];
const {validateSignupData,validateLoginData} = require('../util/validators');

const firebase = require('firebase');
firebase.initializeApp(CONFIG);
const {db,admin}  = require('../util/admin');
const {isEmpty} = require('../util/validators');

const COLLECTIONS = {
    USERS: 'users',
    LIKES: 'likes',
    COMMENTS: 'comments',
    NOTIFICATIONS: 'notifications',
    SCREAMS: 'screams'
};

exports.userSignUp = async (req,res)=>{
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle,
    };
    const {valid, errors} = validateSignupData(newUser);
    let firebaseUserResult, tokenResult;
    if (!valid){
        return res.status(400).json(errors);
    }
    let userId = '';

    try{
        let docUser =await db.doc(`/${COLLECTIONS.USERS}/${newUser.handle}`).get();
        if (docUser.exists){
            return res.status(400).json({handle: MESSAGES.user.handle_taken});
        }
        firebaseUserResult = await firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password);
        userId = firebaseUserResult.user.uid;
        tokenResult = await firebaseUserResult.user.getIdToken();
        const userCredentials = {
            handle: newUser.handle,
            email: newUser.email,
            createdAt: new Date().toISOString(),
            imageUrl: 'https://firebasestorage.googleapis.com/v0/b/react-social-network-2e7aa.appspot.com/o/no_image.jpg?alt=media',
            userId
        };
        await db.doc(`/${COLLECTIONS.USERS}/${newUser.handle}`).set(userCredentials);
        return res.status(201).json({token: tokenResult});
    }
    catch(err){
        console.error(err);
        if (err.code === 'auth/email-already-in-use'){
            return res.status(400).json({email: MESSAGES.user.email_has_used});
        }
        else{
            return res.status(500).json({error: err.code});
        }
    }
};

exports.login = async (req,res)=>{
    const user = {
        email: req.body.email,
        password: req.body.password
    };
    const {valid, errors} = validateLoginData(user);
    let firebaseAuthResult;
    let tokenResult;

    if (!valid){
        return res.status(400).json(errors);
    }
    try {
        firebaseAuthResult = await firebase.auth().signInWithEmailAndPassword(user.email,user.password);
        tokenResult = await firebaseAuthResult.user.getIdToken();
        return res.json({token: tokenResult});
    } catch(err){
        console.error(err);
        if (err.code === 'auth/wrong-password'){
            return res.status(403).json({general: MESSAGES.auth.wrong_credentials});
        }
        else{
            return res.status(500).json({error: err.code});
        }
    }
};

exports.addUserDetails =(req, res)=>{
    let userDetails = reduceUserDetails(req.body);
    db.doc(`/${COLLECTIONS.USERS}/${req.user.handle}`)
        .update(userDetails)
        .then(()=>{
            return res.json({message: MESSAGES.user.details_updated})
        })
        .catch((err)=>{
            console.error(err);
            return res.status(500).json({error: err.code});
        })
};

exports.getAuthenticatedUser = async (req,res)=>{
    let userData = {};

    try {
        let userDoc = await db.doc(`${COLLECTIONS.USERS}/${req.user.handle}`).get();
        let likesCollection, notificationsCollection;

        if (!userDoc.exists){
            return;
        }
        userData.credentials = userDoc.data();
        likesCollection = await db.collection(`${COLLECTIONS.LIKES}`).where('userHandle', '==', req.user.handle).get();
        
        userData.likes = [];
        likesCollection.forEach(doc=>{
            userData.likes.push(doc.data());
        });
        notificationsCollection = await db.collection(`${COLLECTIONS.NOTIFICATIONS}`).where('recipient', '==', req.user.handle).orderBy('createdAt', 'desc').limit(10).get();
        userData.notifications = [];
        let element = {};
        notificationsCollection.forEach(doc=>{
            element = doc.data();
            element.notificationId = doc.id;
            userData.notifications.push(element);
        });
        return res.json(userData);

    } catch(err){
        console.error(err);
        return res.status(500).json({error: err.code})
    }
};

exports.uploadImage = (req,res)=>{

  const BusBoy = require('busboy');
  const path = require('path');
  const os = require('os');
  const fs = require('fs');

  const busboy = new BusBoy({headers: req.headers});
  let imageFileName;
  let imageToBeUploaded = {};

  busboy.on('file',(fieldname, file, fileName, encoding, mimetype)=>{
      if (mimetype !== 'image/jpeg' && mimetype !=='image/png'){
          return res.status(400).json({error: MESSAGES.user.wrong_file_type});
      }
     const imageExtension =fileName.split('.')[fileName.split('.').length - 1];
     imageFileName = `${Math.round(Math.random() * 10000000)}.${imageExtension}`;
     const filePath = path.join(os.tmpdir(), imageFileName);
     imageToBeUploaded = {filePath, mimetype};
     file.pipe(fs.createWriteStream(filePath));
  });
  busboy.on('error', (err)=>{
      console.error('Busboy error', err);
  });

  busboy.on('finish',()=>{
      admin.storage().bucket().upload(imageToBeUploaded.filePath,{
         resumable: false,
         metadata: {
             contentType: imageToBeUploaded.mimetype
         }
      })
      .then(()=>{
        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${CONFIG.storageBucket}/o/${imageFileName}?alt=media`;
        return db.doc(`/${COLLECTIONS.USERS}/${req.user.handle}`).update({imageUrl});
      }).then(()=>{
          return res.json({message: MESSAGES.user.image_uploaded});
      }).catch((err)=>{
          console.error(err);
          return res.status(500).json({error: err.code});
      });
  });
    busboy.end(req.rawBody)
};

exports.getUserDetails = async (req,res)=>{
    let userData= {};
    try {
        let userDoc = await db.doc(`/${COLLECTIONS.USERS}/${req.params.handle}`).get();
        let userScreams ;
        if (!userDoc.exists){
            return res.status(400).json({error: MESSAGES.user.not_found});
        }
        userData.user = userDoc.data();
        userScreams = await db.collection(COLLECTIONS.SCREAMS).where('userHandle', '==', req.params.handle).orderBy('createdAt', 'desc').get();
        userData.screams = [];
        let docElement = {};
        userScreams.forEach(doc=>{
            docElement = doc.data();
            docElement.screamId = doc.id;
            userData.screams.push(docElement);
        });
        return res.json(userData);

    }catch(err){
        console.error(err);
        return res.status(500).json({error: err.code});
    }
};

exports.markNotificationRead =  async (req,res)=>{
    try{
        let batch = db.batch();
        req.body.forEach(notificationId =>{
            const notification = db.doc(`/${COLLECTIONS.NOTIFICATIONS}/${notificationId}`);
            batch.update(notification, {read: true});
        });
        await batch.commit();
        return res.json({message: MESSAGES.notifications.marked_as_read})
    }catch(err){
        console.error(err);
        return res.status(500).json({error: err.code});
    }
};

const reduceUserDetails = (data)=>{
    let userDetails = {};
    console.log('Reduce user', data);
    if (!isEmpty(data.bio)){
        userDetails.bio = data.bio.trim();
    }
    if (!isEmpty(data.website)){
        userDetails.website = data.website.trim();
    }
    userDetails.location = !isEmpty(data.location) ? data.location : '';
    return userDetails;
};

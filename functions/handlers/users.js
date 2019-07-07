
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

exports.userSignUp =(req,res)=>{
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle,
    };
    const {valid, errors} = validateSignupData(newUser);
    if (!valid){
        return res.status(400).json(errors);
    }
    let userId = '';
    let tokenRetrieved = '';

    db.doc(`/${COLLECTIONS.USERS}/${newUser.handle}`).get()
        .then((doc)=>{
            if(doc.exists){
                return res.status(400).json({handle: MESSAGES.user.handle_taken});
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
                imageUrl: 'https://firebasestorage.googleapis.com/v0/b/react-social-network-2e7aa.appspot.com/o/no_image.jpg?alt=media',
                userId
            };
            return db.doc(`/${COLLECTIONS.USERS}/${newUser.handle}`).set(userCredentials);
        })
        .then(()=>{
            return res.status(201).json({token: tokenRetrieved})
        })
        .catch((err)=>{
            console.error(err);
            if (err.code === 'auth/email-already-in-use'){
                return res.status(400).json({email: MESSAGES.user.email_has_used});
            }
            else{
                return res.status(500).json({error: err.code});
            }
        });

};

exports.login = (req,res)=>{
    const user = {
        email: req.body.email,
        password: req.body.password
    };

    const {valid, errors} = validateLoginData(user);
    if (!valid){
        return res.status(400).json(errors);
    }
    firebase.auth().signInWithEmailAndPassword(user.email,user.password)
        .then((data)=>{
            console.log(data);
            return data.user.getIdToken();
        })
        .then(token=>{
            return res.json({token})
        })
        .catch((err)=>{
            console.log(err);
            if (err.code === 'auth/wrong-password'){
                return res.status(403).json({general: 'Wrong credentials, please try again'});
            }
            else{
                return res.status(500).json({error: err.code});
            }
        })
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
        console.log(likesCollection);
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
      console.log('File reading', filePath);
     imageToBeUploaded = {filePath, mimetype};
     file.pipe(fs.createWriteStream(filePath));
  });
  busboy.on('error', (err)=>{
      console.error('Busboy error', err);
  })

  busboy.on('finish',()=>{
      console.log('Done parsing form!');
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
        if (userDoc.exists){
            userData.user = userDoc.data();
        }
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

const reduceUserDetails = (data)=>{
    let userDetails = {};
    if (!isEmpty(data.bio.trim())){
        userDetails.bio = data.bio;
    }
    if (!isEmpty(data.website.trim())){
        userDetails.website = data.website.trim();
    }
    userDetails.location = !isEmpty(data.location.trim()) ? data.location : '';
    return userDetails;
};

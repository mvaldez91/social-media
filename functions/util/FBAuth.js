const {LANG} = require('../util/config');
const MESSAGES = require('../messages')[LANG];
const {db,admin} = require('./admin');

exports.FBAuth = (req,res,next)=>{
    let idToken;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')){
        idToken = req.headers.authorization.split('Bearer ')[1];

    }else{
        console.error(MESSAGES.auth.no_token);
        return res.status(403).json({error: MESSAGES.auth.not_authorized});
    }
    admin.auth().verifyIdToken(idToken)
        .then(decodedToken=>{
            req.user = decodedToken;
            console.log(decodedToken);
            return db.collection('users')
                .where('userId', '==', req.user.uid)
                .limit(1)
                .get()
        })
        .then((data)=>{
            console.log(data.docs[0].data());
            req.user.handle = data.docs[0].data().handle;
            req.user.imageUrl = data.docs[0].data().imageUrl;
            return next();
        })
        .catch(err=>{
            console.error(MESSAGES.auth.error_token, err);
            res.status(500).json({error: err.code});
        })
};
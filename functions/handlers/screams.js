const {db} =  require('../util/admin');
const {LANG} = require('../util/config');
const MESSAGES = require('../messages')[LANG];

const COLLECTIONS = {
    SCREAMS: 'screams',
    COMMENTS: 'comments',
    LIKES: 'likes'
};
exports.getAllScreams = async (req,res)=>{

    try {
        const screamsDocs = await db.collection(COLLECTIONS.SCREAMS).orderBy('createdAt', 'desc').get();
        const preparedData = [];
        screamsDocs.forEach(doc=>{
            preparedData.push(doc.data());
        })
        // const preparedData = Object.keys(screamsDocs).map((elementId)=>{
        //     return screamsDocs[elementId].data();
        // });
        return res.json(preparedData);
    } catch(err){
        console.error(err);
        res.status(500).json({error: MESSAGES.generic.server_error});
    }
};

exports.postOneScream = async (req,res)=>{
    const newScream = {
        body: req.body.body,
        userHandle: req.user.handle,
        createdAt: new Date().toISOString(),
        likeCount: 0,
        commentCount: 0
    };
    try {
        let doc = await db.collection(COLLECTIONS.SCREAMS).add(newScream);
        newScream.screamId = doc.id;
        res.json(newScream);
    }
    catch(err){
        console.error(err);
        res.status(500).json({error: MESSAGES.generic.server_error});
    }
};

exports.getScream = (req,res)=>{
    let screamData = {};
    db.doc(`/${COLLECTIONS.SCREAMS}/${req.params.screamId}`)
        .get()
        .then((doc)=>{
            if (!doc.exists){
                return res.status(404).json({error: MESSAGES.scream.not_found})
            }
            screamData = doc.data();
            screamData.screamId = doc.id;
            return db
                .collection(COLLECTIONS.COMMENTS)
                .orderBy('createdAt', 'desc')
                .where('screamId', '==', req.params.screamId)
                .get();
        })
        .then(data=>{
            screamData.comments = [];
            data.forEach(doc=>{
                screamData.comments.push(doc.data());
            });
            return res.json(screamData);
        })
        .catch(err=>{
            console.error(err);
            res.status(500).json({error: err.code});
        });
};

exports.commentOnScream = async (req,res)=>{
  if (req.body.body.trim()=== ''){
      return res.status(400).json({error: MESSAGES.general.empty_field});
  }
  const newComment = {
    body: req.body.body,
    createdAt: new Date().toISOString(),
      screamId: req.params.screamId,
      userHandle: req.user.handle,
      userImage: req.user.imageUrl
  };

  try {
      let doc = await db.doc(`${COLLECTIONS.SCREAMS}/${req.params.screamId}`).get();
      if (!doc.exists){
          return res.status(404).json({error: MESSAGES.scream.not_found})
      }
      await db.doc(`${COLLECTIONS.SCREAMS}/${req.params.screamId}`).ref.update({commentCount: doc.data().commentCount + 1})
      await db.collection(`${COLLECTIONS.COMMENTS}`).add(newComment);
      res.json(newComment);
  }
  catch(err){
    console.error(err);
      res.status(500).json({error: err.code});
  }
};

exports.likeOnScream = async (req,res)=>{

    try {
        const screamDocument = await db.doc(`/${COLLECTIONS.SCREAMS}/${req.params.screamId}`).get();
        let screamData;

        if (!screamDocument.exists){
            return res.status(404).json({error: MESSAGES.scream.not_found})
        }
        const likeDocument =
            await db.collection(COLLECTIONS.LIKES)
                .where('userHandle', '==', req.user.handle)
                .where('screamId', '==', req.params.screamId).limit(1).get();

        screamData = screamDocument.data();
        screamData.screamId = screamDocument.id;

        if (!likeDocument.empty){
            return res.status(400).json({error: MESSAGES.scream.already_liked});
        }
        await db.collection(`${COLLECTIONS.LIKES}`).add(
            {   screamId: screamData.screamId,
                userHandle: req.user.handle
            });

        screamData.likeCount ++;
        await db.doc(`${COLLECTIONS.SCREAMS}/${req.params.screamId}`).update({likeCount: screamData.likeCount});
        return res.json(screamData);
    }

    catch(err){
        console.error(err);
        return res.status(500).json({error: err.code});
    }

};

exports.unlikeScream = async (req,res)=>{
    try {
        const screamDocument = await db.doc(`/${COLLECTIONS.SCREAMS}/${req.params.screamId}`).get();
        let screamData;

        if (!screamDocument.exists){
            return res.status(404).json({error: MESSAGES.scream.not_found})
        }
        const likeDocument =
            await db.collection(COLLECTIONS.LIKES)
                .where('userHandle', '==', req.user.handle)
                .where('screamId', '==', req.params.screamId).limit(1).get();

        screamData = screamDocument.data();
        screamData.screamId = screamDocument.id;
        console.log(likeDocument);
        if (likeDocument.empty){
            return res.status(400).json({error: MESSAGES.scream.already_liked});
        }
        await db.doc(`/${COLLECTIONS.LIKES}/${likeDocument.docs[0].id}`).delete();

        screamData.likeCount --;
        await db.doc(`${COLLECTIONS.SCREAMS}/${req.params.screamId}`).update({likeCount: screamData.likeCount});
        return res.json(screamData);
    }

    catch(err){
        console.error(err);
        return res.status(500).json({error: err.code});
    }
};

exports.deleteScream = async (req,res)=>{
    const document = db.doc(`/${COLLECTIONS.SCREAMS}/${req.params.screamId}`);
    try {
        const docResult = await document.get();
        if (!docResult.exists){
            return res.status(404).json({error: MESSAGES.scream.not_found});
        }
        if (docResult.data().userHandle !== req.user.handle){
            return res.status(403).json({error: MESSAGES.auth.not_authorized});
        }
        await document.delete();
        return res.json({message: 'Scream deleted successfully'});
    }
    catch(err){
        console.error(err);
        return res.status(500).json({error: err.code});
    }
};
const {db} =  require('../util/admin');
const {LANG} = require('../util/config');
const MSGS = require('../messages')[LANG];

const COLLECTIONS = {
    SCREAMS: 'screams',
    COMMENTS: 'comments'
};
exports.getAllScreams = (req,res)=>{

    db.collection(COLLECTIONS.SCREAMS)
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
            res.status(500).json({error: err.code })
        });
};

exports.postOneScream = (req,res)=>{
    const newScream = {
        body: req.body.body,
        userHandle: req.user.handle,
        createdAt: new Date().toISOString()
    };
    db.collection(COLLECTIONS.SCREAMS)
      .add(newScream)
      .then(doc=>{
            res.json({message: `document ${doc.id} created successfully!`});
        })
        .catch(err=>{
            console.error(err);
            res.status(500).json({error: MSGS.generic.server_error});
        })
};

exports.getScream = (req,res)=>{
    let screamData = {};
    db.doc(`/${COLLECTIONS.SCREAMS}/${req.params.screamId}`)
        .get()
        .then((doc)=>{
            if (!doc.exists){
                return res.status(404).json({error: MSGS.scream.not_found})
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
      return res.status(400).json({error: MSGS.general.empty_field});
  }
  const newComment = {
    body: req.body.body,
    createdAt: new Date().toISOString(),
      screamId: req.params.screamId,
      userHandle: req.user.handle,
      userImage: req.user.imageUrl
  };

  console.log(newComment);
  try {
      let doc = await db.doc(`${COLLECTIONS.SCREAMS}/${req.params.screamId}`).get();
      if (!doc.exists){
          return res.status(404).json({error: MSGS.scream.not_found})
      }
      await db.collection(`${COLLECTIONS.COMMENTS}`).add(newComment);
      res.json(newComment);
  }
  catch(err){
    console.error(err);
      res.status(500).json({error: err.code});
  }


};
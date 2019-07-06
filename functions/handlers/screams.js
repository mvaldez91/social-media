const {db,admin} =  require('../util/admin');
const {LANG} = require('../util/config');
const MSGS = require('../messages')[LANG];

const COLLECTION = 'screams';
exports.getAllScreams = (req,res)=>{

    db.collection(COLLECTION)
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
        })
};

exports.postOneScream = (req,res)=>{
    const newScream = {
        body: req.body.body,
        userHandle: req.user.handle,
        createdAt: new Date().toISOString()
    };
    db.collection(COLLECTION)
      .add(newScream)
      .then(doc=>{
            res.json({message: `document ${doc.id} created successfully!`});
        })
        .catch(err=>{
            console.error(err);
            res.status(500).json({error: MSGS.generic.server_error});
        })
};
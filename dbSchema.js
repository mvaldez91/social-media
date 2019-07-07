let db = {
    screams: [
        {
            userHandle: 'user',
            body: 'This is the screen body',
            createdAt: 'YYYY-MM-DDTHH:MM:SS',
            likeCount: 5,
            commentCount: 2,
            userImage : ''
        }
    ],
    comments: [
        {
            userHandle: 'user',
            screamId: 'sdfiasdj',
            body: 'nice one mate',
            createdAt: '2019-03-15T10:59:52.798Z'
        }
    ]
};

const userDetails = {
    credentials: {
        userId: "",
        email: '',
        handle: '',
        createdAt: '',
        imageUrl:'',
        bio: '',
        website:'',
        location: ''
    },
    likes:[
        {
            userHandle: 'user',
            screamId: ''
        },
        {
            userHandle: 'user',
            screamId: ''
        }
    ]

};
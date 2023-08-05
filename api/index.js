const express = require('express');
const cors = require('cors');
const { default: mongoose } = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Place = require('./models/Place');
const Booking = require('./models/Booking.js');
const cookieParser = require('cookie-parser');
const imageDownloader = require('image-downloader');
const path = require('path');
const multer = require('multer');
const fs=require('fs');

require('dotenv').config()

const bcryptSalt = bcrypt.genSaltSync(10);
const jwtSecret = 'Rajatasdfghjklzxcvbnmqwertyuiop';

const app=express();

// app.use(cors({
//     origin: 'http://localhost:5173',
//     credentials: true,
//   }));

app.use(cookieParser());
app.use(express.json());
app.use('/uploads', express.static(__dirname+'/uploads'));

mongoose.connect(process.env.MONGO_URL);


function getUserDataFromReq(req) {
    return new Promise((resolve, reject) => {
      jwt.verify(req.cookies.token, jwtSecret, {}, async (err, userData) => {
        if (err) throw err;
        resolve(userData);
      });
    });
}


app.get('/test', (req, res) => {
    res.json('test ok');
});



app.post('/register', async (req, res) => {
    
    const {name, email, password} =req.body;


    try{
        const UserDoc = await User.create({
            name, 
            email, 
            password:bcrypt.hashSync(password, bcryptSalt),
        });
        res.json(UserDoc);
    } catch(e){
        res.status(422).json(e);
    }
});

app.post('/login', async (req, res) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.header('Access-Control-Allow-Credentials', true);

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
        const userDoc = await User.findOne({ email });
        if (!userDoc) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const passOk = bcrypt.compareSync(password, userDoc.password);

        if (!passOk) {
            return res.status(401).json({ error: 'Incorrect password.' });
        }

        jwt.sign({ email: userDoc.email, id: userDoc._id }, jwtSecret, {}, (err, token) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to generate token.' });
            }
            res.cookie('token', token).json({ name: userDoc.name, email: userDoc.email, _id: userDoc._id });
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred during login.' });
    }
});


app.get('/profile', (req, res) => {
    const {token} = req.cookies;
    if(token){
        jwt.verify(token, jwtSecret, {}, async (err, userData) => {
            if(err) throw err;
            const {name, email, _id} = await User.findById(userData.id); 
            res.json({name, email, _id});
        });
    }
    else{
        res.json(null);
    }
});

app.post('/logout', (req, res) =>{
    res.cookie('token', '').json(true);
});

app.post('/upload-by-link', async (req, res) =>{
    const {link} = req.body;
    try{
        const newName = 'photo' + Date.now() + '.jpg';
        const destPath = path.join(__dirname, 'uploads', newName);
        await imageDownloader.image({
            url: link,
            dest: destPath,
        });
        res.json(newName);
    } catch (error) {
        console.error('Error', error);
        res.status(500).json({error: 'Failed to download the image'});
    }
}); 

const photosMiddleware = multer({dest:'uploads'});
app.post('/upload',photosMiddleware.array('photos', 100), (req, res) =>{
    const uploadedFiles = [];
    for(let i=0;i<req.files.length; i++){
        const {path, originalname}= req.files[i];
        const parts = originalname.split('.');
        const ext=parts[parts.length-1];
        const newPath =path + '.' +ext;
        fs.renameSync(path, newPath);
        uploadedFiles.push(newPath.replace('uploads\\', ''));
    }
    res.json(uploadedFiles);
});


app.post('/places', (req, res) =>{
    const {token} = req.cookies;
    const {
        title,address,addedPhotos,description,
        perks,extraInfo,checkIn,checkOut,maxGuests, price,
      } = req.body; 
    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
        if(err) throw err;
        const placeDoc= await Place.create({
            owner: userData.id, price, 
            title,address,photos:addedPhotos,description,
            perks,extraInfo,checkIn,checkOut,maxGuests,
        });
        res.json(placeDoc);
    });
    
});


app.get('/user-places', (req, res) =>{
    const {token} = req.cookies;
    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
        const {id}= userData;
        res.json(await Place.find({owner: id}));
    });
});

app.get('/places/:id', async (req, res) =>{
    const {id} = req.params;
    res.json(await Place.findById(id));
});

app.put('/places', async (req,res) => {
    mongoose.connect(process.env.MONGO_URL);
    const {token} = req.cookies;
    const {
      id, title,address,addedPhotos,description,
      perks,extraInfo,checkIn,checkOut,maxGuests, price,
    } = req.body;
    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
      if (err) throw err;
      const placeDoc = await Place.findById(id);
      if (userData.id === placeDoc.owner.toString()) {
        placeDoc.set({
          title,address,photos:addedPhotos,description,
          perks,extraInfo,checkIn,checkOut,maxGuests, price,
        });
        await placeDoc.save();
        res.json('ok');
      }
    });
});

app.get('/places', async (req, res) =>{
    res.json(await Place.find());
});

app.post('/bookings', async (req, res) => {
    const userData = await getUserDataFromReq(req);
    const {
        place,checkIn,checkOut,numberOfGuests,name,phone,price,
    } = req.body;
    Booking.create({
        place,checkIn,checkOut,numberOfGuests,name,phone,price,
        user:userData.id,
    }).then((doc) => {
        res.json(doc);
    }).catch((err) => {
        throw err;
    });
});

app.get('/bookings', async (req,res) => {
    mongoose.connect(process.env.MONGO_URL);
    const userData = await getUserDataFromReq(req);
    res.json( await Booking.find({user:userData.id}).populate('place') );
});

app.use(express.static(path.join(__dirname,"../client/dist")));

app.get("*",(req,res)=>{
    res.sendFile(path.resolve(__dirname,"../client/dist/index.html"));
});

app.listen(4000);

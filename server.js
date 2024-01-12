const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const multer = require('multer');
const bodyparser = require('body-parser');
const cors = require('cors');
const path = require('path');
const connectDB = require('./server/database/connection');

const app = express();

dotenv.config()
const PORT = process.env.PORT || 8080

app.use(express.json());

app.use(cors());

app.use(morgan('tiny'));

// mongodb connection
connectDB();

// parse request to body-parser
app.use(bodyparser.urlencoded({extended:true}));

// Define the storage strategy for file uploads
const storage = multer.memoryStorage();

// Initialize multer with the storage strategy
const upload = multer({storage : storage})

app.use("/avatars", express.static(path.resolve(__dirname,"avatars")));

app.use('/',require('./server/routes/router'));

app.listen(PORT, () =>{
    console.log(`app is running on port http://localhost:${PORT}`)
})

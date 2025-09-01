require('dotenv').config()
const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const mongoose = require('mongoose');
const router = require('./router/index')
const errorMiddleware = require('./middlewares/error-middleware')

const PORT = process.env.PORT || 5000
const app = express()

app.use(express.json())
app.use(cookieParser())
app.use(cors({
    credentials: true,
    origin: ['http://localhost:3000', 'http://localhost:3001',  'http://localhost:5000'], // конкретные домены
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use('/api', router); 
app.use(errorMiddleware); 

const start = async () => {
    try {

        await mongoose.connect(process.env.DB_URL, {
            useNewUrlParser: true, 
            useUnifiedTopology: true
        })
        app.listen(5000, () => {
            console.log(`Server started on PORT = ${PORT} `)
        })
    }catch(e){
        console.log(e)
    }
}


start()
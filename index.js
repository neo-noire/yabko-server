const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const checkout = require('./api/checkout')



const PORT = process.env.PORT || 8080;

app.use(express.static("public"))
app.use(express.json())
app.use(cors({
    credentials: true,
    preflightContinue: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    origin: true
}))
app.options('*', cors())
app.use(express.urlencoded({ extended: true }))
app.use('/api/checkout', checkout)

app.listen(PORT, () => {
    console.log(`Server running at Port: ${PORT}...`);
})




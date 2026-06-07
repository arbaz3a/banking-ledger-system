require('dotenv').config()
const app = require('./src/app')
const connectToDB = require("./src/config/db")

connectToDB()


app.listen(process.env.PORT || 3000, ()=>{
    console.log(`server is running on ${process.env.PORT || 3000}`)
})
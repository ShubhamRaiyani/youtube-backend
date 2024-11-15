// require('dotenv').config({path: './env'}) //but it breaks consistency
import dotenv from "dotenv"


import connectDB from "./db/index.js";

dotenv.config({path : './env'})



connectDB()   // we are doing try-catch as the connectdb(async -await) return promise
.then(() => {
    app.listen( process.env.PORT || 8000 ,() => {
        `Express Server si running at ${process.env.PORT}`
    })
    app.on("error" , (error) =>{
        console.log("ERRR : " ,error);
        throw error
    })
})
.catch((err) => {
    console.log("MongoDB Connection Failed ERROR :" ,err);
})


 







/* this is one of the approach to connect DB in index .js

import mongoose from "mongoose";
import { DB_NAME } from "./constant"

import express from "express"
const app = express()
;( async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", (error) => {
            console.log("Error: ",error);
            throw error
        })
        app.listen(process.env.PORT, ()=>{
            console.log(`App is running on port ${process.env.PORT}`)
        })

    } catch (error) {
        console.error("ERROR: ",error)
        throw error
    }
} )()
*/

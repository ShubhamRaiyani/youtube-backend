// require('dotenv').config({path: './env'}) //but it breaks consistency
import dotenv from "dotenv"


import connectDB from "./db/index.js";

dotenv.config({path : './env'})



connectDB()


 







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

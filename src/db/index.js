import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(` MongoDB connect !! DB HOST : ${connectionInstance.connection.host}`) // must try it console.log instance
    } catch (error) {
        console.log("MONGODB Connection failed ERROR:",error);
        process.exit(1) // an application run on process and we are referencing he process here for exiting the app with exitcode

    }
}

export default connectDB
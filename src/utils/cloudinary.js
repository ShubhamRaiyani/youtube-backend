import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";
// import {ApiResponse} from "./ApiResponse.js";
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
});

const uploadOnCloudinary = async (localFilePath) =>{
    try {
        if (!localFilePath) return null;
        //upload on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type: 'auto',
        })
        //file uploaded
        // console.log("File uploaded and response : ",response.url)
        fs.unlinkSync(localFilePath);
        console.log("Cloudinary upload response: ", response);
        return response; // contains url and public_id
    } catch (error) {
        fs.unlink(localFilePath, (err) => {
            if (err) console.error(`Failed to delete local file: ${err.message}`);
        }); // remove locally save temporary file as upload got failed
        return error;
    }
}
const deleteFromCloudinary = async (publicId) => {
    try {
        if (!publicId) {
            console.log("publicId is required to delete file from cloudinary")
            return { error: "publicId is missing" };
        }
        const response = await cloudinary.uploader.destroy(publicId)

        console.log("File deleted and response : ", response)
        return response
    } catch (error) {
        return error;
    }
}
 export {uploadOnCloudinary,deleteFromCloudinary}
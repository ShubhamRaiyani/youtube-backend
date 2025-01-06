import {asynchandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/apierror.js";
import jwt from "jsonwebtoken";
import {User} from "../models/user.model.js";


export const verifyJWT = asynchandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "").trim();
         // getting token from req from browser)
        if (!token) {
            throw new ApiError(401,"Unautorized access")
        }// checking if token is present or not 

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)//verifing the token with real one
        // and byt his decode token we will ge the _Id from jwt signation done before in 
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")// finding _id from jwt 
        if (!user) {
            throw new ApiError(401,"Invalid access token")
        }
    
        req.user = user;
        //ading element in req object user which could be access in logoutuser to get user._i
        next();

    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid access token")
    }
})

import {asynchandler } from "../utils/asynchandler.js";
import {ApiError} from "../utils/apierror.js";
import {User} from "../models/user.model.js";
import { uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"

const registerUser = asynchandler( async (req,res) => {
    

    const { fullName, email, username , password} =req.body
    
    if (
        [fullName, email, username , password].some((feild)=>
            feild?.trim() === "")
    ){
        throw new ApiError(400,"All feilds are required")
    }
    
    const existedUser = User.findOne({
        $or :[{email},{username}]
    })

    if (existedUser){
        throw new ApiError(409 ,"User with this email aor username already exists" )
    }

    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path

    if (!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    
    if (!avatar){
        throw new ApiError(400,"Avatar file is required")
    }

    await User.create({
        fullName,
        avatar: avatar.url,
        coverImage :coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById( user._id).select( "-password -refreshToken" )

    if(!createdUser){
        throw new ApiError(500,"Something wen wrong while registring user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser,"User registered successfully")
    )
})


export {registerUser}
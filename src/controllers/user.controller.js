import {asynchandler } from "../utils/asynchandler.js";
import {ApiError} from "../utils/apierror.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js";

const generateAccessAndRefreshToken  = async(userId)=> 
    {
    try{
        const user = await User.findById(userid)
        const accesstoken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshtoken = refreshtoken;
        await user.save({validateBeforeSave: false})

        return {accesstoken, refreshtoken}
    }catch (error){
        throw new ApiError(500,"Something went wrong while generating refresh and ccess token ")
    }
}

const registerUser = asynchandler( async (req,res) => {
    

    const { fullName, email, username , password} =req.body
    console.log( "Req.Body ",req.body)
    if (
        [fullName, email, username , password].some((field)=>
            field?.trim() === "")
    ){
        throw new ApiError(400,"All feilds are required")
    }
    
    const existedUser = await User.findOne({
        $or :[{email},{username}]
    })

    if (existedUser){
        throw new ApiError(409 ,"User with this email aor username already exists" )
    }

    console.log("req.files" , req.files)
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    
    if (!avatar){
        throw new ApiError(400,"Avatar file is required")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage :coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id ).select( "-password -refreshToken" )

    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registring user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser,"User registered successfully")
    )
})

const loginUser  = asynchandler(async(req,res) => {
    //req.body -> data
    //email or  //username
    //find the user if there
    //password check 
    //accesstoken and refresh
    //send cookies
    const { email, username, password,} = req.body;
    if (!username && !email){
        throw new ApiError(400,"Username or email is required")
    }
    const user = await User.findOne({
        $or:[{username},{email}]
    })

    if(!user){
        throw new ApiError(404,"User not exist")
    }
    
    const isPasswordValid = await user.isPasswordCorrect(passowrd)

    if(!isPasswordValid){
        throw new ApiError(401,"Invalid user credentials")
    }
    
    const { accesstoken, refreshToken } = await generateAccessAndRefreshToken(user._id)
    // trying 
    // cosnt loggedUser = user.select("-password -refreshtoken")
    const loggedInUser = await User.findById(user._id).select("-password -refreshtoken")
    
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refrehToken", refreshToken, options)
        .json(
            new ApiResponse(200,
                { user: loggedInUser, accessToken, refrehToken },
                "User logged in Successfully"
            )
        )


})

const logoutUser = asynchandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{refrehToken: undefined}
        },
        {
            new: true
        }
    )
    
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearcookie("accessToken", options)
        .clearcookie("refreshToken", options)
        .json(new ApiResponse(200, "User Logged out successfully"))
    
})

export {
    registerUser,
    loginUser,
    logoutUser
}
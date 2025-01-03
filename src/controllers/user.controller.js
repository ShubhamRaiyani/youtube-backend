import { asynchandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/apierror.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary, deleteFromCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose, { mongo } from "mongoose";

const generateAccessAndRefreshTokens  = async(userId)=> 
    {
    try{
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false })
        return {accessToken, refreshToken}
    }catch (error){
        throw new ApiError(500,"Something went wrong while generating refresh and access token ")
    }
}

const registerUser = asynchandler( async (req,res) => {
    

    const { fullName, email, username , password} =req.body
    console.log( "Req.Body ",req.body)
    if (
        [fullName, email, username , password].some((field)=>
            field?.trim() === "")
    ){
        throw new ApiError(400,"All fields are required")
    }
    
    const existedUser = await User.findOne({
        $or :[{email},{username}]
    })

    if (existedUser){
        throw new ApiError(409 ,"User with this email or username already exists" )
    }

    console.log("req.files" , req.files)
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    let coverImageLocalPath;

    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }
    

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    console.log(avatar,coverImage)
    if (!avatar){
        throw new ApiError(400,"Avatar file is required")
    }

    const user = await User.create({
        fullName,
        avatar: {
                    url: avatar?.url,
                    public_id: avatar.public_id
                },
        coverImage :{
                    url: avatar?.url,
                    public_id: avatar.public_id
                } ,
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

const loginUser  = asynchandler( async(req,res) => {
    //req.body -> data
    //email or  //username
    //find the user if there
    //password check 
    //accesstoken and refresh
    //send cookies
    const { email, username, password, } = req.body;
    console.log(req.body)
    if (!username && !email){
        throw new ApiError(400,"Username or email is required")
    }
    const user = await User.findOne({
        $or:[{username},{email}]
    })

    if(!user){
        throw new ApiError(404,"User not exist")
    }
    
    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401,"Invalid user credentials")
    }
    
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)
    // trying
    // cosnt loggedUser = user.select("-password -refreshtoken")
    console.log(accessToken)
    console.log(refreshToken)
    
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200,
                // { user: loggedInUser, accessToken, refreshToken },
                "User logged in Successfully"
            )
        )


})

const logoutUser = asynchandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{refreshToken: undefined}
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
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, "User Logged out successfully"))
    
})

const refreshAccessToken = asynchandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken 
    console.log("incoming",incomingRefreshToken)
    if (!incomingRefreshToken){
        throw new ApiError(401, "Refresh token is required")
    }

    try {
        
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        // verifying if refreshtoken and return the decoded payload
        console.log(decodedToken)
        
        const user = await User.findById(decodedToken._id) // find user from the payload , database fetch
        console.log("user : ",user);
        if (!user) {
            throw new ApiError(401, "Invalid refresh token not matched")
        }
    
        if (user.refreshToken !== incomingRefreshToken) { // check if the refresh token is same as the one in the database
            throw new ApiError(401, "Refresh token is expired or used ")
        }
        
        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)
        //generate new access and refresh token
        const options = {
            httpOnly: true,
            secure: true
        }
    
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(new ApiResponse(200, {accessToken, refreshToken}, "Access token refreshed successfully"))
    } catch (error) {
        throw new ApiError(401, "Invalid refresh token zll")
        
    }
    

})

const changeCurrentPassword = asynchandler(async (req, res) => {
    const { oldpassword, newpassword } = req.body;

    const user = await User.findById(req.user._id); //database fetch 
    const isPasswordCorrect = await user.isPasswordCorrect(oldpassword)
    
    if(!isPasswordCorrect){
        throw new ApiError(401, "Invalid old password")
    }
    
    user.password = newpassword; // update the password as we are hashing before saving
    await user.save({ validateBeforeSave: false })
    // we use validateBeforeSave: false because we are not updating all the fields
    // and we dont want to validate all the fields 
    //  as we are sure that we have validated or checked , the password
    
    return res
        .status(200)
        .json(new ApiResponse(200, "Password changed successfully"))
})

const getCurrentUser = asynchandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "User found successfully"))
})

const updateAccountDetails = asynchandler(async (req, res) => {

    const { fullName, email } = req.body;
    
    
    if(!fullName || !email){
        throw new ApiError(400, "Fullname and email are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: { // $set is used to update the fields 
                fullName,
                email :email
            },
            
        },
        {
            new: true // return the updated details 
        }
    ).select("-password -refreshToken")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "User details updated successfully"))
    

})

const updateUserAvatar = asynchandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    // Storing old avatar details
    const oldAvatar = req.user.avatar.public_id;

    // Upload new avatar to Cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading avatar");
    }

    // Update user's avatar in the database
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                avatar: {
                    url: avatar.url,
                    public_id: avatar.public_id
                }
            }
        },
        {
            new: true
        }
    ).select("-password -refreshToken");

    // Optionally, delete the old avatar from Cloudinary if needed
    if (oldAvatar) {
        await deleteFromCloudinary(oldAvatar.public_id);
    }

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Avatar updated successfully"));
})

const updateUserCoverImage = asynchandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;
    if (!coverImageLocalPath){
        throw new ApiError(400, "Cover Image file is required")
    }
    const oldCoverImage = req.user.coverImage;
    
    console.log("oldCoverImage", oldCoverImage)
    console.log("Extracted public_id:", oldCoverImage?.public_id);

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if (!coverImage.url){
        throw new ApiError(400, "Error while uploading cover image")
    }
    console.log("cI from clodinary", coverImage)
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                coverImage: {
                    url: coverImage.url,
                    public_id: coverImage.public_id
                }
            }
        },
        {
            new: true
        }
    ).select("-password -refreshToken")

    
    // Add DELETE LOCAL OLD FILE UTIL
    if (oldCoverImage?.public_id) {
        console.log("public_id", oldCoverImage.public_id)
        await deleteFromCloudinary(oldCoverImage.public_id);
    }


    return res
        .status(200)
        .json(new ApiResponse(200, user, "Cover Image updated successfully"))
})

const getUserChannelProfile = asynchandler(async (req, res) => {
    const { username } = req.params;
    if (!username?.trim()) {
        throw new ApiError(400, "USername is required");
    }
    // getting username from the params

    const channel = await User.aggregate([
        {
            $match: { // match the username from the params
                username:username?.toLowerCase()
            }
        },
        {
            $lookup: { // lookup the subscriptions from the user
                from: "subscritpions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {  // lookup the subscriptions to the user
                from: "subscritpions",
                localField: "_id",
                foreignField: "subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields: {  // add fields to the response
                subscriberCount: { $size: $subscribers },
                subscribedToCount: { $size: $subscribedTo },
                isSubscribed: {
                    if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                    then: true,
                    else: false
                }
            }
        },
        {
            $project: {  // project the fields to the response
                fullName: 1,
                username: 1,
                avatar: 1,
                coverImage: 1,
                subscriberCount: 1,
                subscribedToCount: 1,
                isSubscribed: 1,
                email: 1,
                createdAt: 1
            }
        }
    ])
    console.log(channel);

    if(!channel?.length){
        throw new ApiError(404, "Channel does not exist")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, channel[0], "Channel is fetched successfully"))
    
});

const getWatchhistory = asynchandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipline: [
                    {
                        $lookup: {
                            from: "Users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        avatar: 1,
                                        username: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: { $arrayElemAt: ["$owner", 0] }
                        }
                    }
                ]
            }
        }
    ])

    return res
        .status(200)
        .json(200, user[0].watchHistory, "Watch history fetched successfully")
        
})
export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchhistory
}
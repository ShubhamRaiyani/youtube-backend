import { Video } from "../models/video.model.js";
import { asynchandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/apierror.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";

// upload = multer upload object from middleware file

// update video details by id
// PUT /api/videos/:id
// title and description are required

// delete video by id
// DELETE /api/videos/:id

// get all videos of a user  // it will need mongoose populate /aggregate
// GET /api/videos
// query params: page, limit (default 10) and sort (default -createdAt)

// get video by id // it will need mongoose populate /aggregate / select / projection / lean / exec / find / findById 
 // videofile,cloudinaryId,thumbnail,title,description,durations,views,isPublished,owner,likesCount
const uploadVideo = asynchandler(async (req, res) => {
    const { title, description } = req.body;
    if (!title) {
        throw new ApiError(400, "Title is required");
    }

    const videoLocalPath = req.files?.video?.[0]?.path;  // from multer to localpath 
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail file is required");
    }

    if (!videoLocalPath) {
        throw new ApiError(400, "Video file is required");
    }

    const thumbnailFromCloudinary = await uploadOnCloudinary(thumbnailLocalPath);
    const videoFromCloudinary = await uploadOnCloudinary(videoLocalPath);
    console.log("thumbnail metadata", thumbnailFromCloudinary);
    console.log("cloudinaty metadata", videoFromCloudinary);

    const video = await Video.create({
        title: title,
        description: description,
        thumbnail: thumbnailFromCloudinary.url,
        videofile: videoFromCloudinary.url,
        cloudinaryId: videoFromCloudinary.public_id,
        user: req.user._id,
        isPublished: true,
        duration: Math.floor(videoFromCloudinary.duration), // check if minutes are correct
        owner: req.user._id
    })

    // const uploadedVideo = await video.save();
    
    res
        .status(200)
    .json(new ApiResponse(200, "Video uploaded successfully", video));


});

const updateVideoDetais = asynchandler(async (req, res) => {
    const videoId = req.params.id;
    const { title, description } = req.body;
    if (!videoId) {
        throw new ApiError(400, "Video id is required");
    }
    if (!title) {
        throw new ApiError(400, "Title is required");
    }
    
    const video = await Video.findByIdAndUpdate(videoId,
        {
            title: title,
            description: description
        }, {
        new: true
    }
    ).select("-cloudinaryId -videofile -thumbnail -owner -__v");
    
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    return res
        .status(200)
        .json(new ApiResponse(200, "Video updated successfully", video));


})

const deleteVideo = asynchandler(async (req, res) => { // have to deletle from cloudinary IMP
    const videoId = req.params.id;
    if (!videoId) {
        throw new ApiError(400, "Video id is required");
    }
    const video = await Video.findByIdAndDelete(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    if (video.cloudinaryId) {
        await deleteFromCloudinary(video.cloudinaryId)
    }
    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video deleted successfully")); // check what comes in the video 
    
})

const getVideoByUserIdAgg = asynchandler(async (req, res) => {
    const videos = await Video.aggregate([
        {
            $match: {
                owner:req.user._id
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $project: {
                cloudinaryId: 0,
                owner: 0,
                __v: 0
            }
        }
    ])
    console.log("videos of user1", videos);
    if (!videos?.length ) {
        throw new ApiError(404, "No videos found");
    }
    return res
        .status(200)
        .json(new ApiResponse(200, "Videos found", videos));
    
}) //using aggregate which give data in one go this is not scalable for large data
// this is generally used for complex queries and data manipulation

const getVideobyUserid = asynchandler(async (req, res) => { 
    const { page = 1, limit = 10, sort = "-createdAt" } = req.query;
    const skip = (page - 1) * limit;
    const videos = await Video.find({ owner: req.user._id })
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .select("-cloudinaryId  -owner -__v");
    if (!videos.length) {
        throw new ApiError(404, "No videos found");
    }
    return res
        .status(200)
        .json(new ApiResponse(200, "Videos found", videos));
    
}) // this limit sort page for  large data and scalability
//this use when we have to fetch data in chunks or pages
//this generally used by frontend for pagination

const getVideoById = asynchandler(async (req, res) => {
    const videoId = req.params.id;
    if (!videoId) {
        throw new ApiError(400, "Video id is required");
    }
    const video = await Video.findById(videoId).select("-cloudinaryId -videofile -thumbnail -owner -__v");
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    return res
        .status(200)
        .json(new ApiResponse(200, "Video found", video));
})

const unpublishVideo = asynchandler(async (req, res) => {
    const videoId = req.params.id;
    if (!videoId) {
        throw new ApiError(400, "Video id is required");
    }
    const video = await Video.findByIdAndUpdate(videoId, {
        isPublished: false
    }, {
        new: true
    }).select("-cloudinaryId -videofile -thumbnail -owner -__v");
    return res
        .status(200)
        .json(new ApiResponse(200, "Video unpublished successfully", video));
})

const publishVideo = asynchandler(async (req, res) => {
    const videoId = req.params.id;
    if (!videoId) {
        throw new ApiError(400, "Video id is required");
    }
    const video = await Video.findByIdAndUpdate(videoId, {
        isPublished: true
    }, {
        new: true
    }).select("-cloudinaryId -videofile -thumbnail -owner -__v");
    return res
        .status(200)
        .json(new ApiResponse(200, "Video published successfully", video));
})
export {
    uploadVideo,
    updateVideoDetais,
    deleteVideo,
    getVideoByUserIdAgg,
    getVideoById,
    unpublishVideo,
    publishVideo
};
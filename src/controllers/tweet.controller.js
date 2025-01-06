import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/apierror.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asynchandler } from "../utils/asynchandler.js";


const createTweet = asynchandler(async (req, res) => {
    const { userid } = req.user?._id;
    const { content } = req.body;
    if (!userid) {
        throw new ApiError(400, "Uer not logged in or user id missing");
    }
    if (!content) {
        throw new ApiError(500, " Content is required ");
    }

    const tweet = await Tweet.create({
        owner: userid,
        content: content
    });

    if (!tweet) {
        throw new ApiError(500, "Error in creating tweet");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "Tweet created successfully ", tweet)
        )
});

const deleteTweet = asynchandler(async (req, res) => {
    const { tweetId } = req.params.id;
    if (!tweetId) {
        throw new ApiError(404, "Tweetid is required ");
    }

    const deletedTweet = await Tweet.findByIdAndDelete(tweetId);
    if (!deletedTweet) {
        throw new ApiError(500, "Error in deleteing ");
    }
    return res
        .status(200)
        .json(new ApiResponse(200, "Successfully deleted tweet", deletedTweet))
})

const updateTweet = asynchandler(async (req, res) => {
    const { content } = req.body;
    const { tweetId } = req.params.id;
    if (!content) {
        throw new ApiError(400, "Content is required")
    }
    if (!tweetId) {
        throw new ApiError(400 , "userid is required ")
    }

    const tweet = await Tweet.findByIdAndUpdate(tweetId, {
        $set: {
            content: content
        }
    },
        {
            new: true
        });
    if (!tweet) {
        throw new ApiError(500, "Error in updation ");
    }
    return res
        .status(200)
        .json(new ApiResponse(200, tweet, "Tweet updated succssfully "))
    
})

const getUserTweets = asynchandler(async (req, res ) => {
    const { userId } = req.user?._id;
    if (!userId) {
        throw new ApiError(400 , "userId id required ")
    }
    const tweets = await Tweet.aggregate([
        {
            $match: {
                owner: userId
            }
        }
    ]);
    if (tweets.length == 0) {
        throw new ApiError(400, "Tweets not found ")
    }
    return res
        .status(200)
        , json(new ApiResponse(200, "tweets fetched successfully ", tweets))

})

export {
    createTweet,
    deleteTweet,
    updateTweet,
    getUserTweets
}
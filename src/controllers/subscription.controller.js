import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/apierror.js";
import { Subscription } from "../models/subscription.model.js";
import { asynchandler } from "../utils/asynchandler.js";
import mongoose from "mongoose"

const toggleSubscription = asynchandler(async (req, res) => {
    const { channelId } = req.params; // Correct
    // TODO: toggle subscription
    // frist check if subcription
    // if subscription is there then delete the record
    // if there is no match then (document ) then create document where sub and channel can't be same
    const userId = req.user?.id;
    if (!userId) {
        throw new ApiError(400, "User is not logged in or the user id malfunctioned")
    }
    const subscriptions =await Subscription.aggregate([
        // {
        //     $match: {
        //         subscriber: new mongoose.Types.ObjectId(userId)
        //     }
        // }, {
        //     $search: {
        //         channel: new mongoose.Types.ObjectId(channelId)
        //     } //MongoServerError: $search is only valid as the first stage in a pipeline
        // }
        { // chatgpt
            $match: {
                subscriber: new mongoose.Types.ObjectId(userId),
                channel: new mongoose.Types.ObjectId(channelId)
            }

        }
    ])

    console.log("search result for toogle ", subscriptions)
    if (subscriptions.length == 0) {
        const newSubcription = await Subscription.create({
            subscriber : userId,
            channel : channelId
        }) 
        console.log("sub added ", newSubcription)
        return res
            .status(200)
            .json(new ApiResponse(200, newSubcription, "subcription added successfully"));
    }
    else {
        const deleteSubcription = await Subscription.findByIdAndDelete(subscriptions[0]._id);
        console.log("delete subs" , deleteSubcription )
        return res
            .status(200)
            .json(new ApiResponse(200, deleteSubcription, " Subcription removed successfully"))
    
    }

})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asynchandler(async (req, res) => {
    const channelId = req.user._id // channel 
    if (!channelId) {
        throw new ApiError(400, "User' channel not found")
    }
    const subcriberList = await Subscription.aggregate([
        {
            $match: {
                channel: channelId
            }
        }, {
            $project:
            {
                subscriber: 1
            }
        }
    ]);
    console.log("subcriber list from channel owner" ,subcriberList);
    return res
        .status(200)
    .json(new ApiResponse(200, subcriberList , "List fetched successfully"))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asynchandler(async (req, res) => {
    // const { subscriberId } = req.params // user 
    const subscriberId  = req.user._id // user 
    if (!subscriberId) {
        throw new ApiError(400  , "User id not found")
    }
    const channelsSubcribed = await Subscription.aggregate([
        {
            $match: {
                subscriber: subscriberId
            }
        }, {
            $project: {
                channel:1
            }
        }
    ]);
    console.log("channels : ", channelsSubcribed)
    
    return res
        .status(200)
        .json(new ApiResponse(200, {subscriberId ,channelsSubcribed }, "channels fetched successfully"))
    
})


export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}
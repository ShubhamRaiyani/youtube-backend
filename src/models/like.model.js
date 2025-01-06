import mongoose, {Schema} from "mongoose";

// const likeSchema = new Schema({
//     comment: {
//         type: Schema.Types.ObjectId,
//         ref: "Comment"
//     },
//     video: {
//         type: Schema.Types.ObjectId,
//         ref: "Video"
//     },
//     likedby: {
//         type: Schema.Types.ObjectId,
//         ref: "User"
//     },
//     tweet: {
//         type: Schema.Types.ObjectId,
//         ref: "Tweet"
//     }
// },
//     {
//     timestamps: true
//     }
// );

const LikeSchema = new Schema(
    {
        likedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }, // User who liked
        target: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: 'targetType', // Dynamically reference collection
            }, // Video, Comment, Tweet
        targetType: {
            type: String,
            required: true,
            enum: ['Video', 'Comment', 'Tweet'], // Specifies the possible target types
        }
    },
  { timestamps: true }
);

export const Like = mongoose.model("Like", LikeSchema)
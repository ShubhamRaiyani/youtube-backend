import mongoose, { Schema } from 'mongoose';

const tweetSchema = new Schema(
    {
        owner: {
            type: Schema.Types.ObjectId,
            ref : "User"
        },
        content: {
            type: String,
            required: [true, "Tweet content is required"],
            trim: true
        },
        likesCount: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
)

const Tweet = mongoose.model("Tweet", tweetSchema);
export default Tweet;
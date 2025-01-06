import mongoose, { Schema } from "mongoose";

const commentSchema = new Schema({
    context: {
        type: String,
        required: [true, "Comment content is required"],
        trim: true
    },
    video: {
        type: Schema.Types.ObjectId,
        ref: "Video"
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User" // viewed as the user who made the comment
    },
    likesCount: {
        type: Number,
        default: 0
    }
},
    {
    timestamps: true
    }
);

export const Comment = mongoose.model("Comment", commentSchema);

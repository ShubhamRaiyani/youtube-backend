import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";


 const userSchema = new Schema(
    {
        username:{
            type: String,
            required : true,
            unique: true,
            lowercase: true,
            trim: true,
            index:true
        },
        email:{
            type: String,
            required : true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullName:{
            type: String,
            required : true,
            trim: true,
            index: true
        },
        avatar:{
            url: {
            type: String,
            required: true
            },
            public_id: {
                type: String,
                required: true
            }
        },
        coverImage:{
            url: {
            type: String,
            required: true
            },
            public_id: {
                type: String,
                required: true
            }
        },
        watchHistory:[
            {
                type : Schema.Types.ObjectId,
                ref : "Video"
            }
        ],
        password:{
            type: String,
            required : [true , "Password is required"]
        },
        refreshToken: {
            type:String
        }
},
{
    timestamps:true
}
)

userSchema.pre("save" , async function(next) {
    // isModified for checking if password is really changed 
    // in the specific change
    if( !this.isModified("password") ) return next()
    this.password =  await bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password,this.password)
}

// generating access token and refresh token
// for the user
// this is a method for the userSchema
// and not for the user instance
// so we are using userSchema.methods
// instead of userSchema.statics
// we are using function() instead of arrow function
// because we need access to this
// we are using this to get the user instance
userSchema.methods.generateAccessToken = function () {
    //returnin left
    return jwt.sign(
        {
            _id: this._id,
            email : this.email,
            username : this.username,
            fullname: this.fullName
        },process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function () {
    //returnin left 
    return jwt.sign(
        {
            _id: this._id,
            email : this.email,
            username : this.username,
            fullName: this.fullName
        },process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}



 export const User = mongoose.model("User", userSchema)
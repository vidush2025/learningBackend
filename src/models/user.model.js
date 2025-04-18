import mongoose, {Schema} from "mongoose"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"


const userSchema = new Schema({
    username: {
        type: String,
        required: [true, "Username is required."],
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    email: {
        type: String,
        required: [true, "Email is required."],
        unique: true,
        lowercase: true,
        trim: true,
    },
    fullname: {
        type: String,
        required: [true, "Name is required."],
        trim: true,
    },
    avatar:{ //cloundinary url,
        url: {
            type: String, 
            required: [true, "Avatar URL is required."]
        },
        public_id: {
            type: String, 
            required: [true, "Avatar public_id is required."]
        },
    },
    coverImage: {
        url: { type: String },
        public_id: { type: String }
    },
    watchHistory:[
        {
            type: Schema.Types.ObjectId,
            reference: "Video"
        }
    ],
    password:{
        type: String,
        required:[true, "Password is required."],
    },
    refreshToken:{
        type: String
    }
}, {timestamps: true})

userSchema.pre("save", async function(next){
    if(!this.isModified("password")){
        return next();
    }

    this.password = await bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods.checkPassword = async function (password) {
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}   
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema) 
import mongoose, { Schema } from "mongoose";

const playlistSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    videos:[
        {
            type:Schema.Types.ObjectId,
            reference: "Video"
        }
    ],
    creator: {
        type: Schema.Types.ObjectId,
        reference: "User"
    },
    savedBy: [
        {   
            type: Schema.Types.ObjectId,
            reference: "User"
        }
    ]

}, {timestamps: true})

export const Playlist = new mongoose.model("Playlist", playlistSchema)
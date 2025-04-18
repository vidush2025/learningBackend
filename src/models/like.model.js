import mongoose, {Schema} from "mongoose"

const likeSchema = Schema({
    video: {
        type: Schema.Types.ObjectId,
        reference: "Video"
    },
    comment: {
        type: Schema.Types.ObjectId,
        reference: "Video"
    },
    liker: {
        type: Schema.Types.ObjectId,
        reference: "Video"
    }

}, {timestamps: true})

export const Like = new mongoose.model("Like", likeSchema)
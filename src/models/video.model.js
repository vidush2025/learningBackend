import mongoose, {Schema} from "mongoose"
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"

const videoSchema = new Schema({
    videoFile:{
        type: String,
        required: true
    },
    thumbnail:{
        url: {
            type: String, 
            required: [true, "Thumbnail URL is required."]
        },
        public_id: {
            type: String, 
            required: [true, "Thumbnail public_id is required."]
        },
    },
    owner:{
        type: Schema.Types.ObjectId,
        reference: "User"
    },
    title:{
        type: String,
        required: true
    },
    description:{
        type: String,
        required: true
    },
    duration:{
        type: Number,
        required: true
    },
    views: {
        type: Number,
        default: 0
    },
    isPublished: {
        type: Boolean,
        default: true
    }

}, {timestamps: true})

videoSchema.plugin(mongooseAggregatePaginate)

export const Video = new mongoose.model("Video", videoSchema) 
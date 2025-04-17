import mongoose, {Schema} from "mongoose"

const subscriptionSchema = new Schema({
    subcriber: {
        type: Schema.Types.ObjectId,
        reference: "User"
    },
    channel: {
        type: Schema.Types.ObjectId,
        reference: "User"
    }

}, {timestamps: true})

export const Subscription = new mongoose.model("Subscription", subscriptionSchema)
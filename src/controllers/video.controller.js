import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)

    // if(!(query || sortBy || sortType || userId))
    //     throw new ApiError(400, "Invalid Search.")

    let filter= {};

    if(query){
        filter.$or= [
            {title : { $regex: query, $options: 'i' }},
            {description : {regex: query, $options: 'i' }} 
        ]

    }

    if(userId)
        filter.owner = userId


    const sortFunc = {};
    sortFunc[sortBy] = sortType === 'asc'? 1 : -1;


    const totalVideos = await Video.countDocuments(filter)

    const videos = await Video.find(filter)
                    .sort(sortFunc)
                    .skip((pageNum -1))*limitNum
                    .limit(limitNum)


    return res.status(200)
            .json(
                new ApiResponse(200, 
                    {
                        total: totalVideos,
                        page: pageNum,
                        totalPages: Math.ceil(totalVideos/limitNum),
                        videos
                    },
                    "Videos fetched successfully!"
                )
            )
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    
    if([title, description].some((field) => field?.trim() ===""))
        throw new ApiError(400, "All fields are required.")

    const videoLocalPath = req.files?.videoFile?.[0]?.path

    if(!videoLocalPath)
        throw new ApiError(400, "Please Upload Video file.")

    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path

    if(!thumbnailLocalPath)
        throw new ApiError(400, "Thumbnail is required.")

    const video = await uploadOnCloudinary(videoLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if (!video) {
        throw new ApiError(400, "Video file is required");
    }
    if (!video?.url || !video?.public_id) {
        throw new ApiError(500, "Error uploading video to Cloudinary");
    }


    if (!thumbnail) {
        throw new ApiError(400, "Thumbnail file is required");
    }
    if (!thumbnail?.url || !thumbnail?.public_id) {
        throw new ApiError(500, "Error uploading thumbnail to Cloudinary");
    }

    const newVideo = await Video.create(
        {
            title,
            description,
            videoFile: video.url,
            thumbnail: thumbnail.url,
            duration: video.response?.duration,
            owner: req.user?._id
        }
    )

    const publishedVideo = await Video.findById(newVideo._id)

    if(!publishedVideo)
        throw new ApiError(500, "Something went wrong while uploading the video.")


    return res.status(200)
    .json(new ApiResponse(
        200, 
        publishedVideo,
        "Video has been published successfully!"
    ))
})


const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!mongoose.Types.ObjectId.isValid(videoId))
        throw new ApiError(400, "Invalid video id.")
    
    const video = await Video.findById(videoId)

    if(!video)
        throw new ApiError(400, "No videos found with this id.")

    return res.status(200)
    .json(
        new ApiResponse(
            200,
            video,
            "Video fetched successfully!"
        )
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
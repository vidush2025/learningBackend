import asyncHandler from "../utils/asyncHandler.js"
import ApiError from "../utils/errorHandler.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse} from "../utils/responseHandler.js"
import jwt from "jsonwebtoken"

import {v2 as cloudinary} from "cloudinary"
import mongoose from "mongoose"

const generateAccessAndRefreshTokens = async(userId) => {
    try{
        const currUser = await User.findById(userId); 

        const accessToken = currUser.generateAccessToken();
        const refreshToken = currUser.generateRefreshToken();

        currUser.refreshToken = refreshToken;

        await currUser.save({validateBeforeSave: false});
        return {accessToken, refreshToken};

    }catch (error){
        throw new ApiError(500, "Something went wrong while generating refresh and access tokens.")
    }
}

const registerUser = asyncHandler( async (req, res) => {
    // get user details from frontend
    // validation -not empty
    // check if user alerady exists: username email etc
    // check for imagaes, avatar
    // upload to cloudinary, check avatar again

    // create user object - create entry in database
    // remove password and refresh token feild from response
    // check for user creation, 
        // if user created, return response
    // return null/error


    const {fullname, email, username, password} = req.body
    console.log("email:", email)
    
    if (
        [fullname, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    if (!email.includes("@")) {
        throw new ApiError(400, "Please provide a valid email address.");
    }

    const existedusername = await User.findOne({username})
    if(existedusername) throw new ApiError(409, "username already exists.")

    const existedEmail = await User.findOne({email})
    if(existedEmail) throw new ApiError(409, "email already exists.")

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
    
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }
        
    console.log("Avatar Path:", avatarLocalPath);
    console.log("Cover Image Path:", coverImageLocalPath);
        
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
        
    if (!avatar) {
        throw new ApiError(400, "Avatar file is required");
    }
    if (!avatar?.url || !avatar?.public_id) {
        throw new ApiError(500, "Error uploading avatar to Cloudinary");
    }

    const newUser = await User.create({
        fullname,
        avatar,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(newUser._id).select(
        "-password -refreshToken",
    )

    if(!createdUser)
        throw new ApiError(500, "Something went wrong while registering the user.")

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered Successfully!!")
    )
})

const loginUser = asyncHandler(async(req, res) => {

    // CHAI AUR CODE ALGO-

    // req.body -> data retrieve
    // check username or email
    // find the user
    // check password
    // access and refresh token generate
    // send cookies


    // MY ALGO-
    // check if refresh/access token is active
        // if yes, direct login
    // else
        // take username and pasword
            // check if user exists
                // check if password matches
                    // login
                // throw incorrect password, try again
            //  incorrect usernamme, try again, or register

    const {email, username, password} = req.body;

    if(!username && !email)
        throw new ApiError(400, "username or email is required.")

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user) 
        throw new ApiError(404, "User does not exist.")

    const isPasswordValid = await user.checkPassword(password);

    if(!isPasswordValid)
            throw new ApiError(401, "Invalid password or username.");

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);

    const currUser = await User.findById(user._id).select(
        "-password -refresToken"
    )
    const options = {
        httpOnly: true,
        secure: true
    }

    return res.
    status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200,{
            user: currUser, accessToken, refreshToken
        }, "User Logged in successfully!")
    );
    
})

const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(req.user._id, {
        $set: {
            refreshToken: undefined,
        }
    },

    {
        new: true
    })

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully."))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    
    if(!incomingRefreshToken)
        throw new ApiError(401, "Unauthorised Request.");

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        const currUser = await User.findById(decodedToken?._id);
        if(!currUser)
            throw new ApiError(401, "Invalid Refresh Token.");
    
        if(incomingRefreshToken !== currUser.refreshToken)
            throw new ApiError(401, "Refresh Token has expired.")
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {generatedAccessToken, generatedRefreshToken} = await generateAccessAndRefreshTokens(currUser._id);
    
        return res
        .status(200)
        .cookie("accessToken", generatedAccessToken, options)
        .cookie("refreshToken", generatedRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken: generatedAccessToken,
                    refreshToken: generatedRefreshToken
                },
                "Access Tokens refreshed successfully!"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token.")
    }
})

const changePassword = asyncHandler(async(req, res) => {
    const {oldPassword, newPassword, confirmPassword} = req.body

    const currUser = await User.findById(req.user?._id) 

    const isPasswordCorrect = currUser.checkPassword(oldPassword)

    if(!isPasswordCorrect)
        throw new ApiError(400, "Incorrect Password.")

    if(newPassword !== confirmPassword)
        throw new ApiError(401, "Please check new password.")

    currUser.password = newPassword;
    
    await currUser.save({validateBeforeSave : false});

    return res.status(200)
    .json(
        new ApiResponse(200,
            {},
            "Password changed successfully!"
        )
    )
})

const getCurrentUser = asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(
        new ApiResponse (
            200,
            req.user,
            "Current user fetched sucessfully!"
        )
    )
})

const updateUserDetails = asyncHandler(async (req, res) => {
    const {username, fullname, email} = req.body;

    if(!username && !email)
        throw new ApiError(400, "Unauthorised access.")

    const currUser = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                username,
                fullname,
                email,
            }   
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, currUser, "Account details updated successfully!")
    )
})

const changeAvatar = asyncHandler(async (req, res) => {
    const oldAvatar = req.body.avatar;


    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath)
        throw new ApiError(400, "Avatar is missing.")

    const newAvatar = await uploadOnCloudinary(avatarLocalPath)
    if(!newAvatar.url || !newAvatar.public_id)
        throw new ApiError(500, "Something went wrong while uploading avatar on Cloudinary.")

    const currUser = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                avatar: newAvatar.url
            }
        },
        {new: true}
    ).select("-password")

    if(!currUser)
        throw new ApiError(500, "Something went wrong while saving to database.")

    if(oldAvatar.public_id){
        try {
            await cloudinary.uploader.destroy(oldAvatar.public_id)
        } catch (error) {
            console.error("Error deleting old avatar from Cloudinary:", error);
        }
    }

    return res
    .status(200)
    .json(new ApiResponse(
            200,
            currUser,
            "Avatar has been changed successfully!"
        )
    )

})

const changeCoverImage = asyncHandler(async(req, res) => {
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath)
        throw new ApiError(400, "CoverImage is missing.")

    const newCoverImage = await uploadOnCloudinary(coverImageLocalPath)
    if(!newCoverImage.url)
        throw new ApiError(500, "Something went wrong while uploading Cover-Image on Cloudinary.")

    const currUser = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                avatar: newCoverImage.url
            }
        }
    ).select("-password")

    if(!currUser)
        throw new ApiError(500, "Something went wrong while saving to database.")

    return res
    .status(200)
    .json(new ApiResponse(
            200,
            currUser,
            "Cover-Image has been changed successfully!"
        )
    )  
})

const getUserChannelProfie = asyncHandler(async(req, res) => {
    const {username} = req.params

    if(!username?.trim)
        throw new ApiError(400, "User is not found.")

    const channel = await User.aggregate([
        {
            $match: {
                username: username.toLowerCase()
            }
        },
        {
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscriberedTo"
            }
        },
        {
            $addFields: {
                subscriberCount: {
                    $size: "$subscribers"
                },
                subscriptions: {
                    $size: "$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        }, 
        {
            $project:{
                fullname: 1,
                username: 1,
                subscriberCount: 1,
                subscriptions: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1
            }
        }
    ])

    // channel[0] is user(if found match)

    if(!channel?.length)
        throw new ApiError("Channel Not Found.")

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            channel[0],
            "Channel fetched successfully!"
        )
    )
})

const getWatchHistory = asyncHandler(async(req, res) => {
    const currUser = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id),
            } 
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner: {
                                $first: "$owner"
                            }
                        } 
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200,
            currUser[0].watchHistory,
            "Watch History fetched successfully!"
        )
    )
})

export {registerUser, loginUser, logoutUser, refreshAccessToken, changePassword, getCurrentUser, changeAvatar, updateUserDetails, changeCoverImage, getUserChannelProfie, getWatchHistory}
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/errorHandler.js"
import { User } from "../models/user.model.js";

import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler( async(req, res, next)=> {
    try {
        const token = await req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
    
        if(!token)
                throw new ApiError(401, "Unauthorised access.")
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const currUser = await User.findById(decodedToken?._id).select("-password, -refreshToken")
    
        if(!currUser){
            // frontend
            

            throw new ApiError(401, "Invalid Access Token.")
    
        }
        req.user= currUser;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token.")
    }
})
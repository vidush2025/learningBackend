import { Router } from "express";
import { changeAvatar, changePassword, getCurrentUser, loginUser, logoutUser, refreshAccessToken, registerUser, updateUserDetails, changeCoverImage, getUserChannelProfie, getWatchHistory } from "../controllers/user.controller.js"
import {upload} from  "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
        registerUser
    )
// http://localhost:3000/api/vi/users/register

router.route("/login").post(loginUser)


// secured routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refreshTokens").post(refreshAccessToken)
router.route("/changePassword").post(verifyJWT, changePassword)
router.route("/currentUser").get(verifyJWT, getCurrentUser)

router.route("/updateAccount").patch(verifyJWT, updateUserDetails)
router.route("/avatarChange").patch(verifyJWT, upload.single("avatar"), changeAvatar)
router.route("/changeCoverImage").patch(verifyJWT, upload.single("coverImage"), changeCoverImage)

router.route("/c/:username").get(verifyJWT, getUserChannelProfie)
router.route("/history").get(verifyJWT, getWatchHistory)

export default router
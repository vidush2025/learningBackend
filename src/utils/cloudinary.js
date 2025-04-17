import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (filePath) => {
    try {
        if(!filePath){
            console.log("FILE NOT FOUND at ", filePath);
            return null;
        }
        const response = await cloudinary.uploader.upload(filePath, {
            resource_type: "auto"
        })

        fs.unlinkSync(filePath);

        console.log("File has been uploaded successfully!");

        return {response,
            url: response.secure_url,
            public_id: response.public_id
        };
    } catch (error) {
        fs.unlinkSync(filePath) //remove the locally saved temp file on MY server
        return null;
    }
}

export {uploadOnCloudinary}
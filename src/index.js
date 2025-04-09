import connectDB from "./database/index.js";
// require('dotenv').config()

import dotenv from "dotenv"

dotenv.config({
    path: "./env"
})

connectDB()
.then(() => {
    
    app.on("error", (err)=> {
        console.log("MONGODB connection failed!!! ", err);
    })

    app.listen(process.env.PORT || 8080, () => {
        console.log(`Server is runnint at Port: ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("MONGODB connection failed!!! ", err);
})


// import express from "express"

// const app = express()
// (async() => {
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URL} / ${DB_NAME}`)
//         app.on("error", ()=> {
//             console.log("ERROR:", error);
//             throw error;
//         })

//         app.listen(process.env.PORT, () => {
//             console.log(`App is listening on Port: ${process.env.PORT}`);
//         })

//     } catch (error) {
//         console.log("ERROR: ", error);
//         throw error;
//     }
// })()
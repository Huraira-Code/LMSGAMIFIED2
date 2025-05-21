import cloudinary from "cloudinary";

import app from "./app.js";
import { connectDB }  from "./config/dbConnection.js";

const PORT = process.env.PORT || 5000;

/**
 * @Cloudinary configuration for file storage service
 */
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: process.env.CLOUDINARY_SECURE,
});
/**
 * @Razorpay configuration for payment gateway
 */

connectDB().then(() => {
  app.listen(8000, () => {
    console.log("🚀 Server is running on port 8000");
  });
});

import mongoose from "mongoose";

/**
 * @Connects to MongoDB database
 */
mongoose.set("strictQuery", false);

const connectionToDB = async () => {
  try {
    const { connection } = await mongoose.connect(
      "mongodb+srv://huraira:Usama10091@cluster0.hnawam1.mongodb.net/LMS"
    );

    if (connection) {
      console.log(`Connected to MongoDB :${connection.host}`);
    }
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
};
export default connectionToDB;

const mongoose = require("mongoose");

url="mongodb+srv://huraira:Usama10091@cluster0.hnawam1.mongodb.net/Kiraydar"
const connectDB = () => {
    console.log("we are in database")
    return mongoose.connect(url, {
        useNewUrlParser : true,
        useUnifiedTopology : true,
    });
}

module.exports = connectDB

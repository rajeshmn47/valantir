const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        console.log("mongoose");
        await mongoose.connect('mongodb://localhost:27017/peopleintel');
        console.log("MongoDB Connected");
    } catch (error) {
        console.error("MongoDB Connection Failed:", error);
        process.exit(1);
    }
};

module.exports = connectDB;
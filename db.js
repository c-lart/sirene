const mongoose = require("mongoose");
var db;

const connectDb = async (truncate = false) => {

    db = await mongoose.connect('mongodb://127.0.0.1:27017/sirene', {minPoolSize: 5, maxPoolSize: 100 });


}

const disconnectDb = async () => {await db.disconnect();};

module.exports = {
    connectDb,
    disconnectDb
};


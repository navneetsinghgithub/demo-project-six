const mongoose = require("mongoose")
const users_schema = new mongoose.Schema({
    name:
        { type: String },
    email:
        { type: String },
    phone_number:
        { type: Number },
    country:
        { type: String },
    city:
        { type: String },
    town:
        { type: String },
    password:
        { type: String },
    isVerified:
        { type: Number, default: 0 },
    token:
        { type: String },
    logintime:
        { type: String },
    otp:
        { type: Number },
    image:
        [{ type: String }],
    notification_status:
        { type: Number, enum: [0, 1] },
}, { timestamps: true })

const users = mongoose.model("users", users_schema)
module.exports = users;
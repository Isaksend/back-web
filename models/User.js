const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const UserSchema = new Schema({
    username: { type: String, required: true, unique: true, min: 3, max: 255 },
    password: { type: String},
    email: { type: String, unique: true, sparse: true, required: true },
    verified: { type: Boolean, default: true },
    city: { type: String },
    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
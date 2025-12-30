const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      minlength: 6,
      maxlength: 20,
      unique: true
    },
    email: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 50,
      unique: true,
      match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ'],
    },
    otp: String,
    otpExpires: Date,
    verified: { type: Boolean, default: false },
    password: {
      type: String,
      required: true,
      minlength: 6
    },
    admin: {
      type: Boolean,
      default: false
    },
    avatar: {
      type: String
    },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'logins' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'logins' }]
  },
  { timestamps: true }
);

module.exports = mongoose.model("logins", UserSchema);

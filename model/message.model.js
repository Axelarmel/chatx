const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Types.ObjectId,
      require: true,
    },
    sender: {
      type: mongoose.Types.ObjectId,
      require: true,
    },
    reciever: {
      type: mongoose.Types.ObjectId,
      require: true,
    },
    message: {
      type: String,
      require: true,
    },
    state: {
      type: Boolean,
      require: true,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Message = mongoose.model("Message", MessageSchema);

module.exports = { Message };

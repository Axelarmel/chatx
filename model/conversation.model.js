const mongoose = require("mongoose");

const ConversationSchema = new mongoose.Schema(
  {
    lastmessage: {
      type: String,
      require: false,
    },
  },
  {
    timestamps: true,
  }
);

const Conversation = mongoose.model("Conversation", ConversationSchema);

module.exports = { Conversation };

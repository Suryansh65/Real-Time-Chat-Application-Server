import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";
import { io, userSocketMap } from "../server.js";

// Get all users except logged in user
export const getUsersForSidebar = async (req, res) => {
  try {
    const userId = req.user._id;

    const filteredUser = await User.find({ _id: { $ne: userId } }).select(
      "-password"
    );
    // count number of messages not seen
    const unseenMessages = {};
    const promises = filteredUser.map(async (user) => {
      const message = await Message.find({
        senderId: user._id,
        receiverId: userId,
        seen: false,
      });
      //   we store message.length to show total no of message particular user send to currently loggedin user like Vipan send me 8 messages then it will show the message.length for vipan is 8 and we store [vipan.senderId] = 8
      if (message.length > 0) {
        unseenMessages[user._id] = message.length;
      }
    });
    await Promise.all(promises);
    res.json({ success: true, users: filteredUser, unseenMessages });
  } catch (err) {
    console.log("Error while fetching message", err.message);
    res.json({ success: false, message: err.message });
  }
};

// get all messages for the selected user
export const getMessages = async (req, res) => {
  try {
    const { id: selectedUserId } = req.params;
    const myId = req.user._id;
    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: selectedUserId },
        { senderId: selectedUserId, receiverId: myId },
      ],
    });
    // mark all message as seen
    await Message.updateMany(
      { senderId: selectedUserId, receiverId: myId },
      { seen: true }
    );
    res.json({ success: true, messages });
  } catch (err) {
    console.log(err.message);
    res.json({ success: false, message: err.message });
  }
};

//API to mark message as seen using message id
export const markMessageAsSeen = async (req, res) => {
  try {
    const { id } = req.params;
    await Message.findByIdAndUpdate(id, { seen: true });
    res.json({ success: true });
  } catch (err) {
    console.log(err.message);
    res.json({ success: false, message: err.message });
  }
};

// send message to selected User
export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const receiverId = req.params.id;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }
    const newMessage = await Message.create({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });
    // Emit the message to the receiver socket
    const receiverSocketId = userSocketMap[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }
    res.json({ success: true, newMessage });
  } catch (err) {
    console.log(err.message);
    res.json({ success: false, message: err.message });
  }
};
//   try{

//     }catch (err) {
//     console.log(err.message);
//     res.json({ success: false, message: err.message });
//   }

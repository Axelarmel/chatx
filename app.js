require("dotenv").config();
const express = require("express");
const app = express();
const morgan = require("morgan");
// const io = require('socket.io')
const cors = require("cors");
let { User } = require("./model/user.model");
let { Message } = require("./model/message.model");
let { Conversation } = require("./model/conversation.model");
const { connect } = require("./bd/bd_connection");
const fileUpload = require("express-fileupload");
const cookieParser = require("cookie-parser");
const colors = require("colors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { wait } = require("@testing-library/user-event/dist/utils");
const secret = "mon secret";

app.use(morgan("dev"));
app.use(express.json({ limit: "30mb", extended: true }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));
app.use(cors({ origin: "*" }));
let port = process.env.PORT || 300;
// app.subscribe()
connect();

app.use(fileUpload({ safeFileNames: true }));
app.use(cookieParser());
app.listen(port, () => {
  console.log(colors.underline.cyan(`Serveur en ecoute sur le port ${port}`));
});

// Login route
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(req.body);
    const user = await User.findOne({ email: email });
    if (!user) {
      console.log("!user");
      res.status(404).json({
        message: "Aucun utilisateur n'a cette adresse email dans nos données",
      });
      return;
    }
    wait(4);
    const isPassword = await bcrypt.compare(password, user.password);

    if (!isPassword)
      return res.status(400).json({ message: "Mot de passe incorrect" });
    const token = jwt.sign({ email: user.email, id: user._id }, secret, {
      expiresIn: "1h",
    });
    res.status(200).json({ user, token });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "Une erreur est survenu du coté du serveur" });
  }
});

// Register route
app.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const Olduser = (await User.findOne({ email })) || false;
    if (Olduser) {
      res.status(400).json({ message: "Cette email est deja pris" });
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHashed = bcrypt.hashSync(password, salt);

    const user = await User.create({
      email: email,
      password: passwordHashed,
      name: name,
    });

    const token = jwt.sign({ email: user.email, id: user._id }, secret, {
      expiresIn: "1h",
    });

    res.status(201).json({ user, token });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Une erreur est survenu du coté du serveur" });
    return;
  }
});

// Recuperer les autres utilisateurs
app.get("/users/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const users = await User.find({ _id: { $ne: id } });
    res.status(200).json({ users });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Une erreur est survenu du coté du serveur" });
  }
});

// Recuperer les messages d'une conversation
app.get("/conversation/:id/messages", async (req, res) => {
  const id = req.params.id;
  try {
    const messages = await Message.find({ conversation: id });
    res.status(200).json({ messages });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Une erreur est survenu du coté du serveur" });
  }
});

// ajouter une conversation
app.post("/conversation", async (req, res) => {
  const { lastmessage } = req.body;
  try {
    await Conversation.create({
      lastmessage: lastmessage ? lastmessage : `Nouvelle conversattion`,
    });
    res.status(200).json({ message: `Nouvelle conversattion` });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Une erreur est survenu du coté du serveur" });
  }
});

// recuperer les messages non lus d'une conversation
app.get("/conversation/:id/notread", async (req, res) => {
  try {
    const id = req.params.id;
    const conversation = await Conversation.findOne({ _id: id });
    const messages = await Message.find({
      $and: [{ conversation: conversation._id }, { state: false }],
    });
    res.status(200).json({ messages });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Une erreur est survenu du coté du serveur" });
  }
});

// Recuperer les conversations
app.get("/conversation/user/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const messages = await Message.find({
      $or: [{ sender: id }, { reciever: id }],
    });
    console.log(messages);
    let conversationTab = [];
    for (let index = 0; index < messages.length; index++) {
      conversationTab.push(messages[index].conversation);
    }

    const conversations = await Conversation.find({
      _id: { $in: conversationTab },
    });

    res.json(conversations);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Une erreur est survenu du coté du serveur" });
  }
});

//envoyer un message a une personne
app.post("/conversation/:id/message", async (req, res) => {
  const { message, sender, reciever } = req.body;
  const id = req.params.id;
  try {
    console.log(typeof message, typeof id);
    const Newmessage = await Message.create({
      conversation: id,
      message: message,
      sender: sender,
      reciever: reciever,
    });

    await Conversation.findByIdAndUpdate(id, { lastmessage: message });

    console.log(Newmessage);

    res.status(200).json(Newmessage);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Une erreur est survenu du coté du serveur" });
  }
});

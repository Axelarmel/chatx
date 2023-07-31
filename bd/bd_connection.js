const mongoose = require("mongoose");
const colors = require("colors");
var BD = null;
if (process.env.NODE_ENV === "production") {
  BD = process.env.BD_PRODUCTION;
} else {
  BD = process.env.BD_DEV;
}
const connect = () => {
  mongoose
    .connect(BD)
    .then(() => console.log(colors.underline.cyan("Mongodb connecté!")))
    .catch((error) => {
      console.log(error);
    });
};

module.exports = { connect };

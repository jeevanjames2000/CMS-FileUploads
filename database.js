const mongoose = require("mongoose");

const MONGO_URI =
  "mongodb+srv://jeevanjames2000:Vru0IGQ3wyvIQtIO@cluster0.brk74.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("DB Connection Error: ", err));

module.exports = mongoose;

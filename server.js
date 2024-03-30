const express = require("express");
const app = require("./app");
const mongoose = require("mongoose");

const DB = process.env.DATABASE;
mongoose
  .connect(DB)
  .then(() => console.log("DB Connected successful!! ✌️✌️"))
  .catch((err) => console.log("DB Connection error: ", err));

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

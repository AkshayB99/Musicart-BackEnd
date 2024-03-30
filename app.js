const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv").config();
const cookieParser = require("cookie-parser");

const AppError = require("./utils/appError");
const dataRouter = require("./routes/dataRouter");
const userRouter = require("./routes/userRouter");
const globelError = require('./controllers/errorController')

const app = express();

app.use(cors());

app.use(cookieParser());
app.use(express.json());

// Router for User
app.use("/api/v1/user", userRouter);

// Router for Data
app.use("/api/v1/data", dataRouter);

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globelError);

module.exports = app;

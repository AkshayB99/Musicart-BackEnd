const mongoose = require("mongoose");

const dataSchema = new mongoose.Schema({
  id: Number,
  name: {
    shortname: String,
    fullname: String,
  },
  color: String,
  type: String,
  imageUrl: {
    mainImg: String,
    img1: String,
    img2: String,
    img3: String,
  },
  ratings: {
    rating: Number,
    ratingNo: Number,
  },
  price: Number,
  description: String,
  availability: String,
});

const Data = mongoose.model("Data", dataSchema);

module.exports = Data;

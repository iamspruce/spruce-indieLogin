// STEP 1: import mongoose
const mongoose = require("mongoose");

// STEP 2: define the schema
const userSchema = new mongoose.Schema({
  me: {
    type: String,
    required: [true, "Domain name is required"],
    trim: true,
  },
  code: {
    type: String,
    required: [true, "code parameter is required"],
    trim: true,
    unique: [true, "code already exists"],
  },
  client_id: {
    type: String,
  },
  redirect_uri: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  expireAt: {
    type: Date,
    default: Date.now() + 7 * 60 * 1000, // expires in 10 minutes
  },
});

// STEP 3: Create the Model with the schema we defined above and store it in a variable called User
const loggedUser = mongoose.model("loggedUser", userSchema);

// STEP 4: // finally export the User Model
module.exports = loggedUser;

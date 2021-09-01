//STEP 1: import our app(for everything express)
const app = require("./app");

//STEP 2: import our dependencies
const mongoose = require("mongoose");
const dotenv = require("dotenv");

// STEP 3: when we have an uncaughtException end the server and log the error
process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION ⛔⛔ shutting down...");
  console.error(err.name, err.message);
  process.exit(1);
});

// STEP 4: Configure the dotenv to use our config file
dotenv.config({ path: "./config.env" });

// STEP 4: Get the DATABASE value from the config.env file and store it in a variable DB
const DB = process.env.DATABASE;

// STEP 5: Connect to our MongoDB Database
// The options passed are to avoid MongoDB console warnings
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("connected to db"));

// STEP 6: Start the server
const server = app.listen(process.env.PORT, () =>
  console.log("server is running")
);

// STEP 7: when we have an unhandledRejection end the server and log the error
process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION ⛔⛔ shutting down...");
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

process.on("SIGTERM", () => {
  console.log("✌✌ SIGTERM RECIEVED. Shutting down gracefully");
  server.close(() => {
    console.log("⛔ Process terminated");
  });
});

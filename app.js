const express = require("express");
const app = express();
const path = require("path");
const passport = require("passport");
const session = require("express-session");
const flash = require("connect-flash");
const cors = require("cors");
const FileStore = require("session-file-store")(session);
const cookieParser = require("cookie-parser");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const xss = require("xss-clean");
const hpp = require("hpp");

const AppError = require("./utils/AppError");
const globalErrorHandler = require("./controllers/errorController");
const authRouter = require("./routes/authRouter");
const socialRouter = require("./routes/socialRouter");
const viewRouter = require("./routes/viewRouter");

app.use(helmet());
app.use(cors());
app.enable("trust proxy");

// body parser

const fileStore_options = {
  path: "./tmp/sessions/",
  ttl: 120000,
  useAsync: true,
  /*   reapInterval: 120, */
  maxAge: 120000,
};

app.use(flash());
app.use(
  session({
    store: new FileStore(fileStore_options),
    secret: "my-key",
    resave: true,
    saveUninitialized: true,
    cookie: { maxAge: 120000 },
    secure: process.env.NODE_ENV === "production" ? true : false,
  })
);

app.use(passport.initialize());
app.use(passport.session());
require("./utils/passport")(passport);
require("./utils/passport")(passport);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

// Data Sanitiztion Clean
app.use(xss());

// prevent parameter pollution
app.use(hpp());

//Limit rate of request per IP
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in one hour!",
});
app.use("/api", limiter);

//Routes
app.use(function (req, res, next) {
  if (req.originalUrl && req.originalUrl.split("/").pop().includes("favicon")) {
    return res.sendStatus(204).end();
  }

  return next();
});
app.use("/", viewRouter);
app.use("/social", socialRouter);
app.use("/auth", authRouter);

app.all("*", (req, res, next) => {
  next(new AppError(`${req.originalUrl} not found on this server`));
});

app.use(globalErrorHandler);
app.use(compression());

module.exports = app;

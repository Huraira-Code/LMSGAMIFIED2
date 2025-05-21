import cookieParser from "cookie-parser";
import cors from "cors";
import { config } from "dotenv";
import express from "express";
import morgan from "morgan";
import errorMiddlware from "./middlewares/error.middleware.js";
import courseRoutes from "./routes/course.Routes.js";
import miscRoutes from "./routes/miscellanous.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import userRoutes from "./routes/user.Routes.js";
import bodyParser from "body-parser";

config();

const app = express();

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

const allowedOrigins = [
  "https://ednova.netlify.app",
  "http://localhost:5173",
  // add more domains here
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps, curl, postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: ["Content-Type", "Authorization"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true,
  })
);


app.use(cookieParser());

app.use(morgan("dev"));

app.use("/ping", function (_req, res) {
  res.send("Pong");
});

app.use(
  "/api/v1/payment/webhook",
  bodyParser.raw({ type: "application/json" }) // 👈 needed for Stripe webhook verification
);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/course", courseRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1", miscRoutes);
app.all("*", (_req, res) => {
  res.status(404).send("OOPS!!  404 page not found ");
});

app.use(errorMiddlware);

export default app;

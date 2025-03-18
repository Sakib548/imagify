import cors from "cors";
import "dotenv/config";
import express from "express";
import connectDB from "./config/mongodb.js";
import imageRouter from "./routes/imageRoutes.js";
import userRouter from "./routes/userRoutes.js";

const PORT = process.env.PORT || 4000;

const app = express();

const allowedOrigins = [
  /https:\/\/.*\.vercel\.app$/, // Allow all Vercel preview domains
  "https://client-tan-mu.vercel.app", // Production frontend URL
  "http://localhost:3000", // Local development
];

// Configure CORS options
const corsOptions = {
  origin: (origin, callback) => {
    if (
      !origin ||
      allowedOrigins.some((allowedOrigin) => {
        if (typeof allowedOrigin === "string") {
          return origin === allowedOrigin;
        } else if (allowedOrigin instanceof RegExp) {
          return allowedOrigin.test(origin);
        }
        return false;
      })
    ) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Preflight support
app.use(express.json());

app.use((req, res, next) => {
  console.log("Incoming Request:", req.method, req.url);
  console.log("Headers:", req.headers);
  next();
});

await connectDB();

app.use("/api/user", userRouter);
app.use("/api/image", imageRouter);

app.get("/", (req, res) => {
  res.send("API Working Fine");
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

import cors from "cors";
import "dotenv/config";
import express from "express";
import connectDB from "./config/mongodb.js";
import imageRouter from "./routes/imageRoutes.js";
import userRouter from "./routes/userRoutes.js";

const PORT = process.env.PORT || 4000;

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:3000", // For local development
];

// Configure CORS options
const corsOptions = {
  origin: allowedOrigins, // Frontend origin
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Allowed methods
  allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
  credentials: true, // If using cookies/authentication
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Preflight support
app.use(express.json());

await connectDB();

app.use("/api/user", userRouter);
app.use("/api/image", imageRouter);

app.get("/", (req, res) => {
  res.send("API Working Fine");
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

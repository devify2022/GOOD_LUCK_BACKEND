import express from "express";
import cors from "cors";
import errorHandler from "./middlewares/errorMiddleware.js";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));

// Import routes
import userRoutes from "./routes/auth/user.routes.js";
import astrologerRoutes from "./routes/astrologer.route.js";
import datingRoutes from "./routes/dating.routes.js";

// Use routes
app.use("/good_luck/api/v1/auth", userRoutes);
app.use("/good_luck/api/v1/astrologer", astrologerRoutes);
app.use("/good_luck/api/v1/dating", datingRoutes);

// Apply error handler as the last middleware
app.use(errorHandler);

export { app };

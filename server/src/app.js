import "./configs/env.js";
import express from "express";
import cors from "cors"
import helmet from "helmet";
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173/",
    credentials: true
}))
app.use(helmet());
app.use(express.json())
app.use(express.urlencoded())
app.use(express.static("public"))
app.use(cookieParser())

import userRouter from "./routes/user.route.js"
import companyRouter from "./routes/company.route.js"
import errorHandler from "./middlewares/error.middleware.js";

app.use("/api/v1/users", userRouter)
app.use("/api/v1/companies", companyRouter)

app.use(errorHandler)

app.get("/", (req, res) => {
    res.json({ message: "Welcome to the Job Portal API" });
});

export default app;
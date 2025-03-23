import express, { urlencoded } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import connectDB from "./utils/db.js";
import userRoute from "./routes/userRoute.js";
import postRoute from "./routes/postRoute.js";
import messageRoute from "./routes/messageRoute.js";
import {app,server} from "./socket/socket.js"

dotenv.config({});



const PORT = process.env.PORT || 3000;


app.use(express.json());
app.use(cookieParser());
app.use(urlencoded({ extended: true }));


app.get("/", (_, res) => {
  return res.status(200).json({
    message: "I am coming from backend",
    success: true,
  });
});

//middlewares


const corsOptions = {
  origin: "http://localhost:5173",
  credentials: true,
};
app.use(cors(corsOptions));

//we will get api here
app.use("/api/v1/user", userRoute);
app.use("/api/v1/post", postRoute);
app.use("/api/v1/message", messageRoute);

server.listen(PORT, () => {
  connectDB();
  console.log(`Server listen at port ${PORT}`);
});

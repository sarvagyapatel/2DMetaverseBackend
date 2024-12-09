import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
    cors({
        origin: 'https://www.2dmetaverse.sarvagyapatel.in/',
        credentials: true,
    })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

import userRouter from "./routes/user.routes"
import roomRouter from "./routes/room.routes"

app.use("/api/v1/users", userRouter);
app.use("/api/v1/room", roomRouter)

export { app }
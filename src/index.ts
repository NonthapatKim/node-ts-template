import express, { Application } from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import path from "path";

var cors = require('cors')

import exampleRouter from "./routes/index"

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 8001;

app.use(cors())
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

const publicPath = path.join(__dirname, "..", "public");

app.use("/public", express.static(publicPath));

app.use(express.json());

app.use("/", exampleRouter);

app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});

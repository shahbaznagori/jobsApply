import express from "express";
import routes from "./routes";
import errorHandler from "./common/utils/middleware/error.handler";

const app = express();

app.use(express.json());

app.use("/weapplyjobs", routes);
app.use(errorHandler);



export default app;
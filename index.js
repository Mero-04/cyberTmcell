const express = require('express');
const app = express();
require('dotenv').config();
const port = process.env.PORT;
const morgan = require('morgan')
const cors = require("cors");
const sequelize = require('./data/db');
const helmet = require("helmet");
// const apilimiter = require("./middlewares/rateLimit");
// app.use("/api", apilimiter)


app.use(express.json());
app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 }))
app.use(cors());
app.use(helmet());
app.use(morgan('tiny'));
app.use('/api', express.static('public'))


const AuthRouter = require("./routes/auth.router")

app.use("/api/v1/auth", AuthRouter);


app.listen(port, () => {
    console.log(`server listening on port ${port}`);
})
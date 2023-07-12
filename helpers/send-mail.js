const nodemailer = require("nodemailer");

let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user:process.env.EMAIL_USER,
        pass: process.env.SENDING_PASSWORD
    },
});


module.exports = transporter;
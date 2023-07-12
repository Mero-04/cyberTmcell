const express = require("express");
const router = express.Router();
const fs = require("fs");
const ejs = require("ejs");
const pdf = require("html-pdf");
const path = require("path");
const emailService = require("../helpers/send-mail");

global.createPDFFile = function (htmlString, fileName, callback) {
    var options = {
        format: "A4",
        orientation: "landscape",
        timeout: 600000,
    };
    pdf.create(htmlString, options).toFile("./public/pdf/" + fileName, function (err, data) {
        if (err) return console.log(err);
        return callback(null, "test" + ":" + "5601" + "/pdf/" + fileName);
    });
};

// router.get("/", async (req, res) => {
//     let data = fs.readFileSync(`./logs/eve.json`, "utf-8");
//     let info = data.toString().split("\n");
//     var json = [];
//     info.map(function (record) {
//         var array = JSON.parse(`[${record.replace(/\}\n\{/g, "},{")}]`);
//         json.push(array[0]);
//     });

//     res.json({json});
// });

router.get("/", async (req, res) => {
    let data = fs.readFileSync(`./logs/fast.log`, "utf-8");
    let info = data.toString().split("\n");
    var array = JSON.parse(info);
    res.json({ array })

});

// [
//     {
//         time: "07/09/2023-00:00:33.672568",
//         alert: "SURICATA STREAM excessive retransmissions",
//         protocol: "TCP",
//         src_ip: "216.250.10.170",
//         src_port: "443",
//         destination_ip: "93.171.222.169",
//         destination_port: "34066"
//     }
// ]

router.get("/test", async (req, res) => {
    console.log(new Date().toLocaleString("en-US", { timeZone: "Asia/Ashgabat" }));
    ejs.renderFile(path.join(__dirname, "../views/", "hasabat.ejs"), (err, data) => {
        if (err) {
            res.send(err);
        } else {
            global.createPDFFile(data, "t123.pdf", async function (err, result) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("PDF URL ADDED.");
                    res.send(result);
                    var maillist = ["mr.akynyaz29@gmail.com"];
                    await emailService.sendMail({
                        from: process.env.EMAIL_USER,
                        to: maillist,
                        subject: "TMCELL - Kiber hasabat taze",
                        html: "<b>TMCELL Hasabat Iýul aýy.</b>",
                        attachments: [
                            {
                                filename: "Hasabat.pdf",
                                path: "./public/pdf/t123.pdf",
                                contentType: "application/pdf",
                            },
                        ],
                    });
                    console.log("ended creating mail");
                    let json = { json: "test" };
                    console.log(json);
                }
            });
        }
    });
});

// islemeli haydan

module.exports = router;
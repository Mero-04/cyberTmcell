const express = require("express");
const router = express.Router();
const fs = require("fs");
const ejs = require("ejs");
const pdf = require("html-pdf");
const path = require("path");
const emailService = require("../helpers/send-mail");
const moment = require("moment");
var LineByLineReader = require('line-by-line');

const atlar = [
    { id: "01", month: "Ýanwar" },
    { id: "02", month: "Fewral" },
    { id: "03", month: "Mart" },
    { id: "04", month: "Aprel" },
    { id: "05", month: "Maý" },
    { id: "06", month: "Iýun" },
    { id: "07", month: "Iýul" },
    { id: "08", month: "Awgust" },
    { id: "09", month: "Sentýabr" },
    { id: "10", month: "Oktýabr" },
    { id: "11", month: "Noýabr" },
    { id: "12", month: "Dekabr" },
];

global.createPDFFile = function (htmlString, fileName, callback) {
    var options = {
        format: "A4",
        orientation: "landscape",
        timeout: 6000000,
        renderDelay: 5000,
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


    var info = [];

    const test = () => {
        lr = new LineByLineReader('./logs/fast.log');

        lr.on('error', function (err) {
            // 'err' contains error object
        });

        lr.on('line', function (line) {
            info.push(line)
        });

        lr.on('end', function () {

        });
    }

    test();
    setTimeout(() => {


        // let data = fs.readFileSync(`./logs/fast.log`);
        // let info = data.toString().split("\n");
        // console.log(info)
        var alerts = [];
        for (i = 0; i < info.length; i++) {
            let text = info[i];

            const day = text.substring(3, 5);

            const time = text.substring(0, 25);
            text = text.substring(34);

            const hex = text.substring(0, 11);
            text = text.substring(13);

            const alert = text.substring(0, text.indexOf("[**]") - 1);
            text = text.substring(text.indexOf("{") + 1);

            const protocol = text.substring(0, text.indexOf("}"));
            text = text.substring(text.indexOf("}") + 2);

            const destination_ip = text.substring(0, text.indexOf(":"));
            text = text.substring(text.indexOf(":") + 1);

            const destination_port = text.substring(0, text.indexOf("->") - 1);
            text = text.substring(text.indexOf("->") + 3);

            const src_ip = text.substring(0, text.indexOf(":"));
            text = text.substring(text.indexOf(":") + 1);

            const src_port = text.substring(0);

            let obj = {
                day: day,
                time: time,
                hex: hex,
                alert: alert,
                protocol: protocol,
                destination_ip: destination_ip,
                destination_port: destination_port,
                src_ip: src_ip,
                src_port: src_port,
            };
            alerts.push(obj);
        }

        const month = moment().format("MM-DD-YYYY hh:mm");

        const thisMonthName = atlar.filter((obj) => {
            return obj.id === month.slice(0, 2);
        });

        let result = alerts.filter(function (item) {
            return typeof item.time == "string" && item.time.startsWith(month.slice(0, 2) + "/");
            // return typeof item.time == "string" && item.time.startsWith("06/");
        });

        const data1 = Object.values(
            result.reduce((map, el) => {
                map[el.day]
                    ? map[el.day].count++
                    : (map[el.day] = {
                        ...el,
                        count: 1,
                    });
                return map;
            }, {})
        ).sort((a, b) => a.day - b.day);

        const data2 = Object.values(
            result.reduce((map, el) => {
                map[el.alert]
                    ? map[el.alert].count++
                    : (map[el.alert] = {
                        ...el,
                        count: 1,
                    });
                return map;
            }, {})
        );

        const data3 = Object.values(
            result.reduce((map, el) => {
                map[el.destination_ip]
                    ? map[el.destination_ip].count++
                    : (map[el.destination_ip] = {
                        ...el,
                        count: 1,
                    });
                return map;
            }, {})
        );

        const gundelikGrafikDays = data1.map((data) => {
            if (data.day.charAt(0) === "0") {
                return parseInt(data.day.substring(1));
            }
            return parseInt(data.day);
        });

        const gundelikGrafikDaysCount = data1.map((data) => {
            return data.count;
        });

        const gundelikGrafikAtly1 = data1
            .map((data) => {
                if (data.day.charAt(0) === "0") {
                    return {
                        day: thisMonthName[0].month + " " + data.day.substring(1),
                        count: data.count,
                    }
                }
                return {
                    day: thisMonthName[0].month + " " + data.day,
                    count: data.count,
                };
            })
            .sort((a, b) => b.day - a.day)
            .slice(0, 10);

        const gundelikGrafikAtly2 = data1
            .map((data) => {
                return {
                    day: thisMonthName[0].month + " " + data.day,
                    count: data.count,
                };
            })
            .sort((a, b) => b.day - a.day)
            .slice(10, 20);

        const gundelikGrafikAtly3 = data1
            .map((data) => {
                return {
                    day: thisMonthName[0].month + " " + data.day,
                    count: data.count,
                };
            })
            .sort((a, b) => b.day - a.day)
            .slice(20);

        const attacks = data2
            .map((data) => {
                return {
                    name: data.alert,
                    count: data.count,
                };
            })
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);


        const attacksName = attacks.map((data) => {
            return data.name;
        });

        const attacksCount = attacks.map((data) => {
            return data.count;
        });


        const ip = data3
            .map((data) => {
                return {
                    ip: data.destination_ip,
                    count: data.count,
                };
            })
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        const ip2 = data3
            .map((data) => {
                return {
                    ip: data.destination_ip,
                    count: data.count,
                };
            })
            .sort((a, b) => b.count - a.count)
            .slice(10, 20);

        const gosmaca = {};

        gosmaca["all_attacks"] = result.length
        gosmaca["this_month"] = thisMonthName[0].month + " " +  result[0].time.slice(6, 10)

        const allData = {
            gundelikGrafikDays,
            gundelikGrafikDaysCount,
            gundelikGrafikAtly1,
            gundelikGrafikAtly2,
            gundelikGrafikAtly3,
            attacks,
            ip,
            ip2,
            attacksName,
            attacksCount,
            gosmaca
        };

        // res.render('hasabat', {
        //     gundelikGrafikAtly: gundelikGrafikAtly,
        //     gundelikGrafik: gundelikGrafik,
        //     attacks: attacks,
        //     ip: ip,
        //     ip2: ip2
        // })

        ejs.renderFile(
            path.join(__dirname, "../views/", "hasabat.ejs"),
            {
                gundelikGrafikAtly1: gundelikGrafikAtly1,
                gundelikGrafikAtly2: gundelikGrafikAtly2,
                gundelikGrafikAtly3: gundelikGrafikAtly3,
                gundelikGrafikDays: gundelikGrafikDays,
                gundelikGrafikDaysCount: gundelikGrafikDaysCount,
                attacks: attacks,
                attacksName: attacksName,
                attacksCount: attacksCount,
                ip: ip,
                ip2: ip2,
                gosmaca: gosmaca
            },
            (err, data) => {
                if (err) {
                    res.send(err);
                } else {
                    global.createPDFFile(data, month.slice(0, 2) + ".pdf", async function (err, result) {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log("PDF URL ADDED.");
                        }
                    });
                }
            }
        );

        res.json({ allData });
    }, 10000);
});

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

module.exports = router;
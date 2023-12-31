const express = require("express");
const router = express.Router();
const fs = require("fs");
const ejs = require("ejs");
// const pdf = require("html-pdf");

const puppeteer = require("puppeteer");
const hb = require("handlebars");

const path = require("path");
const emailService = require("../helpers/send-mail");
const moment = require("moment");
var LineByLineReader = require("line-by-line");
const {isAdmin} = require("../middlewares/authMiddleware");

const {Datacyber} = require("../models/model");

const atlar = [
    {id: "01", month: "Ýanwar"},
    {id: "02", month: "Fewral"},
    {id: "03", month: "Mart"},
    {id: "04", month: "Aprel"},
    {id: "05", month: "Maý"},
    {id: "06", month: "Iýun"},
    {id: "07", month: "Iýul"},
    {id: "08", month: "Awgust"},
    {id: "09", month: "Sentýabr"},
    {id: "10", month: "Oktýabr"},
    {id: "11", month: "Noýabr"},
    {id: "12", month: "Dekabr"},
];

global.createPDFFile = function (htmlString, fileName, callback) {
    var options = {
        format: "A4",
        orientation: "landscape",
        timeout: 6000000,
        renderDelay: 10000,
    };
    pdf.create(htmlString, options).toFile("./public/pdf/" + fileName, function (err, data) {
        if (err) return console.log(err);
        return callback(null, "/pdf/" + fileName);
    });
};

router.get("/", async (req, res) => {
    var info = [];

    const test = () => {
        lr = new LineByLineReader("./logs/test.log");

        lr.on("error", function (err) {
            res.json({status: false});
        });

        lr.on("line", function (line) {
            info.push(line);
        });

        lr.on("end", async function () {
            // let data = fs.readFileSync(`./logs/fast.log`);
            // let info = data.toString().split("\n");
            // console.log(info)
            var alerts = [];
            for (i = 0; i < info.length; i++) {
                let text = info[i];

                const day = text.substring(3, 5);

                const time = text.substring(0, 25);
                text = text.substring(text.indexOf("[Classification:") + 17);

                const alert = text.substring(0, text.indexOf("]"));
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
                    alert: alert,
                    protocol: protocol,
                    destination_ip: destination_ip,
                    destination_port: destination_port,
                    src_ip: src_ip,
                    src_port: src_port,
                };
                alerts.push(obj);
            }

            const month = moment().subtract(1, "months").format("MM-DD-YYYY");
            const year = moment().subtract(1, "months").format("YYYY");

            const thisMonthName = atlar.filter((obj) => {
                return obj.id == month.slice(0, 2);
            });

            let result = alerts.filter(function (item) {
                return typeof item.time == "string" && item.time.startsWith(month.slice(0, 2) + "/");
                // return typeof item.time == "string" && item.time.startsWith("06/");
            });

            if (result[0] === undefined) {
                res.json({
                    status: false,
                    error: "Maglumat yok!",
                });
                return;
            }

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
                        };
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
            gosmaca["all_attacks"] = result.length;
            gosmaca["this_month"] = thisMonthName[0].month + " " + result[0].time.slice(6, 10);

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
                gosmaca,
            };

            var database_Data = JSON.stringify(allData);

console.log("EJS RENDER BEFORE");
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
                    gosmaca: gosmaca,
                },
                (err, data) => {
                    if (err) {
                        res.json({status: false});
                    } else {
			async function renderrr() {
			const browser = await puppeteer.launch({
    args: ['--no-sandbox'],
  });
			const page = await browser.newPage();
			await page.setContent(data);
			await page.pdf({path:"./public/pdf/" + "TMCELL - kiber hüjümleriň hasabaty " + thisMonthName[0].month + " " + year + ".pdf",format:"A4", landscape:true, timeout: 100000});
			await browser.close();
}
renderrr();
console.log("ISLEDIIII!");

                       // var options = {
			//    format: "A4",
                        //    orientation: "landscape",
                        //    timeout: 6000000,
                        //    renderDelay: 10000,
                        // };
			// const createOptions = process.env.PHANTOM_PATH ? {...options, phantomPath: process.env.PHANTOM_PATH} : options;
                        // pdf.create(data, createOptions).toFile("./public/pdf/" + "TMCELL - kiber hüjümleriň hasabaty " + thisMonthName[0].month + " " + year + ".pdf", async function (err, data) {
                        //     if (err) {
                        //        console.log(err);
                        //        res.json({status: false});
                        //    } else {

//                                var maillist = ["mr.akynyaz29@gmail.com"];
//                                await emailService
//                                    .sendMail({
//                                        from: process.env.EMAIL_USER,
//                                        to: maillist,
//                                        subject: "TMCELL - Kiber hasabat " + thisMonthName[0].month + " " + year,
//                                        html: "<b>TMCELL Hasabat " + thisMonthName[0].month + " " + year + "</b>",
//                                        attachments: [
//                                            {
 //                                               filename: "TMCELL - kiber hüjümleriň hasabaty " + thisMonthName[0].month + " " + year + ".pdf",
//                                                path: "./public/pdf/TMCELL - kiber hüjümleriň hasabaty " + thisMonthName[0].month + " " + year + ".pdf",
//                                                contentType: "application/pdf",
//                                            },
//                                        ],
//                                    })
//                                    .then(async () => {
//                                        await Datacyber.create({
 //                                           months: month,
//                                            month_name: thisMonthName[0].month,
//                                            data: database_Data,
//                                        })
//                                            .then(() => {
//                                                res.json({status: true});
//                                            })
//                                            .catch((error) => {
//                                                res.json({status: false});
//                                            });
//                                    });
//                                console.log("Mail sent and inserted to db!");



//                            }
  //                      });
                    }
                }
            );
        });
    };

    test();
});

router.get("/data/:month", isAdmin, async (req, res) => {
    const month = req.params.month;
    await Datacyber.findAll({where: {months: month}}).then((data) => {
        res.json({data: data});
    });
});

router.get("/month", isAdmin, async (req, res) => {
    await Datacyber.findAll({attributes: {exclude: ["data", "createdAt", "updatedAt"]}}).then((data) => {
        res.json({data: data});
    });
});

router.get("/month_current", isAdmin, async (req, res) => {
    var info = [];

    const test = () => {
        lr = new LineByLineReader("./logs/fast.log");

        lr.on("error", function (err) {
            res.json({status: false});
        });

        lr.on("line", function (line) {
            info.push(line);
        });

        lr.on("end", async function () {
            // let data = fs.readFileSync(`./logs/fast.log`);
            // let info = data.toString().split("\n");
            // console.log(info)
            var alerts = [];
            for (i = 0; i < info.length; i++) {
                let text = info[i];

                const day = text.substring(3, 5);

                const time = text.substring(0, 25);
                text = text.substring(text.indexOf("[Classification:") + 17);

                const alert = text.substring(0, text.indexOf("]"));
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
                    alert: alert,
                    protocol: protocol,
                    destination_ip: destination_ip,
                    destination_port: destination_port,
                    src_ip: src_ip,
                    src_port: src_port,
                };
                alerts.push(obj);
            }

            const month = moment().format("MM-DD-YYYY");

            const thisMonthName = atlar.filter((obj) => {
                return obj.id == month.slice(0, 2);
            });

            let result = alerts.filter(function (item) {
                return typeof item.time == "string" && item.time.startsWith(month.slice(0, 2) + "/");
                // return typeof item.time == "string" && item.time.startsWith("06/");
            });

            if (result[0] === undefined) {
                res.json({status: false, error: "Maglumat yok!"});
                return;
            }

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
                        };
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

            gosmaca["all_attacks"] = result.length;
            gosmaca["this_month"] = thisMonthName[0].month + " " + result[0].time.slice(6, 10);

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
                gosmaca,
            };

            var database_Data = JSON.stringify(allData);

            const sss = [
                {
                    months: month,
                    month_name: thisMonthName[0].month,
                    data: database_Data,
                },
            ];
            res.json({
                data: sss,
            });
        });
    };

    test();
});

module.exports = router;

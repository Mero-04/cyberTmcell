const express = require("express");
const router = express.Router();
const fs = require("fs");
const ejs = require("ejs");
const pdf = require("html-pdf");
const path = require("path");
const emailService = require("../helpers/send-mail");
const moment = require("moment");
var LineByLineReader = require("line-by-line");
const {isAdmin} = require("../middlewares/authMiddleware");

const {Datacyber, DataWeek} = require("../models/model");

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
        if (err) return false;
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
                // return typeof item.time == "string" && item.time.startsWith("08/");
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
                        var options = {
                            format: "A4",
                            orientation: "landscape",
                            timeout: 6000000,
                            renderDelay: 10000,
                        };
                        console.log("PDF START ");
                        pdf.create(data, options).toFile("./public/pdf/" + "TMCELL - kiber hüjümleriň hasabaty " + thisMonthName[0].month + " " + year + ".pdf", async function (err, data) {
                            if (err) return console.log(err);
                            console.log("MAIL START");
                            var maillist = ["mr.akynyaz29@gmail.com", "meromuhammedov44@gmail.com"];
                            await emailService
                                .sendMail({
                                    from: process.env.EMAIL_USER,
                                    to: maillist,
                                    subject: "TMCELL - Kiber hasabat " + thisMonthName[0].month + " " + year,
                                    html: "<b>TMCELL Hasabat " + thisMonthName[0].month + " " + year + "</b>",
                                    attachments: [
                                        {
                                            filename: "TMCELL - kiber hüjümleriň hasabaty " + thisMonthName[0].month + " " + year + ".pdf",
                                            path: "./public/pdf/TMCELL - kiber hüjümleriň hasabaty " + thisMonthName[0].month + " " + year + ".pdf",
                                            contentType: "application/pdf",
                                        },
                                    ],
                                })
                                .then(async () => {
                                    await Datacyber.create({
                                        months: month,
                                        month_name: thisMonthName[0].month,
                                        data: database_Data,
                                    })
                                        .then(() => {
                                            res.json({status: true});
                                        })
                                        .catch((error) => {
                                            res.json({status: false});
                                        });
                                });
                            console.log("Mail sent and inserted to db!");
                        });
                    }
                }
            );
        });
    };

    test();
});

router.get("/yarrak", async (req, res) => {
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
            const year = moment().subtract(1, "months").format("YYYY");

            const thisMonthName = atlar.filter((obj) => {
                return obj.id == month.slice(0, 2);
            });

            let result = alerts.filter(function (item) {
                return typeof item.time == "string" && item.time.startsWith(month.slice(0, 2) + "/");
                // return typeof item.time == "string" && item.time.startsWith("08/");
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
            res.render("../views/hasabat", {
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
            });
        });
    };

    test();
});

router.get("/testt", async (req, res) => {
    const last_week = moment().subtract(7, "d").format("MM/DD");
    const last_week1 = moment().subtract(6, "d").format("MM/DD");
    const last_week2 = moment().subtract(5, "d").format("MM/DD");
    const last_week3 = moment().subtract(4, "d").format("MM/DD");
    const last_week4 = moment().subtract(3, "d").format("MM/DD");
    const last_week5 = moment().subtract(2, "d").format("MM/DD");
    const last_week6 = moment().subtract(1, "d").format("MM/DD");
    const last_week7 = moment().format("MM/DD");
    res.json({last_week, last_week1, last_week2, last_week3, last_week4, last_week5, last_week6, last_week7});
});

router.get("/week", async (req, res) => {
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

            const day7 = moment().subtract(7, "d").format("MM/DD");
            const day6 = moment().subtract(6, "d").format("MM/DD");
            const day5 = moment().subtract(5, "d").format("MM/DD");
            const day4 = moment().subtract(4, "d").format("MM/DD");
            const day3 = moment().subtract(3, "d").format("MM/DD");
            const day2 = moment().subtract(2, "d").format("MM/DD");
            const day1 = moment().subtract(1, "d").format("MM/DD");

            // const thisMonthName = atlar.filter((obj) => {
            //     return obj.id == month.slice(0, 2);
            // });

            var dayz = [day7, day6, day5, day4, day3, day2, day1];
            console.log(dayz);
            var result = [];
            alerts.filter(function (item) {
                dayz.forEach(function (i) {
                    if (typeof item.time == "string" && item.time.startsWith(i)) {
                        result.push(item);
                    }
                });
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
                            // day: thisMonthName[0].month + " " + data.day.substring(1),
                            count: data.count,
                        };
                    }
                    return {
                        // day: thisMonthName[0].month + " " + data.day,
                        count: data.count,
                    };
                })
                .sort((a, b) => b.day - a.day)
                .slice(0, 10);

            const gundelikGrafikAtly2 = data1
                .map((data) => {
                    return {
                        // day: thisMonthName[0].month + " " + data.day,
                        count: data.count,
                    };
                })
                .sort((a, b) => b.day - a.day)
                .slice(10, 20);

            const gundelikGrafikAtly3 = data1
                .map((data) => {
                    return {
                        // day: thisMonthName[0].month + " " + data.day,
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
            // gosmaca["this_month"] = thisMonthName[0].month + " " + result[0].time.slice(6, 10);

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
                path.join(__dirname, "../views/", "week.ejs"),
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
                        var options = {
                            format: "A4",
                            orientation: "landscape",
                            timeout: 6000000,
                            renderDelay: 10000,
                        };
                        console.log("PDF START ");
                        pdf.create(data, options).toFile("./public/pdf/" + "TMCELL - kiber hüjümleriň hasabaty " + day7 + " - " + day1 + ".pdf", async function (err, data) {
                            if (err) return console.log(err);
                            console.log("MAIL START");
                            var maillist = ["mr.akynyaz29@gmail.com"];
                            await emailService
                                .sendMail({
                                    from: process.env.EMAIL_USER,
                                    to: maillist,
                                    subject: "TMCELL - Kiber hasabat " + day7 + " - " + day1,
                                    html: "<b>TMCELL Hasabat " + day7 + " - " + day1 + "</b>",
                                    attachments: [
                                        {
                                            filename: "TMCELL - kiber hüjümleriň hasabaty " + day7 + " - " + day1 + ".pdf",
                                            path: "./public/pdf/TMCELL - kiber hüjümleriň hasabaty " + day7 + " - " + day1 + ".pdf",
                                            contentType: "application/pdf",
                                        },
                                    ],
                                })
                                .then(async () => {
                                    await DataWeek.create({
                                        week: day7 + " - " + day1,
                                        data: database_Data,
                                    })
                                        .then(() => {
                                            res.json({status: true});
                                        })
                                        .catch((error) => {
                                            res.json({status: false});
                                        });
                                });
                            console.log("Mail sent and inserted to db!");
                        });
                    }
                }
            );
        });
    };

    test();
});

router.get("/data", isAdmin, async (req, res) => {
    const month = req.query.month;
    await Datacyber.findAll({where: {months: month}}).then((data) => {
        res.json({data: data});
    });
});

router.get("/month", isAdmin, async (req, res) => {
    await Datacyber.findAll({attributes: {exclude: ["data", "createdAt", "updatedAt"]}}).then((data) => {
        res.json({data: data});
    });
});

router.get("/weeks", async (req, res) => {
    await DataWeek.findAll({attributes: {exclude: ["data", "createdAt", "updatedAt"]}}).then((data) => {
        res.json({data: data});
    });
});

router.get("/salam", async (req, res) => {
    const week = req.query.week;
    await DataWeek.findAll({where: {week: week}}).then((data) => {
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

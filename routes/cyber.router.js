const express = require("express");
const router = express.Router();
const fs = require("fs");

router.get("/", async (req, res) => {
    let data = fs.readFileSync(`./logs/eve.json`, "utf-8");
    let info = data.toString().split("\n");
    var json = [];
    info.map(function (record) {
        var array = JSON.parse(`[${record.replace(/\}\n\{/g, "},{")}]`);
        json.push(array[0]);
    });

    res.json({json});
});

// islemeli haydan

module.exports = router;
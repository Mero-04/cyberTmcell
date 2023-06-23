const express = require('express');
const router = express.Router();
const fs = require('fs');

router.get("/", async (req, res) => {
  var array = [];
  fs.readFile("./logs/json_log.log", (file) => {
    const string = file.toString()
    const end = '[' + string.slice(0, -2) + ']';
    const logs = JSON.parse(end)
    res.json({ logs })
  });
});


module.exports = router;
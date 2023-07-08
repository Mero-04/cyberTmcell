const express = require('express');
const router = express.Router();
const fs = require('fs');

router.get("/", async (req, res) => {
  fs.readFile("./logs/eve.json",  (file) => {
    const myJSON = JSON.stringify(file);
    


    res.json({ myJSON })

  });

});

    // const end = '[' + string.slice(0, -2) + ']';
    // const logs = JSON.parse(end)

module.exports = router;
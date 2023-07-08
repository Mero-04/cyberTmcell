const express = require('express');
const router = express.Router();
const { Admin, Worker } = require('../models/model');
const { sign } = require("jsonwebtoken");
const bcrypt = require('bcrypt');

router.post("/rootman", async (req, res) => {
  const { email, password } = req.body;
  await Admin.findOne({ where: { email: email } })
    .then(admin => {
      if (!admin || admin.email !== email) {
        res.json({ error: "Ulanyjynyň nomeri ýa-da açar sözi nädogry" })
      } else {
        var passwordIsValid = bcrypt.compareSync(password, admin.password)
        if (!passwordIsValid) {
          res.json({ error: "Ulanyjynyň nomeri ýa-da açar sözi nädogry" })
        } else {
          res.json({
            token: sign({ id: admin.id, role: admin.role }, process.env.JWT_key, {
              expiresIn: '24h'
            })
          });
        }
      }
    })
});


module.exports = router;
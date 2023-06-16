const rateLimit = require("express-rate-limit");
const allowList = ["::1"];

const apilimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: (req, res) => {
        if (req.url === req.url === "/auth/rootman" || req.url === "/auth/login") return 5
        else return 15
    },
    message: async (req, res) => {
		res.json( "Sizin IP adresiniz bloklandy!")
	},
    skip: (req, res) => allowList.includes(req.ip),
    standardHeaders: true,
    legacyHeaders: false
})

module.exports = apilimiter;
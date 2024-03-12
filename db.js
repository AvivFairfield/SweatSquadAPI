const Pool = require("pg").Pool;

const pool = new Pool({
	user: "postgres",
	password: "ss123",
	database: "postgres",
	host: "84.229.46.127",
	port: 5432,
});

module.exports = {
	pool: pool,
};

const Pool = require("pg").Pool;

const pool = new Pool({
	user: "postgres",
	password: "ss123",
	database: "postgres",
	host: "176.230.127.94",
	port: 5432,
});

module.exports = {
	pool: pool,
};

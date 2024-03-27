//This file configures the database connection for the application
//using the pg module, specifically utilizing connection pooling
//for efficient management of database connections

const Pool = require("pg").Pool;

const pool = new Pool({
	user: "postgres", //Credentials for database access
	password: "ss123",
	database: "postgres", //Specifies which database to connect to within PostgreSQL.
	host: "176.230.127.53", //The network address and port where the PostgreSQL server is accessible
	port: 5432,
});

module.exports = {
	pool: pool,
};

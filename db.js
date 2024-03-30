//This file configures the database connection for the application
//using the pg module, specifically utilizing connection pooling
//for efficient management of database connections

const Pool = require("pg").Pool;

const pool = new Pool({
	user: "user", //Credentials for database access
	password: "hVXDoumXOKmXliBr5SvEyS6s3SwtHV0g",
	database: "a8_pg", //Specifies which database to connect to within PostgreSQL.
	host: "dpg-co3tnda1hbls73bmjkog-a.frankfurt-postgres.render.com", //The network address and port where the PostgreSQL server is accessible
	port: 5432,
});

module.exports = {
	pool: pool,
};

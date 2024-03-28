//This file configures the database connection for the application
//using the pg module, specifically utilizing connection pooling
//for efficient management of database connections

const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
	connectionString:
		"postgres://default:vRD7TUIXmpB8@ep-long-morning-a2lrk5g9-pooler.eu-central-1.aws.neon.tech:5432/verceldb?sslmode=require",
});

module.exports = {
	pool: pool,
};

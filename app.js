//This server application is built using the Express framework to manage backend operations
//for a fitness application named "SweatSquad". It facilitates user authentication,
//workout session management, and user preferences updates through various endpoints.
//The application manages data interactions through a PostgreSQL database.

//Importing necessary libraries
const express = require("express"); //Express framework
const cors = require("cors"); //Middleware to enable CORS (Cross-Origin Resource Sharing)
const jwt = require("jsonwebtoken"); //Library to work with JSON Web Tokens for authentication
const app = express(); //Creating an instance of express
const port = process.env.PORT || 5000; //Setting the port number, either from environment variables or default to 5000

const secretjwt = "baguette"; //Defining a secret key for JWT

//Middleware to parse JSON bodies
//This allows us to easily access request body data
app.use(express.json());

//Importing the database connection pool
const { pool } = require("./db");

//CORS options to allow requests from the specified origin
var corsOptions = {
	origin: "http://localhost:5000",
	optionsSuccessStatus: 200, //For legacy browser support
};

app.use(cors());

//Test route to check if the server is running and can connect to the backend
app.get("/", async (req, res) => {
	res.send("Test Worked, Connected to the backend.");
});

// app.post("/get-training-data")

//Route to handle user login
app.post("/login", async (req, res) => {
	try {
		const { email, password } = req.body; //Extracting email and password from request body

		console.log(email);

		//Checking if both email and password were provided
		if (!email || !password) {
			res.json({
				message: "You must provide an email & password",
				status: "failed",
			});
			return;
		}

		//Querying the database for a user that matches the provided email and password
		const { rows } = await pool.query(
			"SELECT * FROM public.users WHERE email = $1 and password = $2",
			[email, password]
		);

		//Check if a user was found
		const userExists = rows.length > 0;

		const user = rows[0]; //The found user

		if (!userExists) {
			res.json({
				message: "Invalid email or password",
				status: "failed",
			});
			return;
		}
		//Generating a JWT for the user
		const token = jwt.sign(
			{
				id: user.id, //Including user details in the token
				email: user.email,
				first_name: user.first_name,
				last_name: user.last_name,
				password: user.password,
			},
			secretjwt, //Secret key for signing the token
			{
				expiresIn: "8h", //Token expires in 8 hours
			}
		);

		console.log(`token: ${token}`);
		//Responding with the generated token and user details
		res.json({
			status: "success",
			token: token,
			message: `Welcome ${user.first_name} ${user.last_name}, Redirecting to homepage...`,
			email: user.email,
			first_name: user.first_name,
			last_name: user.last_name,
			password: user.password,
		});
	} catch (login_err) {
		console.log(`login error: ${login_err}`);

		res.json({
			message: "Error trying to login",
			status: "failed",
		});
		return;
	}
});

//Route to verify the authenticity of a JWT
app.post("/api/auth/verify", async (req, res) => {
	try {
		const { token } = req.body;
		//Checking if token was provided
		if (!token || token === "") {
			return res.status(401).json({ message: "Token is missing" });
		}

		//Verify JWT token
		const decoded = jwt.verify(token, secretjwt);
		//Responding with the decoded token details
		res.status(200).json({
			status: "success",
			message: `Token is valid for ${
				decoded.first_name + " " + decoded.last_name
			}`,
			first_name: decoded.first_name,
			last_name: decoded.last_name,
			email: decoded.email,
			password: decoded.password,
		});
	} catch (err) {
		// console.log(err);
		res.json({
			status: "failed",
			message: `Token is invalid`,
		});
	}
});

//Route for saving a workout session
app.post("/saveworkout", async (req, res) => {
	try {
		const { email, trainingType, location, duration, workoutDate } =
			req.body;

		console.log(email, trainingType, location, duration, workoutDate);
		//sends a SQL command to the db to insert the extracted workout session details into the public.active_workouts table.
		await pool.query(
			`
			INSERT INTO public.active_workouts(
				email, 
				current_workout, 
				workout_location, 
				workout_duration, 
				starting_datetime)
				VALUES ($1, $2, $3, $4, $5)`,
			[email, trainingType, location, duration, workoutDate]
		);

		res.status(200).json({
			status: "success",
			message: "Saved Data Succesffully",
		});
	} catch (err) {
		// console.log(err);
		res.json({
			status: "failed",
			message: `Invalid input err:${err}`,
		});
	}
});

//Route to retrieve all workouts from the 'workout_list' table.
app.get("/getallworkouts", async (req, res) => {
	try {
		console.log("Getting all workouts");

		//insert query
		const allWorkouts = await pool.query(
			`
			SELECT workout_name FROM public.workout_list;`
		);

		console.log(allWorkouts.rows);

		res.status(200).json({
			status: "success",
			message: "Data Retrieved Succesfuly",
			workouts: allWorkouts.rows,
		});
	} catch (allWorkouts_err) {
		// console.log(err);
		res.json({
			status: "failed",
			message: `Invalid input err:${allWorkouts_err}`,
		});
	}
});
//Route to fetch workout history for a user based on their email
app.post("/getuserhistory", async (req, res) => {
	try {
		const { email } = req.body;

		console.log(email);

		const userWorkouts = await pool.query(
			`
			SELECT * FROM public.history_workout where email = '${email}';`
		);

		console.log(userWorkouts.rows);

		res.status(200).json({
			status: "success",
			message: "Data Retrieved Succesfuly",
			workouts: userWorkouts.rows,
		});
	} catch (getuserworkouts_err) {
		// console.log(err);
		res.json({
			status: "failed",
			message: `Invalid input err:${getuserworkouts_err}`,
		});
	}
});
//Route for fetching active workouts for a user
app.post("/getuserworkouts", async (req, res) => {
	try {
		const { email } = req.body;

		console.log(email);

		const userWorkouts = await pool.query(
			`
			SELECT * FROM public.active_workouts where email = '${email}';`
		);

		console.log(userWorkouts.rows);

		res.status(200).json({
			status: "success",
			message: "Data Retrieved Succesfuly",
			workouts: userWorkouts.rows,
		});
	} catch (getuserworkouts_err) {
		//console.log(err);
		res.json({
			status: "failed",
			message: `Invalid input err:${getuserworkouts_err}`,
		});
	}
});
//Route to delete a specific workout session for a user by ID
app.post("/deleteuserworkouts", async (req, res) => {
	try {
		const { id } = req.body;

		const formattedId = id.replace("card-", "");

		// insert query
		pool.query(
			`
			DELETE FROM public.active_workouts WHERE id=${formattedId};`
		);

		res.status(200).json({
			status: "success",
			message: "Workout Deleted Succesfuly",
		});
	} catch (getuserworkouts_err) {
		// console.log(err);
		res.json({
			status: "failed",
			message: `Invalid input err:${getuserworkouts_err}`,
		});
	}
});
//Route to archive (move to history) a workout session for a user
app.post("/archiveuserworkouts", async (req, res) => {
	try {
		const { id } = req.body;

		const formattedId = id.replace("card-", "");

		// insert query
		await pool.query(`
		INSERT INTO public.history_workout
SELECT * FROM public.active_workouts
WHERE id=${formattedId}`);

		pool.query(
			`
			DELETE FROM public.active_workouts WHERE id=${formattedId};`
		);

		res.status(200).json({
			status: "success",
			message: "Workout Deleted Succesfuly",
		});
	} catch (getuserworkouts_err) {
		// console.log(err);
		res.json({
			status: "failed",
			message: `Invalid input err:${getuserworkouts_err}`,
		});
	}
});
//Route to register a new user in the system
app.post("/registeruser", async (req, res) => {
	try {
		//Extract user details from the request body
		const { email, password, fullname, birthdate, weight, goal, gender } =
			req.body;
		full_name = fullname.split(" ");
		await pool.query(
			`
			INSERT INTO public.users(
				email, 
				password, 
				first_name, 
				last_name, 
				weight,
				goal,
				gender,
				birthdate)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
			[
				email,
				password,
				full_name[0],
				full_name[1],
				weight,
				goal,
				gender,
				birthdate,
			]
		);

		res.status(200).json({
			status: "success",
			message: "Your journey is about to start!",
		});
	} catch (err) {
		// console.log(err);
		res.json({
			status: "failed",
			message: `Invalid input err:${err}`,
		});
	}
});
//Route to change a user's password
app.post("/changepassword", async (req, res) => {
	try {
		//Extract the email, old password, and new password from the request body
		const { email, oldpw, newpw } = req.body;
		//Retrieve the current password for the user from the database
		const { rows } = await pool.query(
			`
			SELECT password
	FROM public.users WHERE email=$1`,
			[email]
		);
		const userPass = rows[0].password;
		//Check if the old password matches the current password
		if (userPass != oldpw) {
			res.json({
				message: "Invalid password",
				status: "failed",
			});
			return;
		}
		//Update the user's password in the database to the new password
		await pool.query(
			`
			UPDATE public.users
	        SET password='${newpw}'
	        WHERE email='${email}'`
		);

		res.status(200).json({
			status: "success",
			message: "Password changed successfully!",
		});
	} catch (err) {
		// console.log(err);
		res.json({
			status: "failed",
			message: `Invalid input err:${err}`,
		});
	}
});

// Route to retrieve user's weight and height
app.get("/getUserDetails", async (req, res) => {
	try {
		const { email } = req.query; //Extracting email from query parameters
		if (!email) {
			return res.status(400).json({
				status: "failed",
				message: "Email is required",
			});
		}

		const { rows } = await pool.query(
			"SELECT weight, height FROM public.users WHERE email = $1",
			[email]
		);

		if (rows.length === 0) {
			return res.status(404).json({
				status: "failed",
				message: "User not found",
			});
		}

		const userData = rows[0];
		res.status(200).json({
			status: "success",
			data: userData,
		});
	} catch (err) {
		res.status(500).json({
			status: "failed",
			message: `Error retrieving user details: ${err.message}`,
		});
	}
});

//Route to retrieve or update account settings for a user
app.post("/accountsettings", async (req, res) => {
	try {
		const { email } = req.body;
		//Retrieve the user's current settings from the database
		const { rows } = await pool.query(
			`
			SELECT weight, goal,height
	FROM public.users WHERE email='${email}';`
		);
		userData = rows[0];
		//Respond with the retrieved user data
		res.status(200).json({
			status: "success",
			message: "Retrived info successfuly",
			userHeight: userData.height,
			usergoal: userData.goal,
			userWeight: userData.weight,
		});
	} catch (err) {
		//console.log(err);
		res.json({
			status: "failed",
			message: `Invalid input err:${err}`,
		});
	}
});
//Starts the server and listens on the specified port for requests
app.listen(port, () => {
	console.log(`SweatSquad listening at :${port}`);
});

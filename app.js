const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const app = express();
const port = process.env.PORT || 5000;

const secretjwt = "baguette";

// Middleware to parse JSON bodies
app.use(express.json());

// Use Database
const { pool } = require("./db");

var corsOptions = {
	origin: "http://localhost:5000",
	optionsSuccessStatus: 200, // For legacy browser support
};

app.use(cors());

app.get("/test", async (req, res) => {
	res.send("Test Worked, Connected to the backend.");
});

// app.post("/get-training-data")

app.post("/login", async (req, res) => {
	try {
		const { email, password } = req.body;

		console.log(email);

		// validate all parameters that are exist and valid

		if (!email || !password) {
			res.json({
				message: "You must provide an email & password",
				status: "failed",
			});
			return;
		}

		// Look up user in the database and password
		const { rows } = await pool.query(
			"SELECT * FROM public.users WHERE email = $1 and password = $2",
			[email, password]
		);

		// Check if a user was found
		const userExists = rows.length > 0;

		const user = rows[0];

		if (!userExists) {
			res.json({
				message: "Invalid email or password",
				status: "failed",
			});
			return;
		}

		const token = jwt.sign(
			{
				id: user.id,
				email: user.email,
				first_name: user.first_name,
				last_name: user.last_name,
				password: user.password,
			},
			secretjwt,
			{
				expiresIn: "8h",
			}
		);

		console.log(`token: ${token}`);

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

app.post("/api/auth/verify", async (req, res) => {
	try {
		const { token } = req.body;

		if (!token || token === "") {
			return res.status(401).json({ message: "Token is missing" });
		}

		// Verify JWT token
		const decoded = jwt.verify(token, secretjwt);
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

app.post("/saveworkout", async (req, res) => {
	try {
		const { email, trainingType, location, duration, workoutDate } =
			req.body;

		console.log(email, trainingType, location, duration, workoutDate);

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

app.get("/getallworkouts", async (req, res) => {
	try {
		console.log("Getting all workouts");

		// insert query
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
		// console.log(err);
		res.json({
			status: "failed",
			message: `Invalid input err:${getuserworkouts_err}`,
		});
	}
});

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

app.post("/registeruser", async (req, res) => {
	try {
		const { email } = req.body;
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
				birthdate,
				phonenumber)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
			[
				email,
				userPassword,
				first,
				last_name,
				weight,
				goal,
				gendervalue,
				birthdate,
				fullPhone,
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

app.post("/changepassword", async (req, res) => {
	try {
		const { email, oldpw, newpw } = req.body;

		const { rows } = await pool.query(
			`
			SELECT password
	FROM public.users WHERE email=$1`,
			[email]
		);
		const userPass = rows[0].password;

		if (userPass != oldpw) {
			res.json({
				message: "Invalid password",
				status: "failed",
			});
			return;
		}

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

app.post("/accountsettings", async (req, res) => {
	try {
		const { email } = req.body;

		const { rows } = await pool.query(
			`
			SELECT weight, goal,height
	FROM public.users WHERE email='${email}';`
		);
		userData = rows[0];

		res.status(200).json({
			status: "success",
			message: "Retrived info successfuly",
			userHeight: userData.height,
			usergoal: userData.goal,
			userWeight: userData.weight,
		});
	} catch (err) {
		// console.log(err);
		res.json({
			status: "failed",
			message: `Invalid input err:${err}`,
		});
	}
});

app.listen(port, () => {
	console.log(`SweatSquad listening at :${port}`);
});

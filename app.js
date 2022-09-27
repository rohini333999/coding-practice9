const express = require("express");
const server = express();
server.use(express.json());
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
const bcrypt = require("bcrypt");
const dbPath = path.join(__dirname, "userData.db");

let db = null;
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    server.listen(3000, () => {
      console.log("server started successfully!!");
    });
  } catch (e) {
    console.log(`DB error:${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

server.post("/register/", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(request.body.password, 10);
  let checkUser = ` SELECT * FROM user
           WHERE username = "${username}"`;
  const checkUserResponse = await db.get(checkUser);
  if (checkUserResponse === undefined) {
    if (password.length < 5) {
      response.status = 400;
      response.send("Password is too short");
    } else {
      const newUserRegistration = ` INSERT INTO user
                (username,name,password,gender,location)
                VALUES
                ("${username}","${name}","${hashedPassword}","${gender}","${location}")`;
      const newUserRegistrationResponse = await db.run(newUserRegistration);
      response.status = 200;
      response.send("User created successfully");
    }
  } else {
    response.status = 400;
    response.send("User already exists");
  }
});
server.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const getUsernameQuery = `
    SELECT * FROM user WHERE username = "${username}"`;
  const getUsername = await db.get(getUsernameQuery);
  if (getUsername === undefined) {
    response.status = 400;
    response.send("Invalid user");
  } else {
    const IsPasswordCorrect = await bcrypt.compare(
      password,
      getUsername.password
    );
    if (IsPasswordCorrect === true) {
      response.status = 200;
      response.send("Login success!");
    } else {
      response.status = 400;
      response.send("Invalid password");
    }
  }
});
server.put("/change-password/", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const hashNewPassword = await bcrypt.hash(request.body.newPassword, 10);
  const getUsernameQuery = `
    SELECT * FROM user WHERE username = "${username}"`;
  const getUsername = await db.get(getUsernameQuery);
  if (username !== undefined) {
    const isPasswordCorrect = await bcrypt.compare(
      oldPassword,
      getUsername.password
    );
    if (isPasswordCorrect === true) {
      if (newPassword.length < 5) {
        response.status = 400;
        response.send("Password is too short");
      } else {
        const setNewPasswordQuery = `UPDATE user SET 
            password = "${hashNewPassword}"
            WHERE username = "${username};"
            `;
        const setNewPassword = await db.run(setNewPasswordQuery);
        response.status = 200;
        response.send("Password updated");
      }
    } else {
      response.send("Invalid current password");
    }
  }
});

module.exports = server;

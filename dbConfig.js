var mysql = require("mysql");
var conn = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "starrydb",
});

conn.connect(function (err) {
  if (err) throw err;
  console.log("Database connected");
});

module.exports = conn;

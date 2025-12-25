const {Pool} = require("pg");

const pool = new Pool({
  user: "testuser",
  host: "localhost",
  database: "testdb",
  password: "testpass",
  port: 5433,
});

module.exports = pool
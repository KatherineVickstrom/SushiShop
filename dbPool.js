const mysql = require('mysql');

const pool  = mysql.createPool({
    connectionLimit: 10,
    host: "bmlx3df4ma7r1yh4.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
    user: "grbixg2lsv052t13",
    password: "vo6b6y4mnz3w0b5w",
    database: "ie01r8xn6ew9cobw"
});

module.exports = pool;

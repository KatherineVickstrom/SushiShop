//database connection
const pool = require("./dbPool.js");

//Saves payment info to database
async function savePayment(paymentInfo) {
  //Since we only allow a single CC per account, erase old one first
  let username = paymentInfo.username;
  await erasePayment(username);
  let sql = "INSERT INTO s_payment (cardNumber, cardNetwork, expiration, username, nameOnCard, zipCode) VALUES (?, ?, ?, ?, ?, ?)";
  let params = [paymentInfo.creditCardNumber, paymentInfo.creditCard, paymentInfo.creditCardExp, username, paymentInfo.creditCardName, paymentInfo.creditCardZip];
  let result = await executeSQL(sql, params); 
}

async function getSavedPayment(username) {
  let sql = "SELECT * FROM s_payment WHERE username=?";
  let rows = await executeSQL(sql, username);
  return rows;
}

async function erasePayment(username) {
  let sql = "DELETE FROM s_payment WHERE username=?";
  let rows = await executeSQL(sql, username);
}

//Adds an order to the database and returns its Id
async function addOrder(orderInfo) {
  let sql = "INSERT INTO s_order (username, quantity, amount, date, cardLastFour) VALUES (?, ?, ?, ?, ?)";
  //https://stackoverflow.com/questions/5129624/convert-js-date-time-to-mysql-datetime
  let date = orderInfo.date.toISOString().slice(0, 19).replace('T', ' ');
  let params = [orderInfo.username, orderInfo.quantity, orderInfo.amount, date, orderInfo.cardLastFour];
  let result = await executeSQL(sql, params); 
  return result;
}

//SQL execution
async function executeSQL(sql, params){
 return new Promise (function (resolve, reject) {
    pool.query(sql, params, function (err, rows) {
      if (err) throw err;
      resolve(rows);
    });
  });
}

//Exports
module.exports = { savePayment, getSavedPayment, erasePayment, addOrder };
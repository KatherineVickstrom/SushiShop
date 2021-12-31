// imports the Express library
const express = require('express');
//requires a variable to access the methods
const app = express();
// Import node-fetch 
const fetch = require('node-fetch');
//database connection
const pool = require("./dbPool.js");
//session
const session = require('express-session');
const bcrypt = require('bcrypt');
const saltRounds = 10;
//checkout library
const checkout = require("./checkout");
//payment library
const payments = require("./payments");

//set view engine after running npm i express ejs
app.set("view engine", "ejs");
//Specify the folder for static files (images, css, etc.)
app.use(express.static("public"));
app.use(session({
  secret: "top secret!",
  resave: true,
  saveUnitialized: true
}));
app.use(express.urlencoded({extended: true}));

// route to index
app.get('/', async (req, res) => {
  let url = `https://geek-jokes.sameerkumar.website/api?format=json`;
  let url2 = `https://api.unsplash.com/photos/random/?client_id=8YXVrGYUdrv2Sc4hlhy4O34npWCcpNir7ooR7RXMh_8&featured=true&orientation=landscape&query=sushi`;
  let response = await fetch(url);
  let response2 = await fetch(url2);
  let data = await response.json();
  let data2 = await response2.json();
  res.render('index.ejs', {"joke": data.joke, "auth": req.session.authenticated, "pic": data2.urls.small});
 });

app.post('/', async (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  let hashedPwd = "";
  let sql = "SELECT * FROM s_account WHERE username = ?";
  let rows = await executeSQL(sql, [email]);
  let url = `https://api.unsplash.com/photos/random/?client_id=8YXVrGYUdrv2Sc4hlhy4O34npWCcpNir7ooR7RXMh_8&featured=true&orientation=landscape&query=sushi`;
  let response = await fetch(url);
  let data = await response.json();
  if (rows.length > 0) {
    hashedPwd = rows[0].password;
  }
  let passwordMatch = await bcrypt.compare(password, hashedPwd);
  if(passwordMatch) {
    req.session.authenticated = true;
    req.session.username = email;
    res.redirect("/menu");
  } else {
    res.render("index.ejs", {"message": "Incorrect credentials, please try again!", "pic": data.urls.small});
  }
});

// route to account
app.get('/account', isAuthenticated, async (req, res) => {
  let email = req.session.username;
  let sql = "SELECT * FROM s_payment WHERE username=?";
  let rows = await executeSQL(sql, [email]);  
  let sql2 = "SELECT * FROM s_account WHERE username = ?";
  let rows2 = await executeSQL(sql2, [email]);
  res.render('account.ejs', {"accountInfo": rows2, "payment": rows});
});
app.post('/account/edit', isAuthenticated, async (req, res) => {
  let sql = `UPDATE s_account
            SET firstName = ?,
               lastName = ?
            WHERE username =  ?`;
  let params = [req.body.fName, req.body.lName,
                req.session.username];
  let rows = await executeSQL(sql, params);
  res.redirect("/account");
});
app.post('/account/password', isAuthenticated, async (req, res) => {
  let email = req.session.username;
  let password = bcrypt.hashSync(req.body.password, saltRounds);
  let sql = `UPDATE s_account 
            SET password = ?
            WHERE username = ?`;
  let params = [password, email]
  let rows = await executeSQL(sql, params);
  res.redirect("/account");
});
app.get('/logout', isAuthenticated, (req, res) => {
  req.session.destroy();
  res.redirect("/");
});
 // route to signup
app.get('/signup', (req, res) => {
  res.render('signup.ejs');
 });
app.post('/signup', async (req, res) => {
  let email = req.body.email;
  let sql = "SELECT * FROM s_account WHERE username = ?";
  let rows = await executeSQL(sql, email);
  if(rows[0] != undefined) {
    res.render('signup.ejs', {"message": "An account with that email already exists, please try another email."});
  }
  else {
    let password = bcrypt.hashSync(req.body.password, saltRounds);
    sql = `INSERT INTO s_account 
              (firstName, lastName, username, password)
              VALUES (?, ?, ?, ?)`;
    let params = [req.body.fName, req.body.lName,
                  email, password];
    rows = await executeSQL(sql, params);
    res.redirect("/");
  }
});


// route for checkout
app.get('/checkout', (req, res) => {
  res.redirect("/");
});
app.post('/checkout', async (req, res) => {
  if (typeof(req.session.username) == "undefined") {
    res.redirect("/");
  }else {
    //Retrieve orders from client and store as map
    let orders = null; 
    try {
      //Converts order back to Map format
      orders = new Map(JSON.parse(req.body.order_input));
    }catch(error) { orders = []; }
    let success = checkout.addToCart(req, orders);
    if (success) {
      //Items placed in cart
			let menu = checkout.getMenu();
      if (menu == null) {
          let sql = `SELECT * FROM s_product ORDER BY category`;
	        menu = await executeSQL(sql);
          //Save menu for future use (to obtain prices and image paths without having to access database again)
          checkout.saveMenu(menu);
      }
      //Check for saved payment info
      let savedPayment = await payments.getSavedPayment(req.session.username);
      let isSaved = false;
      let creditCardInfo = undefined;
      if (savedPayment.length > 0) {
        isSaved = true;
        creditCardInfo = {
           "creditCard": savedPayment[0].cardNetwork,
           "creditCardName":savedPayment[0].nameOnCard,
           "creditCardNumber": savedPayment[0].cardNumber,
           "creditCardExp": savedPayment[0].expiration,
           "creditCardZip": savedPayment[0].zipCode
        };
      }
      //Retrieve cart and render page
      let cart = checkout.retrieveCart(req.session.username);
      let cartDetails = checkout.getCartDetails(menu,cart);
      req.session.grandTotal = cartDetails.grandTotal;
      req.session.cart_size = cartDetails.cart_size;
      res.render("checkout.ejs", { "cart": cart, "message":`${cartDetails.cart_size} Items`, "prices":cartDetails.prices, "images": cartDetails.images, "subtotal":cartDetails.subtotal, "tax":cartDetails.tax, "grandTotal":cartDetails.grandTotal, "creditCardInfo":creditCardInfo, "saveCreditCard": isSaved });
    }else {
      //Cart is empty
      res.render("checkout.ejs", { "message":"Cart is empty!", "subtotal":0, "tax":0, "grandTotal":0 });
    }
  }
 });

// route for order confirmation
app.get("/confirmation", (req, res) => {
   res.redirect("/");
});
app.post("/confirmation", async (req, res) => {
  let url = "https://cataas.com/cat/says/Thank%20you%20for%20your%20oder!";
  // let response = await fetch(url);
  // let data = await response.json();

  let saveCreditCard = req.body.saveCreditCard;
  let creditCardInfo = {
      "username": req.session.username,
      "creditCard": req.body.creditCard,
      "creditCardName": req.body.creditCardName,
      "creditCardNumber": req.body.creditCardNumber,
      "creditCardExp": req.body.creditCardExp,
      "creditCardZip": req.body.creditCardZip
  };
  let grandTotal = req.session.grandTotal;
  let cart_size = req.session.cart_size;
  
  //Validation
  let errMessage = "";
  if (grandTotal == null) {
    errMessage = "Nothing in cart!";
  }else if (creditCardInfo.creditCard == "") {
    errMessage = "Please select a credit card network"
  }else if (!checkout.verifyNumber(creditCardInfo.creditCardNumber)) {
    errMessage = "Invalid credit card number";
  }else if (!checkout.verifyExp(creditCardInfo.creditCardExp)) {
    errMessage = "Invalid expiration date";
  }else if (!checkout.verifyZip(creditCardInfo.creditCardZip)) {
    errMessage = "Invalid zip code";
  }
  
  if (errMessage != "") {
    //validation has failed
    if (grandTotal == null) {
      res.render("checkout.ejs", { "message":"Cart is empty!", "subtotal":0, "tax":0, "grandTotal":0, "errMessage" : errMessage, "creditCardInfo":creditCardInfo, "saveCreditCard": saveCreditCard });
    }else {
      //Must repopulate fields properly
      let menu = checkout.getMenu();
      let cart = checkout.retrieveCart(req.session.username);
      let cartDetails = checkout.getCartDetails(menu,cart);
      res.render("checkout.ejs", { "cart": cart, "message":`${cartDetails.cart_size} Items`, "prices":cartDetails.prices, "images": cartDetails.images, "subtotal":cartDetails.subtotal, "tax":cartDetails.tax, "grandTotal":grandTotal, "errMessage" : errMessage, "creditCardInfo":creditCardInfo, "saveCreditCard": saveCreditCard });
    }
  }else {
    //order can proceed
    let cc_num = creditCardInfo.creditCardNumber;
    let orderInfo = {
      "username" : req.session.username,
      "quantity": cart_size,
      "amount": grandTotal,
      "date": new Date(),
      "cardLastFour": cc_num.substring(cc_num.length - 4)
    };
    //Save or delete credit card
    if (saveCreditCard) {
      payments.savePayment(creditCardInfo);
    }else {
      payments.erasePayment(orderInfo.username);
    }
    //Add order to database and render confirmation page
    let result = await payments.addOrder(orderInfo);
    req.session.grandTotal = null;
    req.session.cart_size = null;
    res.render("confirmation.ejs", { "orderId":result.insertId, "quantity":orderInfo.quantity,"amount": orderInfo.amount, "lastFour":orderInfo.cardLastFour, "cat": url});
  }
});

// route to menu
app.get('/menu', async (req, res) => {
  res.render('menu.ejs');
});

 // route to rubric
app.get('/rubric', (req, res) => {
  res.render('rubric.ejs');
 });

// API routes
app.get('/api/menu', async (req, res) => {
  let sql = `
    SELECT * 
    FROM s_product
    ORDER BY category
  `;
  let menu = await executeSQL(sql);
  res.send(menu);
});

app.get('/api/menu/:name', async (req, res) => {
  let sql = `
    SELECT * 
    FROM s_product
    WHERE productName = ?
  `;
  let params = [req.params.name];
  let response = await executeSQL(sql, params);
  res.send(response);
});
//start server
app.listen(3000, () => {
  console.log("Express server running...")
});

//functions
async function executeSQL(sql, params){
 return new Promise (function (resolve, reject) {
   pool.query(sql, params, function (err, rows, fields) {
   if (err) throw err;
     resolve(rows);
   });
 });
}//executeSQL
function isAuthenticated(req, res, next) {
  if(!req.session.authenticated) {
    res.redirect("/");
  } else {
    next();
  }
}//isAuthenticated
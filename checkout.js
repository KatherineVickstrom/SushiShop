let menu = null;
let cart = new Map();
//Adds orders to server-side map
function addToCart(req, order) {
  //If qty has been changed to 0, erase from order
  let delArray = [ ];
  order.forEach(function(value, key) {
    if (value == 0) delArray.push(key);
  });
  delArray.forEach(function(key) {
    order.delete(key);
  });
  //Maps orders to specific users
  cart.set(req.session.username, order);
  return (order.size > 0);
}

function retrieveCart(username) {
    return cart.get(username);
}
//Retrieves info related to the cart, e.g. prices, totals, and image paths
//Maps are used to link products to their prices and image paths
function getCartDetails(menu, cart) {
  let priceMap = new Map();
  let imageMap = new Map();
  //Load image and price maps for all products using saved menu
  for (let i = 0; i < menu.length; i++) {
    priceMap.set(menu[i].productName, menu[i].price);
    imageMap.set(menu[i].productName, menu[i].imgPath);
  }
  let prices = []
  let images = []
  let subtotal = 0;
  let cart_size = 0;
  //For each item in our cart, add its price and image path to an array 
  //Updates cart_size and subtotal
  cart.forEach(function(value, key) { 
    let price = priceMap.get(key) * value;
    cart_size += parseInt(value);
    subtotal+=price;
    prices.push(price.toFixed(2));
    images.push(imageMap.get(key));
  });
  //Tax and totals
  let tax = .10 * subtotal;
  let grandTotal = subtotal + tax;
  tax = tax.toFixed(2);
  subtotal = subtotal.toFixed(2);
  grandTotal = grandTotal.toFixed(2);
  return {
    "prices": prices,
    "images": images,
    "subtotal" : subtotal,
    "cart_size" : cart_size,
    "tax": tax,
    "grandTotal": grandTotal
  }
}

//Validation functions
function verifyNumber(creditCardNumber) {
  let success = true;
  if (creditCardNumber.length < 13) success = false;
  else if (creditCardNumber.length > 19) success = false;
  return success;   
}

function verifyZip(creditCardZip) {
  let success = true;
  if (creditCardZip.length != 5) success = false;
  return success;   
}

function verifyExp(creditCardExp) {
  //https://regex101.com/library/AFarfB
  let regex = new RegExp("^(0[1-9]|1[0-2])\/?([0-9]{2})$");
  return regex.test(creditCardExp);
}

//Menu setter and getter
function getMenu() {
  return menu;
}

function saveMenu(newMenu) {
  menu = newMenu;
}

//Exports
module.exports = { addToCart, retrieveCart, getCartDetails, getMenu, saveMenu, verifyNumber, verifyZip, verifyExp };
let orders = new Map();

//Check elapsed time since last visit and clear orders if > 5 minutes
let saved_time = localStorage.getItem("on_a_roll_sushi_time");
let currentTime = new Date();
if (saved_time != null) {
  saved_time = Date.parse(saved_time);
  let elapsed_time = (currentTime - saved_time) / 1000;
  if (elapsed_time > 300) {
    localStorage.removeItem("on_a_roll_sushi");
  }
}
localStorage.setItem("on_a_roll_sushi_time", currentTime);

//Retrieve saved orders, if any, and adds them to a map. 
function loadCart() {
  let saved_orders = localStorage.getItem("on_a_roll_sushi");
  if (saved_orders != null) {
    orders = new Map(JSON.parse(saved_orders));
    //Make sure correct quantities are selected
    orders.forEach(function(value, key) {
      document.getElementById(key).value = value;
    });
    //Store order in hidden element
    document.getElementById("hidden_list").value = saved_orders;  
  }
  document.getElementById("cartNum").innerText = cartSize();
}

//Client-side cart
function addToCart() {
  //Add selections (name, qty) to orders map
  let selections = document.getElementsByClassName("product_input");
  for (let i = 0; i < selections.length; i++) {
      orders.set(selections[i].id, selections[i].value);
  }
  //Save map in hidden element
  //https://stackoverflow.com/questions/29085197/how-do-you-json-stringify-an-es6-map
  let order_string = JSON.stringify(Array.from(orders.entries()));
  document.getElementById("hidden_list").value = order_string;
  localStorage.setItem("on_a_roll_sushi", order_string);
  document.getElementById("cartNum").innerText = cartSize();
}

function cartSize() {
  cart_size = 0;
  orders.forEach(function(value, key) {
    if (value > 0) cart_size += parseInt(value);
  });
  return cart_size;
}
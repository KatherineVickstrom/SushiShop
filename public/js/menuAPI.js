$(document).ready(async function() {

  async function getMenu() {
    let url = "https://project.katherinevickst.repl.co/api/menu";
    let response = await fetch(url);
    let menu = await response.json();
    return menu;
  };

  async function getPrice(name) {
    let url = "https://project.katherinevickst.repl.co/api/menu/" + name;
    let response = await fetch(url);
    let item = await response.json();
    return item.price;
  };

  async function getImgPath(name) {
    let url = "https://project.katherinevickst.repl.co/api/menu/" + name;
    let response = await fetch(url);
    let item = await response.json();
    return item.imgPath;
  };

  var menu = await getMenu();
  for (let i = 0; i < menu.length; i++) {
    $(`#productInfo`).append(
      `
        <div id="product">      
        <br>
        <h4>${menu[i].productName}</h4>
        <h5 style="text-transform:capitalize">${menu[i].category}</h5>
        <img id="img_${menu[i].productName}" src=${menu[i].imgPath} alt="imgPath" width=300em>
        <br>
        ${menu[i].ingredients} <br> <span id="price_${menu[i].productName}">${menu[i].price}</span><br>
        <input class="product_input" type="number" id="${menu[i].productName}" min="0" max="10" value="0" width="1em">
        <input type="button" id="addToOrder" onClick="addToCart()" value="Update Quantity"/>
        </div>
      `
    );
  }

  loadCart();

});
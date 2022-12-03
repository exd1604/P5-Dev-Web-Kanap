/* FUNCTIONS:
   ---------
/* getStorageCart: Retrieve existing cart off storage or create it empty if no cart found
   ---------------
*/
function getStorageCart() {
    if (localStorage.getItem("currentCart") !== null) {
        return(currentCart = JSON.parse(localStorage.getItem("currentCart")));        
    } else {
        return(currentCart = []);
    }
}

/* onCartClick: Call back on link "panier" click
   ------------
   When user clicks to display the cart, process shoots an alert if the cart is empty and prevent default link behavior
*/
function onCartClick(event) {   
    if (currentCart.length == 0) {
        event.preventDefault();
        alert(`Votre commande ${orderId} a été confirmée ce qui a vidé votre panier. Vous allez être redirigé vers la page d\'accueil`);
        location = './index.html';
    }
}

// ROOT SOURCE CODE
// Update the returned order number in the DOM to display the confirmation page
const orderId = new URL(document.location).searchParams.get("orderId");
document.querySelector('#orderId').textContent = orderId;
const cartLink = document.querySelector("a[href='./cart.html']");    

getStorageCart();    
cartLink.addEventListener('click', onCartClick);  
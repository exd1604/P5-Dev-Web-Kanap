/* Global Variables:
   ----------------
*/
const hostServer      = 'http://localhost:3000/';
const apiItem         = 'api/products/';
//
let enteredQuantity = 0;
let selectedColorValue = '';
//
const cartCounterStyle = {
    fontSize: ['font-size:', '13px;'],
    fontWeight: ['font-weight:', '600;'],
    color: ['color:', 'white;'],
    backgroundColor: ['background-color:', '#3498db;'],
    width: ['width:', '36px;'],
    height: ['height:', '18px;'],
    borderRadius: ['border-radius:', '10px;'],
    display: ['display:', 'flex;'],
    justifyContent: ['justify-content:', 'center;'],
    alignItems: ['align-items:', 'center;'],
    marginLeft: ['margin-left:', '5px;']    
}

const checkStyle = {
    fontWeight: ['font-weight:', '500;'],
    color: ['color:', '#fbbcbc;'],
    textAlign: ['text-align:', 'center;']        
}

/* FUNCTIONS:
   ---------
*/
/* fetchSingleItem: Pull item from the backend server   
   ----------------
   Parameters:
   host: <string> - http address:port of the server
   api : <string> - api path for a full set of items   
   item: <string> - Item id selected by user on welcome page retrieved from the URL search params

   return: { object }

   The url is composed of fix value concatenated with the itemid extracted from the url
   The function uses the fetch method. The passed item id is used to load its details to the detail item page setting
*/
async function fetchSingleItem(host, api, item) {   
    const reply = await fetch(host + api + item, {
                                method: 'GET',
                                headers: {
                                    "Accept": "application/json"
                                }
                        })                        
    if (reply.ok === true) {
        return reply.json();
    }
    
    throw 'erreur'; 
}

/* loadItem2DOM: Load selected item details to the product page DOM.
   ------------  
   Parameters:
   { object } - Returned from the fetch response. Contains several properties defining item on back end server. (colors, _id, name, price, 
                imageUrl, description, altTxt)
   The returned JSON object from the fetch is used to load item elements to the DOM 
*/
function loadItem2DOM(getReturn) {    
    try {
// Load new element(s)    
        document.querySelector(".item__img").appendChild(newElement('img', [] , [['src', getReturn.imageUrl], ['alt', getReturn.altTxt]], null));

        if (Array.isArray(getReturn.colors) && getReturn.colors.length > 0) {
            for (let i in getReturn.colors) { 
                document.querySelector("#colors").appendChild(newElement('option', [] , ['value', getReturn.colors[i]], getReturn.colors[i]));
            }
        } 

        document.querySelector(".item__content__settings__color")
            .appendChild(newElement('p', [] , [['id', 'colorErrorMsg'],['style', buildStyle(checkStyle)]], null)); 
        document.querySelector(".item__content__settings__quantity")
            .appendChild(newElement('p', [] , [['id', 'quantityErrorMsg'],['style', buildStyle(checkStyle)]], null));

    // Update existing DOM element(s)
        document.title = getReturn.name;    
        document.querySelector("#title").textContent = getReturn.name;
        document.querySelector("#price").textContent = getReturn.price;
        document.querySelector("#description").textContent = getReturn.description;
    }   catch(error) {
            throw 'Chargement de l\'article dans le DOM a échoué. Le résultat peut être incomplet et imprévisible'; 
        }
}

/* newElement: Creates a new element with potentially class(es) and/or attribute(s)    
   -----------
    Parameters:
    Tagid:          <string>   - HTML tag name (article, section, div, p, img, etc.....)
    classList:      [array]    - An array containing the class(es) to set on the element i.e ["cls1", "cls2", etc...]. No class pass an empty array
    attributesList: [[array]]  - An array of array(s). Contains attributes to set on the element Model: [['attribute id', atribute value]]
                                i.e [["type", "number"], ["value", 42], etc.....]. No attribute pass an empty array  
    textContent:    <string>   - Value to set on the element as a text content. If no text required pass null

    return: <HTMLElement>
*/
function newElement(tagId, classList, attributesList, text) {    
    const element = document.createElement(tagId);
    if (classList.length > 0) {element.classList.add(...classList)};         
    if (Array.isArray(attributesList)) {
        attributesList.forEach((attribute, index) => {
                                    element.setAttribute(`${attribute[0]}`, `${attribute[1]}`);
                                })
    }
    if (text != null) {
        element.textContent = text; 
    }    
    return element;        
}

/* buildStyle: Build a style variable to potentially add inline style attribute when necessary   
   -----------
    Parameter passed is an object containing:
    { object} key: styleattribute (Without dash - Value is free as it is not used as such) value:  [style-attribute:, style-value;] 
              i.e : Refer to cartCounterStyle

    return:
    <string>
    
    i.e a font size will be defined as object property: fontSize: ['font-size:', '16px;'] 
*/
function buildStyle(objectStyle) {
    let style = '';
    for (const property in objectStyle) {
        style = style+objectStyle[property][0]+objectStyle[property][1];            
    }
    return style;
}

/* updateDOMTotals: This update a DOM element text with either total quantity or total value  
   ----------------
    Parameter:
    An array of arrays: [[DOM element 1 , value to update],[DOM element 2 , value to update], ....]        
    
    Once done, the text of the element passed as parameter is updated in DOM.
        
*/
function updateDOMTotals(elements, what) {
    let cartTotals = sumCartTotals();
    elements.forEach((element, index) => {
        if (element[1] == 'quantity') {
                element[0].textContent = cartTotals[0];
        }   else if (element[1] == 'value') {
                element[0].textContent = cartTotals[1].toLocaleString("fr-FR", valueFormat.totalValue);
            }
    }); 
}

/* sumCartTotals: build cart totals (quantity and value)  
   -------------
   Parameters:
   NONE
   
   Return:
   [total quantity, total value]
*/
function sumCartTotals() {
    let totals = [0, 0];
    currentCart.forEach((item, index) => {
        totals[0] += item[2];
        totals[1] += item[6]*item[2];
    })
    return totals;    
}

/* onCartClick: Call back on link "panier" click
   ------------
   Parameter:
   { object type event }

   When user clicks to display the cart, process shoots an alert if the cart is empty and prevent default link behavior
*/
function onCartClick(event) {
    if (currentCart.length == 0) {
        event.preventDefault();
        alert('Votre panier est vide.');
    } 
}

/* onClickAdd2Cart: Call back on button ("Ajouter au panier") click
   ----------------
   Parameters:
   event: { object type event } 
   
   When user clicks to add the item to the cart the process will:
   1 - Validate a color has been selected - If not shoots an error.
   2 - Once color is selected, routine checks if itemId / color combination already exist in existing cart-
   3 - Runs the checkQuantity function. 
   4 - If no error returned from step 3 then perform the cart feed 
*/
function onClickAdd2Cart(event) {
    let colorPassed     = false;
    let quantityPassed  = false;    
// Check color    
    selectedColorValue   = document.querySelector("#colors").value;    
    colorPassed          = checkColor(selectedColorValue);

// Check quantity
    const itemCartIndex = currentCart.findIndex(itemCart => itemCart[0] == itemId && itemCart[1] == selectedColorValue);        
    enteredQuantity     = fixNan(document.querySelector("#quantity").value, 10);
    //quantityPassed      = checkQuantity(enteredQuantity, colorPassed, selectedColorValue);
    quantityPassed      = checkQuantity(enteredQuantity, colorPassed, itemCartIndex);

    if (colorPassed && quantityPassed) {
            feedCart(itemId, selectedColorValue, enteredQuantity, itemCartIndex);
            updateDOMTotals([[cartLinkElement, 'quantity']]);
    }       
}

/* fixNan: Ensure the value converted using parseInt returns a number and not Nan 
   -------
   Parameters:
   num  <string>    - Field value to potentially convert
   base integer     - The base used for the conversion (Could be 10, 8, 16 or any other integer)
*/
function fixNan(num, base) {
    const parsed = parseInt(num, base);
    if (isNaN(parsed)) {
                return 0
        };
    return parsed;
}

/* checkColor: Validate color
   ----------    
   Parameters:
   selectColor: <string> 
*/
function checkColor(selectedColorValue) {  
    const elementColor = document.querySelector("#colors");    
    const elementColorErrorMsg = document.querySelector("#colorErrorMsg");
    if (selectedColorValue == "") {  
        elementColor.style.backgroundColor    = '#fbbcbc';        
        elementColorErrorMsg.textContent      = 'Vous devez sélectionner une couleur';
        elementColor.focus();          
        return false;
    } 
    elementColor.style.backgroundColor = null;
    elementColorErrorMsg.textContent = ' ';
    return true; 
}

/* checkQuantity: Validate Quantity entered
   -------------  
   Parameters: 
   enteredQuantity: Number - The quantity entered by the user on screen
   
   return:
   boolean - True when quantity is valid, false when it is wrong. 

   Shoots an error if entered quantity not valid   
*/
function checkQuantity(enteredQuantity, colorPassed, i) { 
    const elementQuantity = document.querySelector("#quantity"); 
    const elementQuantityErrorMsg = document.querySelector("#quantityErrorMsg");
    if ((enteredQuantity <= 0) || (enteredQuantity > 100)) {
        elementQuantity.style.backgroundColor = '#fbbcbc';
        if (colorPassed) {
                elementQuantity.focus();
        }     
        elementQuantityErrorMsg.textContent = 'La quantité entrée est invalide. Doit être comprise entre 1 et 100 maximum';
        return false;        
    }

    if (i >= 0 && enteredQuantity+currentCart[i][2]> 100) {
            elementQuantityErrorMsg.textContent = `Cet article/couleur a une quantité de ${currentCart[i][2]} dans le panier. L\'ajout de ${enteredQuantity} pièces rend le total supérieur à 100. Mise à jour article impossible`;
            return false;        
    }
        elementQuantity.style.backgroundColor = null;                     
        elementQuantityErrorMsg.textContent = ' ';
        return true;                    
}

/* feedCart: Once all checks have passed, cart is fed with entered values (Item / Color / Quantity)
   ---------    
   Parameters:
   itemId:          <string> - Item Code being processed
   selectColor:     <string> - Item color being processed
   enteredQuantity: Number   - The quantity entered by the user on screen
   itemCartIndex:   Number   - Position of the element in the cart (In cart one element represents one item / color combination)

    1 - Creation mode - The routine inserts (push) the new combination to the end of the array.
        Change mode   - Routine updates the cart quantity with the entered quantity on screen.
    2 - Once step one complete, the process refreshes currentCart as well as the local storage with the newly updated cart to ensure the entered
        data saved.
*/
function feedCart (itemId, selectedColorValue, enteredQuantity, itemCartIndex) {
    try { 
        if (itemCartIndex < 0) {
                currentCart.push([itemId, selectedColorValue, enteredQuantity]);                                     
                alert(`Article ${itemName}, couleur ${selectedColorValue} quantité ${enteredQuantity} va être ajouté au panier`);        
        }   else {
                const cartQuantityB4Change = currentCart[itemCartIndex][2];
                currentCart[itemCartIndex][2] += enteredQuantity; 
                alert(`Quantité panier pour l\'article ${itemName}, couleur ${selectedColorValue} va être modifiée.
                       Quantité panier avant modification est ${cartQuantityB4Change}
                       Quantité panier aprés modification sera ${currentCart[itemCartIndex][2]}`);
            }         

// Update local storage            
        localStorage.setItem("currentCart", JSON.stringify(currentCart));
// Reset color and quantity in DOM
        document.querySelector("#colors").value = '';
        document.querySelector("#quantity").value = 0;            
    }   catch(error) {
            alert(`${error}: Echec de la mise à jour du panier`);
        }                    
}

/* getStorageCart: Retrieve existing cart off storage to create a working array or create it empty if local storage is empty
   ----------------
   Parameters:
   NONE

   return:
   [array]
*/
function getStorageCart() {
    if (localStorage.getItem("currentCart") !== null) {
        return(currentCart = JSON.parse(localStorage.getItem("currentCart")));        
    } else {
        return(currentCart = []);
    }
}

// Root source code
// Extract item id from URL passed through welcome page
const params = new URLSearchParams(document.location.search);
const itemId = params.get('id');
const itemName = params.get('name');

fetchSingleItem(hostServer, apiItem, itemId)    
    .then(getReturn => {loadItem2DOM(getReturn)}) 
    .catch(err => {
                alert(`Erreur pendant le chargement de l\'article sélectionné. 
                       Vous allez être redirigé vers la page d\'accueil. 
                       Réessayez un peu plus tard.
                       Si le problème persiste, merci de nous contacter`);
                location = './index.html';
            });

getStorageCart();
// Set cart Counter in DOM next to "cart.html" link
const cartLink = document.querySelector("a[href='./cart.html']");    
cartLinkElement = newElement('span', [] , [['style', buildStyle(cartCounterStyle)]], '0');      
updateDOMTotals([[cartLinkElement, 'quantity']]);
cartLink.append(cartLinkElement);
// Listener on link "Panier" - click
cartLink.addEventListener('click', onCartClick);

// Listener on "Ajouter au panier" button click
document.querySelector("#addToCart").addEventListener('click', onClickAdd2Cart);   
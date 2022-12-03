/* Global Variables:
   ----------------
*/
const hostServer      = 'http://localhost:3000/';
const apiItem         = 'api/products/';
//
let enteredQuantity = 0;
let selectedColor = '';
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

/* FUNCTIONS:
   ---------
*/
/* fetchSingleItem: Pull item from the backend server   
   ----------------
   The url is composed of fix value concatenated with the itemid extracted from the url
   The function uses the fetch method.   
   The passed item id is used to load its details to the detail item page setting
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
    
    throw new Error(`Erreur HTTP ${reply.status}`);
}

/* loadItem2DOM: Load selected item details to the product page DOM.
   ------------  
   The returned JSON object from the fetch is used to load item elements to the DOM 
*/
function loadItem2DOM(getReturn) {
    try {
// Load new element(s)    
        const newItemImage    = newElement('img', [] , [['src', getReturn.imageUrl], ['alt', getReturn.altTxt]], null);
        document.querySelector(".item__img").appendChild(newItemImage);

        if (Array.isArray(getReturn.colors) && getReturn.colors.length > 0) {
            for (let i in getReturn.colors) { 
                const newColor = newElement('option', [] , ['value', getReturn.colors[i]], getReturn.colors[i]);
                document.querySelector("#colors").appendChild(newColor);
            }
        } 

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
    1- Tagid          - HTML tag name (article, section, div, p, img, etc.....)
    2- classList      - An array containing the class(es) to set on the element i.e ["class1", "class2", etc.....]. No class pass an empty array
    3- attributesList - An array of array(s) containing the attributes to set on the element Model: [['attribute id', atribute value]]
                        i.e [["type", "number"], ["value", 42], etc.....]. No attribute pass an empty array  
    4- textContent    - Value passed will be added to the element as a text content. If no text required pass null
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
    key:    styleattribute (Without dash - Value is free as it is not used as such)
    value:  [style-attribute:, style-value;] 
    
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
    Once done, the text of the element passed as parameter is updated in DOM.
    Parameter:
    An array of arrays: [[DOM element 1 , value to update],[DOM element 2 , value to update], ....]
        
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
   Scans the currentCart array initially loaded and sums quantities and values found per item/color to get totals.
   Returns an array of 2 elements [total quantity, total value]
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
   When user clicks to add the item to the cart the process will:
   1 - Validate a color has been selected - If not shoots an error.
   2 - Once color is selected, routine checks if itemId / color combination already exist in existing cart-
   3 - Runs the checkQuantity function. 
   4 - If no error returned from step 3 then perform the cart feed 
*/
function onClickAdd2Cart(event) {
// Check color
    selectedColor   = document.querySelector("#colors").value;
    if (checkColor(selectedColor)) {
// Check quantity
        const itemCartIndex = currentCart.findIndex(itemCart => itemCart[0] == itemId && itemCart[1] == selectedColor);        
        enteredQuantity   = parseInt(document.querySelector("#quantity").value, 10);
        if (checkQuantity(enteredQuantity, itemCartIndex)) {
            feedCart(itemId, selectedColor, enteredQuantity, itemCartIndex);
            updateDOMTotals([[cartLinkElement, 'quantity']]);
        }
    }
}

/* checkColor: Validate color
   ----------     
*/
function checkColor(selectedColor) {  
    if (selectedColor == "") {    
        alert("Vous devez choisir une couleur");
        return false;
    } 
    return true; 
}

/* checkQuantity: Validate Quantity entered
   -------------     
   1 - Shoots an error if entered quantity not valid
   2 - When entered quantity is acceptable 2 possibilities:
        a - The item Id / selected color combination does not exist in current cart: Creation mode no more check
        b - The item Id / selected color combination exists in current cart: Process ensures the total requested qty (current cart + entered qty)
            is not greater than 100.
            If not it updates currentcart quantity with the total quantity otherwise alert user
*/
function checkQuantity(enteredQuantity, itemCartIndex) {  
    if ((enteredQuantity <= 0) || (enteredQuantity > 100)) {
        alert(`Quantité ${enteredQuantity} est invalide. Doit être comprise entre 1 et 100 maximum`);                                
        return false;        
    }   else if (itemCartIndex >= 0) {            
            const itemCartQuantityTotal = currentCart[itemCartIndex][2] + enteredQuantity;              
            if (itemCartQuantityTotal <= 100) {
                currentCart[itemCartIndex][2] = itemCartQuantityTotal;                                
                return true;                
            } else {
                alert(`MISE A JOUR REFUSEE: 
                La quantité totale demandée (Quantité actuelle ${currentCart[itemCartIndex][2]} + Quantité demandée ${enteredQuantity}) est ${itemCartQuantityTotal}. 
                La quantité totale maximale autorisée par combinaison (Article / Couleur) est 100.`);
                return false;
            }            
        }     
        return true;                    
}

/* feedCart: Once all checks have passed, cart is fed with entered values (Item / Color / Quantity) 
   ---------    
    1 - Creation - The routine searches the first higher element index in the array using the item id/selected color combination as a search key.
                   If it finds one, it inserts the new one prior to the found key.
                   If it does not find any index, it just pushes the new combination to the end of the array.
    2 - Once step one performed (if required), the process refreshes the local storage with the newly updated cart. (To ensure the entered data)
    are not lost.
*/
function feedCart (itemId, selectedColor, enteredQuantity, itemCartIndex) {
    try { 
        if (itemCartIndex < 0) {
                currentCart.push([itemId, selectedColor, enteredQuantity]);                                     
                alert(`Article ${itemName}, couleur ${selectedColor} quantité ${enteredQuantity} a été ajouté`);        
        }   else {
                alert(`Quantité panier pour l\'article ${itemName}, couleur ${selectedColor} mise à jour à ${currentCart[itemCartIndex][2]}`);
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
    .then(getReturn => loadItem2DOM(getReturn)) 
    .catch(err => {
                    alert(`Erreur pendant le chargement de l\'article ${itemName} (id: ${itemId}) sélectionné`);
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
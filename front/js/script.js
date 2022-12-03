/*
GLOBAL VARIABLES:
-----------------
*/
const hostServer      = 'http://localhost:3000/';
const apiItem         = 'api/products/';
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

/* 
FUNCTIONS:
----------
*/
/* fetchAllItems: Pull a refreshed full set of items from the backend server.   
   -------------
    Uses the fetch method.
    All items from the back server expected to be loaded to the page. 
    Each of the pulled item is then passed to function loadItem2WelcomePage    
*/
async function fetchAllItems(host, api) {
    const reply = await fetch(host+api, {
                                method: "GET", 
                                headers: {
                                    "Accept": "application/json"
                                }
                        })                         
    if (reply.ok === true) {                              
        return reply.json();
    }       
    throw new Error(`Erreur HTTP ${reply.status}`);
}

/* loadItem2WelcomePage: Load item to the DOM.
   ---------------------
   The card skeletton is:   
   1 - <a> - Link embedding the details allowing a click to get to items details page
        1.1 - <Article>
            1.1.1 - <img> - Product Image
            1.1.2 - <h3> - Product Name
            1.1.3 - <p> - Product Description
   Attributes passed as parameters get loaded to their respective tags:
   <a> - path + ItemId as href
   <img> - itemImage as src, itemAltTxt as alt
   <h3> - itemName As tag content
   <p> - itemDescription as tag content

   Sample:
   ¨¨¨¨¨¨¨
    <a href="./product.html?id=42">
        <article>
            <img src=".../product01.jpg" alt="Picutre of Kanap name1">
            <h3 class="productName">Kanap name1</h3>
            <p class="productDescription">Product Descprion Kanap 1</p>
        </article>
    </a>
*/
function loadItem2WelcomePage(itemId, itemName, itemImage, itemDescription, itemAltTxt) { 
    try { 
        const newCardLink    = newElement('a', [] , [['href', `./product.html?id=${itemId}&name=${itemName}`], ['data-id', itemId]], null);      
        const newCardArticle = newElement('article', [] , [], null);  
        const newCardImage   = newElement('img', [] , [['src',itemImage],['alt',itemAltTxt]], null);  
        const newCardH3      = newElement('h3', ['productName'] , [], itemName); 
        const newCardP       = newElement('p', ['productDescription'] , [], itemDescription); 
        newCardLink.appendChild(newCardArticle).append(newCardImage, newCardH3, newCardP);
    
// Insert the new item card at its place (In ItemId order) into the target section     
        let parentNode = document.querySelector('#items');
        let itemLinkReference = findInsertRank(itemId); 
        parentNode.insertBefore(newCardLink, itemLinkReference);  
    }   catch(error) {
            console.log(`Le chargement de l\'article ${itemId} dans le DOM a échoué. Le chargement sera incomplet`);
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

/* findInsertRank: Research the rank where to insert the new item article    
   ---------------
    Parameters:
    1- itemId         - The Item Id used to create the item article
    2- ItemColor      - The color of the item Id used to create the item article

    The item / color different articles need to be displayed on order.
    The cart is in sequence, however the creation of one article for each item contained is asynchronous so there is no guarantee the articles
    rendering will respect the cart order.
    To ensure order is respected, routine will pull all articles off the DOM and research the rank where to insert the one being processed.
    If it does not find any higher reference to insert before then it returns null.
*/
function findInsertRank(itemId) {
    let elementReference = null;
    const elementList = document.querySelectorAll("#items > a");
    for (const element of elementList) {               
        if (itemId < element.dataset.id) {
                return elementReference = element;                                                   
            }
    }    
    return elementReference;
}

/* getStorageCart: Retrieve existing cart off storage to create a working array or create it empty if local storage is empty
   ----------------
*/
function getStorageCart() {
    try {
        if (localStorage.getItem("currentCart") !== null) {
            return(currentCart = JSON.parse(localStorage.getItem("currentCart")));        
        } else {
            return(currentCart = []);
        }
    }   catch(error) {
            alert('Récupération d\'un éventuel panier a échoué');
        } 
}
 
/* buildStyle: Build a style variable to potentially add inline style attribute via the new element function.   
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

// END OF FUNCTION DEFINITION SECTION

// Root source code
fetchAllItems(hostServer, apiItem)
    .then(getReturn => 
        {
            for (let i in getReturn) {
                loadItem2WelcomePage(getReturn[i]._id, getReturn[i].name, getReturn[i].imageUrl, getReturn[i].description, getReturn[i].altTxt);                
            }
        }) 
    .catch(err => {
                    alert(`${err} détectée pendant le chargement des articles. Réessayez un peu plus tard. Si le problème persiste contactez le support technique`);
            });
try {
// Get cart and display totals
    getStorageCart();
    const cartLink = document.querySelector("a[href='./cart.html']");    
    let cartLinkElement = newElement('span', [] , [['style', buildStyle(cartCounterStyle)]], '0');  
    updateDOMTotals([[cartLinkElement, 'quantity']]);
    cartLink.append(cartLinkElement);    
// Listener on link "Panier" - click
    cartLink.addEventListener('click', onCartClick);  
}   catch (error) {
        alert(`${error}: Une erreur s\'est produite durant la récupération des données du panier`);
    }
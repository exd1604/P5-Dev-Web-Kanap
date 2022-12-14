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
   Parameters:
   host: <string> - http address:port of the server
   api : <string> - api path for a full set of items

   return: { object }
    Uses the fetch method.
    All items from the back server expected to be loaded to the page. 
    Each of the pulled item is then passed to function loadItem2WelcomePage    
*/
async function fetchAllItems(host, api) {
        const reply = await fetch(host + api, {
                                    method: "GET", 
                                    headers: {
                                        "Accept": "application/json"
                                    }
                            })                         
        if (reply.ok === true) {                              
            return reply.json();
        } 

        throw 'error';   
}

/* loadItem2WelcomePage: Load item to the DOM.
   ---------------------
   Parameters:
   itemId:          <string> - Item code - _id property of the fetch return object 
   itemName:        <string> - Item name - name property of the fetch return object
   itemImage:       <string> - Item image - imageURL property of the fetch return object
   itemDescription: <string> - Item descrption - description property of the fetch return object
   itemAltTxt:      <string> - Alternate text - altTxt property of the fetch return object
   
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
   ??????????????
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
            console.log(`Le chargement de l\'article ${itemId} dans le DOM a ??chou??. Le chargement sera incomplet`);
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

/* findInsertRank: Research the rank where to insert the new item article    
   ---------------
    Parameters:
    itemId:     <string> - The Item Id used to create the item article

    return: <HTMLElement>

    The item different articles need to be displayed as a catalog. The load items to DOM is a sery of function loadItem2WelcomePage calls. 
    As asynchronous processes (promise part of the fetch routine) there is no guarantee the articles get delivered & rendered in sequence.
    To ensure order is respected, routine checks what has been actually inserted to DOM so far and research the rank where to insert 
    the one being processed. If it does not find any higher reference to insert before then it returns null.
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
   Parameters:
   NONE

   return:
   [array]
*/
function getStorageCart() {
    try {
        if (localStorage.getItem("currentCart") !== null) {
            return(currentCart = JSON.parse(localStorage.getItem("currentCart")));        
        } else {
            return(currentCart = []);
        }
    }   catch(error) {
            alert('R??cup??ration d\'un ??ventuel panier a ??chou??');
        } 
}
 
/* buildStyle: Build a style variable to potentially add inline style attribute via the new element function.   
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
function updateDOMTotals(elements) {
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

   Scans the currentCart array initially loaded and sums quantities and values found to get totals.

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

// END OF FUNCTION DEFINITION SECTION

// Root source code            
fetchAllItems(hostServer, apiItem)    
    .then(getReturn => 
        {
            for (let i in getReturn) {
                loadItem2WelcomePage(getReturn[i]._id, getReturn[i].name, getReturn[i].imageUrl, getReturn[i].description, getReturn[i].altTxt);                
            }
        }) 
    .catch(err =>  {
        alert('Erreur pendant le chargement des articles. R??essayez un peu plus tard. Si le probl??me persiste contactez le support technique');
    })

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
        alert(`${error}: Une erreur s\'est produite durant la r??cup??ration des donn??es du panier`);
    }
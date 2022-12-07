/* Global Variables:
   ----------------
*/
const hostServer      = 'http://localhost:3000/';
const apiItem         = 'api/products/';
const orderSuffix     = 'order';
//
let enteredQuantity = 0;
let selectedColor = '';
let totals = [0,0];
let checkDomLaps  = 500;
let checkDomTimer = 0;
let cartStorageRefresh = [];
let formFields = [];
const formInputs = ['firstName', 'lastName', 'address','city','email'];
const valueFormat = {priceValue:    {   minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                        style: 'currency',
                                        currency: 'EUR'              
                                    },
                     totalValue:    {   minimumFractionDigits: 2,
                                        maximumFractionDigits: 2                                                      
                                    }
                    };

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

const quantityStyle = {
    fontWeight: ['font-weight:', '500;'],
    color: ['color:', '#fbbcbc;'],
    textAlign: ['text-align:', 'center;']       
}
    
/* FUNCTIONS:
   ---------
*/
/*
   getStorageCart: Retrieve existing cart off storage to create a working array or create it empty if local storage is empty
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
    try {
        const reply = await fetch(host + api + item, {
                                    method: 'GET',
                                    headers: {
                                        "Accept": "application/json"
                                    }
                            })
        if (reply.ok === true) {
            return reply.json();
        }
        
        throw new Error(`Erreur de communication avec le serveur. Impossible de charger les informations détaillées du produit ${item}`);

    }   catch(error) {
            console.log('Remote server failed to respond');
        }
}

/* updateCurrentCart: Aggregates additional item elements to the currentCart    
   ------------------
   Parameters:
   singleItem:  <string>    - Item Code being submitted for load to DOM (Kicked off when fetch promise is resolved)
   data:        { object }  - Object body returned by the fetch response
   
   Function called for each item fetched. 
   This loads to the cart array the necessary additional data to manage items. (product picture, alternate text, product name and price).
   Those elements are not stored in the local storage and get pulled from back end server each time this page gets loaded and/or refreshed.
*/
function updateCurrentCart(singleItem, data) {            
    singleItem[3] = data.imageUrl;
    singleItem[4] = data.altTxt;
    singleItem[5] = data.name;
    singleItem[6] = data.price;    
    return singleItem;       
}

/* updateDocumentTitle:
   --------------------
   Parameters:
   NONE

   Update Page Title
*/

function updateDocumentTitle() {  
    document.title = "Gérer votre panier";    
}

/* loadItem2DOM: Feeds the DOM with each item found in the cart    
   ------------
   singleItem:  [array] - Array containing the item that needs to get loaded detailed data (id, color, Name, description 
                          image, alttxt, price, quantity) 

   Called for each item found in the cart loaded from local storage.
   A new article node gets created and loaded to the DOM to make it available to user.  
   The process:
   1 - Create the new article element and set required class and attributes.
   2 - The division expected to contain the product image details is created
   3 - The division to contain the item content (Description division / Settings division (Price & Quantity))
   4 - Once above complete, process searches where to insert the new article. Items need to be displayed by item / color. As the load function 
       is asynchronous, there is no guarantee the DOM will be loaded in the cart sequence. To ensure the rending is correct, process checks
       the already loaded articles and inserts the new one at its expected place. 
*/
function loadItem2DOM(singleItem) {          
// 1- Build new item article main container
    const newCartArticle    = newElement('article', ["cart__item"] , [['data-id', singleItem[0]], ['data-color', singleItem[1]], ['data-name', singleItem[5]]], null);

// 2 - Product image division
// Container
    const newImageContainer = newElement('div', ["cart__item__img"], [], null);
// Component
    const newImage          = newElement('img', [], [['src', singleItem[3]], ['alt', singleItem[4]]], null);  
// Complete step 2 - Link parent & children
    newImageContainer.appendChild(newImage);        

// 3 - Start item content structure
    const newItemContent = newElement('div', ["cart__item__content"] , [], null);

// Item description division (Item Description)
// Container
    const newItemContentDescription      = newElement('div', ["cart__item__content__description"] , [], null);
// Components
    const newItemContentDescriptionH2    = newElement('h2', [] , [], singleItem[5]);
    const newItemContentDescriptionColor = newElement('p', [] , [], singleItem[1]);        
    const newItemContentDescriptionPrice = newElement('p', [] , [], singleItem[6].toLocaleString("fr-FR", valueFormat.priceValue));
// Link parent & children
    newItemContentDescription.append(newItemContentDescriptionH2, newItemContentDescriptionColor, newItemContentDescriptionPrice);

// Item Settings division (Quantity & delete "button") 
// Container
    const newItemContentSettings                  = newElement('div', ["cart__item__content__settings"] , [], null);
// Components  
    const newItemContentSettingsQuantity          = newElement('div', ["cart__item__content__settings__quantity"] , [], null);
    const newItemContentSettingsQuantityP         = newElement('p', [] , [], 'Qté :');
    const newItemContentSettingsQuantityInput     = newElement('input', ["itemQuantity"] , [['type', 'number'], ['name', 'itemQuantity'],['min', '1'],['max', '100'],['value', singleItem[2]],], null);
    
    const newItemContentSettingsQuantityErrorMsg  = newElement('div', [] , [], null);
    const newItemContentSettingsQuantityErrorMsgP = newElement('p', [] , [['style', buildStyle(quantityStyle)]], null);
    newItemContentSettingsQuantityErrorMsg.appendChild(newItemContentSettingsQuantityErrorMsgP);
// Link parent & children
    newItemContentSettings.appendChild(newItemContentSettingsQuantity).append(newItemContentSettingsQuantityP, newItemContentSettingsQuantityInput);    
    newItemContentSettings.appendChild(newItemContentSettingsQuantityErrorMsg);    

// Item Settings delete   
// Container
    const newItemContentSettingsDelete  = newElement('div', ["cart__item__content__settings__delete"] , [], null);
// Component
    const newItemContentSettingsDeleteP = newElement('p', ["deleteItem"] , [], 'Supprimer');
// Link parent & children
    newItemContentSettings.appendChild(newItemContentSettingsDelete).append(newItemContentSettingsDeleteP);

// Complete Step 3 - Merge item content components into item content        
    newItemContent.append(newItemContentDescription, newItemContentSettings);  
  
// Complete step 1 - Merge image (step 2) and item content (step 3) into item article
    newCartArticle.append(newImageContainer, newItemContent);

// Insert the new item article at its "place" into the DOM  
    const parentNode = document.querySelector("#cart__items");
    let itemArticleReference = findInsertRank(singleItem[0], singleItem[1]); 
    parentNode.insertBefore(newCartArticle, itemArticleReference);    
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
    itemId:     <string> - The Item Id being loaded
    itemColor:  <string> - The color of the item being processed

    return: <HTMLElement>
    
    The item/color articles need to be displayed on screen. The load of item/colors to DOM is a sery of function loadItem2DOM calls. 
    As asynchronous processes (promise part of the fetch routine) there is no guarantee the articles get delivered & rendered in sequence.
    To ensure order is respected (By item / color), routine checks what has been actually inserted to DOM so far and research the rank where to 
    insert the one being processed. If it does not find any higher reference to insert before then it returns null.
*/
function findInsertRank(itemId, itemColor) {
    let elementReference = null;
    const elementList = document.querySelectorAll("article.cart__item");
    for (const element of elementList) {               
        if (itemId+itemColor < element.dataset.id+element.dataset.color) {
                return elementReference = element;                                                   
            }
    }    
    return elementReference;
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
*/
function sumCartTotals() {
    let totals = [0, 0];
    currentCart.forEach((item, index) => {
        totals[0] += item[2];
        totals[1] += item[6]*item[2];
    })
    return totals;    
}


/* startCheckDOM: Starts a timer submitting the checkDomLoaded function on a controlled regular basis 
   -------------
   Parameters:
   NONE

    The load of cart items is submitting through various asynchronous threads. One for each item.
    Listeners to allow user interaction with the data can occur only once all cart is loaded to the DOM. 
    This function submits checkDomLoaded function:
    - Every checkDomLaps milliseconds
    - For checkDomCounter times 
*/
function startCheckDOM() {
    localStorage.setItem("DOMCounter", 0);
    checkDomTimer = setInterval(checkDomLoaded, checkDomLaps, currentCart.length);    
}

/* stopCheckDOM: Stop the process that submits the checkDomLoaded routine  
   -------------
   Parameters:
   timer:   <string>    - The timer id created by the setInterval run above
   
   It can be kicked in 2 cases:
   1 - DOM is confirmed fully loaded so is available for user action
   2 - DOM is not confirmed loaded after a predetermined number of times (chekDomCounter) (This means abnormal process time during the cart load)
*/
function stopCheckDOM(timer) {
        localStorage.removeItem("DOMCounter");              
        clearInterval(timer); 
        checkDomTimer = 0;           
}

/* checkDomLoaded: Scans DOM to ensure all items from cart have been actually loaded to the DOM
   --------------
   Parameter:
   checkDomCounter: 
   Once all items have been loaded to the DOM this function:
   - Performs the build totals routine and refresh the DOM with totals
   - Kicks the listeners off for each item article to track "delete" requests
   - Stops the timer that submits this function every checkDomLaps milliseconds for checkDomCounter times.
   
   Every time this routine is submitted (setinterval), counter is incremented by 1 and saved in local Storage.

   If counter reaches the number of items in cart and the DOM is not confirmed loaded then it stops the timer and displays a message alerting 
   user something wrong occurred during the cart load.
   
   The checkDomCounter parameter equals the cart length. So if more items in cart more occurrencece of this routine run.  
*/
function checkDomLoaded(checkDomCounter) { 
    try {
        let counter = localStorage.getItem("DOMCounter"); 
        if (document.querySelectorAll('article.cart__item').length == currentCart.length) { 
    // DOM loaded ok so manage actions on global elements
    // 1 - Title  
            updateDocumentTitle();
    // 2 - Create a cart quantity counter element and attach it to DOM in header nav next to cart.HTML link
            const cartLink = document.querySelector("a[href='./cart.html']");    
            cartLinkElement = newElement('span', [] , [['style', buildStyle(cartCounterStyle)]], '0');      
            cartLink.append(cartLinkElement);    
    // 3 - Build and update cart totals
            updateDOMTotals([[cartLinkElement, 'quantity'], [document.querySelector('#totalQuantity'), 'quantity'], [document.querySelector('#totalPrice'), 'value']]);
    // 4 - Start listeners            
            startCartListeners();                        
    // 5 - Stop DOM loaded watcher
            stopCheckDOM(checkDomTimer);                        

    // DOM load failed or took too long. Warn user and redirect him to welcome page.
        } else if (checkDomCounter == localStorage.getItem("DOMCounter")) {                
                    stopCheckDOM(checkDomTimer);
                    alert('Le chargement de votre panier n\'est pas complet. La procédure est interrompue car le résultat ne peut être garanti. Vous êtes redirigé vers la page d\'accueil. Nous sommes navrés de ce désagrément.');
                    location = './index.html';                
                }   else { 
                            counter++;   
                            localStorage.setItem("DOMCounter", counter);  
                        }
    }   catch   {   console.log('A technical error occurred during the DOM loaded check process');
                    alert('Un incident technique est survenu pendant le chargement. Certains services ne sont peut être pas actifs et la gestion de votre panier va être incertaine. Contactez le support');
                }
}

/* startCartListeners: Kick the various cart listeners off to catch user actions 
   -------------------
   Parameters:
   NONE

   This initiates:
   - onItemEvent: call back functions on item listeners
     1 - Click on the "Supprimer" paragraph to capture the delete item user request
     2 - Change on the quantity to capture the change quantity user request 
   - onFormEvent: Call back functions on form listeners
     1 - Click on the button "Commander!" user request to pass an order
     2 - Change on each of the form input field.  
*/
function startCartListeners() {
    try {
// Each item card quantity change
        document
        .querySelectorAll('input.itemQuantity')
        .forEach(itemQuantity => {itemQuantity.addEventListener('change', onItemEvent)});  

// Each item card delete click
        document
        .querySelectorAll('p.deleteItem')
        .forEach(deleteItem => {deleteItem.addEventListener('click', onItemEvent)}); 

// Each form input change event
        document
        .querySelectorAll('div.cart__order__form__question > input')
        .forEach(formInputElem => {formInputElem.addEventListener('change', onFormEvent)});

// Form submit (click on input type submit))
        document.querySelector('#order').addEventListener('click', onFormEvent);                                                              
    }   catch   {   console.log('An error occurred during the listener\'s start process');
                    alert('Un incident technique est survenue pendant le démarrage de certains services. Vos actions sur la page ne vont pas être capturées correctement. Réessayez et contactez le support technique si le problème perdure.');
                }
}

/* onItemEvent: Process user requested event captured by the listener 
   ------------
   Parameters:
   event    { object type event}

   - The called back function is the same for a change item quantity request or a delete cart item request. Before processing the action itself
     prerequisites common actions are completed to detect item/color to work on and its corresponding cart index    
        - Related article is researched (To get the item id and color to process)
        - Once item / color found, the currentCart index is researched
   - Depending on the event type (click (delete), change (quantity)) the delete or quantity actual action is performed
   - Once done, copy the 3 first elements of each item (Item id, color, quantity) to an empty working array used to refresh the local storage.
     This reflect the change to storage otherwise, if user leaves the page changes will be lost.
*/
function onItemEvent(event) {        
    const itemArticle     = event.currentTarget.closest("article");
    const id2Amend        = event.currentTarget.closest("article").dataset.id;
    const color2Amend     = event.currentTarget.closest("article").dataset.color;    
    const itemName        = event.currentTarget.closest("article").dataset.name;        
    const enteredQuantity = fixNan(event.currentTarget.value, 10);        
    const cartItemFound   = currentCart.findIndex(element => element[0] == id2Amend && element[1] == color2Amend);

    switch(event.type) {
// Change: Only one event setup on change: User requested a quantity change on an item/color 
        case 'change':
            const elementQuantity = event.currentTarget; 
            const elementQuantityErrorMsgP = event.currentTarget.parentNode.nextSibling.firstChild;                                

            if (enteredQuantity > 0 && enteredQuantity <= 100) {  
                    elementQuantity.style.backgroundColor = null;
                    elementQuantityErrorMsgP.textContent = ' ';                
                    currentCart[cartItemFound][2] = enteredQuantity;             
                    cartStorageUpdate();                    
                    updateDOMTotals([[cartLinkElement, 'quantity'], [document.querySelector('#totalQuantity'), 'quantity'], [document.querySelector('#totalPrice'), 'value']]);                                         
                    
            } else {
                elementQuantity.style.backgroundColor = '#fbbcbc';
                elementQuantityErrorMsgP.textContent   = 'La quantité entrée est invalide. Doit être comprise entre 1 et 100 maximum';
                elementQuantity.focus();                                         
            }

        break;

// Click: Only one event setup on click: User requested to remove an item/color off his cart
        case 'click':
            currentCart.splice(cartItemFound, 1);
            itemArticle.remove();
            cartStorageUpdate();                                             
            updateDOMTotals([[cartLinkElement, 'quantity'], [document.querySelector('#totalQuantity'), 'quantity'], [document.querySelector('#totalPrice'), 'value']]);
            
            if (currentCart.length == 0) {
                alert('Votre dernière suppression va vider le panier. Vous aller être rediriger vers la page d\'accueil');                
                location = './index.html';
            }   else {
                    alert(`Article ${itemName} couleur ${color2Amend} va être supprimé et le panier va s'actualiser`);            
                }
        break;
        default:
            console.log(`Sorry, event type ${event.type} n'est pas pris en compte`);
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
    
/* cartStorageUpdate: Pulls 3 first elements of currentCart (ItemId, color, Qty) into a working array to push to local storage for update 
   ------------------
   Parameters:
   NONE

   In order to ensure the changes are not lost (user leaves the page) a refreshed version of the currentCart needs to be saved in local storage.
   The local storage records only the itemId, color, qty where the currentCart contains more columns as it also stores the name, image, alt text,
   & price
   To do so the routine:
   1 - goes through currentCart and insert the 3 first elements of the being processed rank into a working array  
   2 - Update the local storage with the resulting working array
*/
function cartStorageUpdate() {
    cartStorageRefresh = [];         
    currentCart.forEach((item) => {
        cartStorageRefresh.push([item[0], item[1], item[2]]);
    });
    localStorage.setItem("currentCart", JSON.stringify(cartStorageRefresh));    
}

/* onFormEvent: Process captured user request on form 
   ------------
   Parameters:
   event    { object type event}

   2 types of event can occur on the form:
    1 - Change: User has keyed information in the different form fields. Those entries need to be validated
    2 - Click:  User has required an order. If form fields are valid then a POST request is prepared and transmitted to the back end server.
                Back End server expected to return an order number. (Or an error will be captured).     
*/
function onFormEvent(event) { 

    switch(event.type) {
// Change: Only one event setup on change: User entered data in form fields that need to get validated
            case 'change':
                checkForm(event);  
            break;
    
// Click: Only one event setup on click: User click on button "Commander!" to pass an order
            case 'click':
                event.preventDefault();
                const formError = checkForm(event);
                if (!formError) {                    
// format contact object
                        let contact = {};
                        getFormFields();
                        formFields.forEach((input, index) => {
                                                            contact[input] = document.querySelector('#'+input).value;  
                                                        })
//  Based on cart content format item array pulling item id's only once for each
                        
                        let products = [];
                        currentCart.forEach((input, index) => {
                            if (!products.find(element => element == input[0])) {products.push(input[0])};
                        })

// Format the post creating an object merging the contact object and item array to transmit to the back end server
                        const postRequest = {};
                        postRequest.contact = contact;
                        postRequest.products = products;
// Send request form to back end server
                        sendForm(postRequest);
                    };
            break;

            default:
                console.log(`Sorry, event type ${event.type} n'est pas pris en compte`);
    }
}

/* checkForm: Perform the form input's check(s) 
   ----------
   Parameters:
   event    { object type event}

   2 modes: Individual field or entire form 
    The mode is defined by the id retreived from the event. 
       
    1 - Field change event: 
    .......................
        The array formFields is loaded only with the event id related to the changed field that kicked the event off
        
    2 - Button "Commander" click: 
    .............................
        The event id in that case is "order" (HTML): This fills the formFields array with all fields existing in the form. 
        Then process loops on array and perform the data quality check for each field. 
    
    Once array filled (with one or several entries), the process performs the check routine on each entry of the array.
    It shoots an error if it finds one.
    The focus is set:
    - On first field found in error for a global form check 
    - OR on the field being checked if this is the single field mode. In that case any previous individual field in error won't get corrected
      and left in error (Styles and error message visible) but not the focus.     
*/
function checkForm(event) {    
    const formFieldRegEx = {
        firstName:  /^[A-Z][a-zé]+(-[A-Z][a-zé]+)?(\s[A-Z][a-zé]+(-[A-Z][a-zé]+)?){0,2}$/,        
        lastName:   /^[A-Z][\']?[a-z]+([\s-][A-Z][\']?[a-z]+){0,5}$/,        
        address:    /^\d{1,4}\s(rue|avenue|boulevard|place|allée|chemin|route|square)\s[A-Za-z][\']?[A-Za-z]+([\s-][A-Za-z0-9][\']?[A-Za-z0-9]{0,}){0,6}$/i,        
        city:       /^[A-Za-z][\']?[a-z]+([\s-][A-Za-z][\']?[A-Za-z]+){0,6}$/,
        email:      /^[a-z0-9-_.]+@[a-z0-9-_.]+\.[a-z]{2,6}$/
    }
    
    let eventTargetId = event.currentTarget.id;    
    if (eventTargetId == 'order') 
    {
        getFormFields();
               
    }   else{                
            formFields = [];
            formFields.push(eventTargetId);
        }
    
    let error = false;
    let focus = false;
    formFields.forEach((input, index) => {        
        let element = document.querySelector(`#${input}`);
        let elementError = document.querySelector(`#${input}ErrorMsg`);        
        
        const formFieldError = checkFormField(input, formFieldRegEx[input], element, elementError);
        if (formFieldError) {
            if ((formFields.length > 1 && !focus) || formFields.length == 1) {
                element.focus();  
                focus = true;              
            }                    
            error = true;
        }
    })

    return error;
}

/* getFormFields: Retrieves the fields embedded in the form  
   --------------
    parameters:
    NONE
    
    This feeds an array with the different form fields pulled from the form entries.
    This is used in the whole event form when user clicks on "Commander!" button to place the order or when submitting the order to build the
    form object to post to the back end server
*/
function getFormFields() {
    formFields = [];
    document.querySelectorAll('.cart__order__form__question > input')
        .forEach((input, index) =>  {
                                        formFields.push(input.id);
                                    })    
}

/* checkFormField: Runs the actual data quality check on form field 
   ---------------
    parameters:
    input           <string>    - Input id for each input field on form
    regEx           <string>    - Property value of object formFieldRegEx for the input field being processed
    element         HTMLElement - Input form HTML Element - style when error (Background color)     
    elementError    HTMLElement - Error area related to the input form element (Receives the error message to display when error)
    
    During the form validation in checkFormFields function, each field is checked to ensure data entered are valid before sending them to 
    the back end server.
   
    When an error cycle is performed on a field the process:
    - Prior to the check itself, styles are set off and formfield text cleared (Function called with parameter 'off')
   
    - If an error is detected on the field: (Function called with parameter 'on')
        a - The field background is set to #fbbcb
        b - The error field below the field is:
            1 - Error text is loaded to the DOM to make it visible.
            2 - Its font weight is set to 500 
*/
function checkFormField(input, regEx, element, elementError) {
    const formFieldErrorMsg = {
        firstName: ['* Lettres uniquement. Initiale de chaque prénom en majuscule. Jusqu\'à 3 prénoms possibles. Prénom composé séparé par un -'],
        lastName:  ['* Lettres uniquement. Initiale de chaque composant du nom en majuscule. Caractères \' , - et espace acceptés'],                    
        address:   ['* Format adresse attendu: N° de voie, Type de la voie, Nom de la voie séparés par un espace'],                   
        city:      ['* Format ville attendu: De 1 à 7 mots séparés par un espace ou un tiret (-)'],                   
        email:     ['* Format email invalide - identifiant@serveur.domaine']
    }
        
    if (regEx.test(element.value)) {
        element.style.backgroundColor = null;
        elementError.style.fontWeight = null;                
        elementError.textContent = '';
        return false; 

    }   else {
            element.style.backgroundColor = '#fbbcbc';                          
            elementError.style.fontWeight = '500';
            elementError.textContent = formFieldErrorMsg[input][0];                    
            return true;         
        }
}

/* sendForm: Prepare the form the and POST it to the back end 
   --------
   Parameters:
   postRequest  { object of objects }

   - Retrieves form fields 
   - Perform checks on each field and display an error message in the DOM if in error
   - If a clean sheet, process the form submission and kick the POST request to the back end server
*/
function sendForm(postRequest) {
    // Fetch back end server to post order and hopefully get an order number back
    postOrder(hostServer, apiItem, orderSuffix, postRequest)                     
        .then(postReturn => orderPage(postReturn))     
        .catch(err => {alert('Un erreur s\est produite pendant la soumission de votre commande. Commande non confirmée');}); 
}

/* postOrder: Fetch an order request including the cart content to the back end server   
   ----------
   Parameters:
   host             <string> - host server and port to send the request to (Refer to global variables)
   api              <string> - api path to reach (Refer to global variables)
   orderSuffix      <string> - Suffix for the api (Refer to global variables)
   postRequest      { object of objects } - Request to post to the back end server when submitting an order. (Contains a user form object & an array of items ordered)

   return:
   { object } - Containing the order number allocated on back end server as well as the user form 

   The url is composed of fix value concatenated with order/ suffix
   The function uses the fetch method.   
   Body is:
   - Form entries.
   - Array of items contained in the cart
*/
async function postOrder(host, api, orderSuffix, postRequest) {    
    try {
        const reply = await fetch(host + api + orderSuffix, {
                                    method: 'POST',
                                    headers: {
                                        "Accept": "application/json",
                                        "Content-Type": "application/json"
                                    },
                                    body: JSON.stringify(postRequest)
                                })
        if (reply.ok === true) {
                return reply.json();
        }        
        throw new Error(`Le serveur distant a répondu négativement. Votre commande n\'est pas confirmée.`);

    }   catch(error) {
            alert('Le serveur distant ne répond pas. Enregistrement de votre commande impossible')
        }
} 

/* orderPage: Redirect user to the confirmation frame displaying the returned order number   
   ---------
   Parameters:
   order    { object }  - Object returned by the fetch response
   
   When POSTING cart to the back end server is successfull, an order number is returned, captured and confirmation page gets displayed.
*/
function orderPage(order) { 
// Order number is confirmed and is going to be displayed - Existing cart can be removed off locale storage
    localStorage.removeItem('currentCart');          
// Shoot order confirmation page
    location = './confirmation.html?orderId='+order.orderId;    
}

// MAIN PROCEDURE
// Load cart to DOM
// 1 - Pull it off storage
if (getStorageCart().length > 0) {  
    currentCart.forEach((singleItem, index) => {                                        
// 2 - Fetch each item to load item data to DOM
        fetchSingleItem(hostServer, apiItem, singleItem[0])
            .then(getReturn => updateCurrentCart(singleItem, getReturn)) 
            .then(updateCartReturn => loadItem2DOM(updateCartReturn))
            .catch(err => {console.log('Error occurred while loading cart. Load potentially partial')});                                                                     
    });
 
    startCheckDOM();                   
    
}   else {
        alert("Chargement inutile - Votre panier est vide.");
    }
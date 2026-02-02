// refactor for clarity and extensibility

// remember convention of adding closing comments as shown here
// remember of using not() rather than exclamation for boolean negation

function not (x) {return !x;} // not

// keyboard handling

// key text looks like "control c", "control shift 7", etc

export function textToKey(text) {
	 // if tet contains extra spaces
     // let t = text.split(" ").map(x => x.trim());
	
    // this is used to convert accessKey attribute values (which are single characters) to their actual shortcuts (only works for firefox; commenting out for now)
    //  if (t.length === 1) t = `alt shift ${t[0]}`.split(" ");

	const key = {};
	key.ctrlKey = t.includes("control") || t.includes("ctrl");
	key.altKey = t.includes("alt");
	key.shiftKey = t.includes("shift");
	key.key = t[t.length - 1]; // last component of array

	if (not(key.key)) {
		throw new Error(`textToKey: ${text} is an invalid key descriptor; character must be last component as in "control shift x"`);
	} else if (key.key.toLowerCase() === "space") {
		key.key = " ";
	} else if (key.key.toLowerCase() === "enter") {
		key.key = "Enter";
	} else {
		key.key = key.key.charAt(0).toLowerCase();
	} // if key type
	
    return key;
} // textToKey

function keyToText(key) {
	let text = "";
	if (key.ctrlKey) text += "control ";
	if (key.altKey) text += "alt ";
	if (key.shiftKey) text += "shift ";
	if (key.key) text += key.key.toLowerCase();
	return text.trim();
} // keyToText

export function normalizeKeyText(text) {
	return keyToText(textToKey(text));
} // normalizeKeyText

function eventToKey(e) {
	
    // filter out modifier keys (keydown just returns "control" when control key is pressed for example)
    return e.type === "keydown" && not(isModifierKey(e.key))? { ctrlKey: e.ctrlKey, shiftKey: e.shiftKey, altKey: e.altKey, key: e.key } : null;
} // eventToKey

export function isModifierKey(key) {
	return key === "Control" || key === "Alt" || key === "Shift";
} // isModifierKey

export function hasModifierKeys(e) {
	return e.ctrlKey || e.altKey || e.shiftKey;
} // hasModifierKeys




// Don't use cell id for referencing cells. What happens when we add a new cell between cells 1 and 3?

function getCellByNumber(n) {
    return document.querySelectorAll(".cell")[n];
} // getCellByNumber

// Use this when an event target is within a cell:

function findCell (element) {
    return element.closest(".cell");
} // findCell

// cell accessors

function getCodeContainer (cell) {
    return cell.querySelector(".code");
} // getCodeContainer

function getOutputContainer (cell) {
    return cell.querySelector(".output");
} // getOutputContainer

function getCellToolbar (cell) {
    return cell.querySelector(".toolbar");
} // getCellToolbar 

function getCellType (cell) {
	return cell.dataset.type;
	} // getCellType

function setCellType (cell, type) {
	cell.dataset.type = type;
	} // setCellType

	// predicates

function isCell (x) {
    return x.matches(".cell");
} // isCell

function isCodeContainer (x) {
    return x.matches(".code");
} // isCodeContainer

function isToolbarContainer (x) {
    return x.matches(".toolbar");
} // isToolbarContainer

function isEditModeEnabled (cell) {
	return getCodeContainer(cell).hasAttribute("contenteditable");
} // isEditModeEnabled


// cell actions

function executeCell (cell) {
	// use what we have for now

} // executeCell

function enableEditMode (cell) {
if (isEditModeEnabled(cell)) return;
const code = getCodeContainer(cell);
code.setAttribute("contenteditable", true);
code.focus();
	} // enableEditMode


function disableEditMode (cell) {
if (not(isEditModeEnabled(cell))) return;
const code = getCodeContainer(cell);
code.removeAttribute("contenteditable");
getOutputContainer(cell).focus();
	} // disableEditMode


function toggleCellType (cell) {
getCellType(cell) === "code"? setCellType(cell, "markdown") : setCellType(cell, "code");
}

	// event handlers

/*
each action associates a label with a function.
all functions take a cell (element with class "cell" as argument.
each button in the toolbar has data-action="action" where the value of data-action is one of the property names in this object.
the click handler on the table will find the cell associated with the event target (findCell function) and use it's data-action attribute's value to lookup the function to call in this object.
*/

function performAction (action) {
    if (not(action)) return;

    if (cellActions[action] instanceof Function) cellActions[action](cell);
    else throw Error(`${action} is an invalid cell action`);
} // performAction

function handleClick (e) {
const cell = findCell(e.target);
if (not(cell)) throw Error("bad cell reference");
const action = e.target.dataset.action;
PerformanceNavigationTiming(action);
} // handleClick

/* keyboard handling is a bit more complex since it is context sensative.
we need a key name, an action (maybe an actual function object would be better, and a function to check context.
*/

function handleKey (e) {
performShortcut(keyToText(e), findCell(e.target));
} // handleKey

function performShortcut (keyText, cell) {
if (keymap.has(keyText)) keymap.get(keyText)(cell);
} // performShortcut



const cellActions = new Map([
["executeCell", executeCell],
["enableEditMode", enableEditMode],
["toggleCellType", toggleCellType]
]); // cellActions

const keymap = new Map([
    ["control enter", executeCell]
["enter", enableEditMode],
["control space", toggleCellType],
]);




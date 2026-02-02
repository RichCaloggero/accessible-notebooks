// Accessible Notebooks Frontend (Integrated Server Version)
// For use with server_integrated.py - uses relative URLs

const API_BASE = '/api';  // Relative URL - no CORS needed!

// ============================================================================
// Utility Functions
// ============================================================================

function not(x) { return !x; } // not

// Keyboard handling utilities

function textToKey(text) {
    const t = text.split(" ").map(x => x.trim()).filter(x => x);
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
    if (key.key) {
        // Convert space character back to "space" word
        if (key.key === " ") {
            text += "space";
        } else {
            text += key.key.toLowerCase();
        }
    } // if key.key
    return text.trim();
} // keyToText

function eventToKey(e) {
    // Filter out modifier keys (keydown just returns "control" when control key is pressed)
    return e.type === "keydown" && not(isModifierKey(e.key))
        ? { ctrlKey: e.ctrlKey, shiftKey: e.shiftKey, altKey: e.altKey, key: e.key }
        : null;
} // eventToKey

function isModifierKey(key) {
    return key === "Control" || key === "Alt" || key === "Shift";
} // isModifierKey

function hasModifierKeys(e) {
    return e.ctrlKey || e.altKey || e.shiftKey;
} // hasModifierKeys

// ============================================================================
// Cell Navigation & Accessors
// ============================================================================

function getCellByIndex(n) {
    return document.querySelectorAll(".cell")[n];
} // getCellByIndex

function findCell(element) {
    return element.closest(".cell");
} // findCell

function getCodeContainer(cell) {
    return cell.querySelector(".code");
} // getCodeContainer

function getOutputContainer(cell) {
    return cell.querySelector(".output");
} // getOutputContainer

function getCellToolbar(cell) {
    return cell.querySelector(".toolbar");
} // getCellToolbar

// ============================================================================
// Predicates
// ============================================================================

function isCell(x) {
    return x && x.matches && x.matches(".cell");
} // isCell

function isCodeContainer(x) {
    return x && x.matches && x.matches(".code");
} // isCodeContainer

function isToolbarContainer(x) {
    return x && x.matches && x.matches(".toolbar");
} // isToolbarContainer

function isEditModeEnabled(cell) {
    const code = getCodeContainer(cell);
    return code && code.getAttribute("contenteditable") === "true";
} // isEditModeEnabled

// ============================================================================
// Elements
// ============================================================================

const startKernelBtn = document.getElementById('start-kernel-btn');
const restartKernelBtn = document.getElementById('restart-kernel-btn');
const shutdownKernelBtn = document.getElementById('shutdown-kernel-btn');
const kernelStatus = document.getElementById('kernel-status');
const notebookTable = document.querySelector('.notebook tbody');

// ============================================================================
// State
// ============================================================================

let kernelAlive = false;
let activeCell = null;

// ============================================================================
// Kernel Management
// ============================================================================

function updateKernelStatus(alive) {
    kernelAlive = alive;

    if (alive) {
        kernelStatus.textContent = 'Kernel: Running';
        kernelStatus.classList.add('active');
        kernelStatus.classList.remove('error');
    } else {
        kernelStatus.textContent = 'Kernel: Not Running';
        kernelStatus.classList.remove('active');
        kernelStatus.classList.remove('error');
    } // if alive

    // Enable/disable buttons
    startKernelBtn.disabled = alive;
    restartKernelBtn.disabled = not(alive);
    shutdownKernelBtn.disabled = not(alive);
} // updateKernelStatus

async function startKernel() {
    try {
        startKernelBtn.disabled = true;

        const response = await fetch(`${API_BASE}/start`, {
            method: 'POST'
        });

        const result = await response.json();

        if (result.status === 'ok') {
            updateKernelStatus(true);
        } else {
            kernelStatus.classList.add('error');
        } // if status
    } catch (error) {
        console.error('Error starting kernel:', error);
    } finally {
        startKernelBtn.disabled = false;
    } // try
} // startKernel

async function restartKernel() {
    try {
        restartKernelBtn.disabled = true;

        const response = await fetch(`${API_BASE}/restart`, {
            method: 'POST'
        });

        const result = await response.json();

        if (result.status === 'ok') {
            updateKernelStatus(true);

            // Clear all outputs
            document.querySelectorAll('.output').forEach(output => {
                output.textContent = '';
                output.classList.remove('has-output', 'has-error');
            });
        } // if status
    } catch (error) {
        console.error('Error restarting kernel:', error);
    } finally {
        restartKernelBtn.disabled = false;
    } // try
} // restartKernel

async function shutdownKernel() {
    try {
        shutdownKernelBtn.disabled = true;

        const response = await fetch(`${API_BASE}/shutdown`, {
            method: 'POST'
        });

        const result = await response.json();

        if (result.status === 'ok') {
            updateKernelStatus(false);
        } // if status
    } catch (error) {
        console.error('Error shutting down kernel:', error);
    } finally {
        shutdownKernelBtn.disabled = false;
    } // try
} // shutdownKernel

async function checkStatus() {
    try {
        const response = await fetch(`${API_BASE}/status`);
        const result = await response.json();

        if (result.status === 'ok') {
            updateKernelStatus(result.kernel_alive);
        } // if status
    } catch (error) {
        console.error('Error checking status:', error);
        console.error('Backend server not responding. Please start the backend server.');
    } // try
} // checkStatus

// ============================================================================
// Cell Type Functions
// ============================================================================

function getCellType(cell) {
    return cell.dataset.type || 'code';
} // getCellType

function setCellType(cell, type) {
    cell.dataset.type = type;

    // Update type indicator
    const typeLabel = cell.querySelector('.type-label');
    if (typeLabel) {
        typeLabel.textContent = type === 'markdown' ? 'Markdown' : 'Code';
    } // if typeLabel
} // setCellType

function toggleCellType(cell) {
    const currentType = getCellType(cell);
    const newType = currentType === 'code' ? 'markdown' : 'code';
    console.log(`Toggling cell from ${currentType} to ${newType}`);
    setCellType(cell, newType);
} // toggleCellType

// ============================================================================
// Cell Mode Functions
// ============================================================================

function enableEditMode(cell) {
    if (isEditModeEnabled(cell)) return;

    const codeContainer = getCodeContainer(cell);
    const outputContainer = getOutputContainer(cell);
    const editBtn = cell.querySelector('.edit-btn');
    const cellType = getCellType(cell);

    // For markdown cells with rendered output, clear it
    if (cellType === 'markdown' && outputContainer.classList.contains('markdown-rendered')) {
        outputContainer.textContent = '';
        outputContainer.classList.remove('has-output', 'markdown-rendered');
        outputContainer.removeAttribute('aria-live');
        if (editBtn) editBtn.style.display = 'none';
    } // if markdown rendered

    // Show and enable the code container
    codeContainer.hidden = false;
    codeContainer.setAttribute('contenteditable', 'true');
    codeContainer.setAttribute('tabindex', '-1');
    codeContainer.focus();
} // enableEditMode

function disableEditMode(cell) {
    if (not(isEditModeEnabled(cell))) return;

    const codeContainer = getCodeContainer(cell);
    const outputContainer = getOutputContainer(cell);

    codeContainer.removeAttribute('contenteditable');
    codeContainer.hidden = true;
    outputContainer.focus();
} // disableEditMode

// ============================================================================
// Cell Execution
// ============================================================================

async function executeCell(cell) {
    const codeContainer = getCodeContainer(cell);
    const outputContainer = getOutputContainer(cell);
    const runBtn = cell.querySelector('.run-btn');
    const cellType = getCellType(cell);

    const code = codeContainer.textContent.trim();

    console.log(`Executing cell, type: ${cellType}, code: ${code.substring(0, 50)}...`);

    if (not(code)) {
        return;
    } // if no code

    try {
        // Update UI
        runBtn.disabled = true;
        runBtn.classList.add('executing');
        runBtn.textContent = 'Executing...';
        outputContainer.textContent = '';
        outputContainer.classList.remove('has-output', 'has-error', 'markdown-rendered');

        // Handle markdown cells
        if (cellType === 'markdown') {
            console.log('Rendering markdown client-side...');

            try {
                // Normalize line endings: Windows CRLF to Unix LF
                let cleanedMarkdown = code.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

                // Strip trailing whitespace from each line
                let lines = cleanedMarkdown.split('\n');
                lines = lines.map(line => line.trimEnd());

                // Remove consecutive blank lines (keep max 1)
                let resultLines = [];
                let prevBlank = false;
                for (let line of lines) {
                    let isBlank = line.length === 0;
                    if (not(isBlank && prevBlank)) {
                        resultLines.push(line);
                    } // if not consecutive blank
                    prevBlank = isBlank;
                } // for line
                cleanedMarkdown = resultLines.join('\n');

                console.log('Cleaned markdown:', cleanedMarkdown);

                // Render markdown to HTML using marked.js
                let html = marked.parse(cleanedMarkdown);

                // Remove whitespace between HTML tags
                html = html.replace(/>\s+</g, '><');

                console.log('Rendered HTML:', html);

                // Display the rendered HTML
                outputContainer.innerHTML = html;
                outputContainer.classList.add('markdown-rendered');

                // Set aria-live="off" to prevent double speaking
                outputContainer.setAttribute('aria-live', 'off');

                // Show edit button
                const editBtn = cell.querySelector('.edit-btn');
                if (editBtn) editBtn.style.display = 'block';

                // Focus the output (focus listener will hide the code container)
                outputContainer.focus();
            } catch (error) {
                console.error('Markdown render error:', error);
                outputContainer.textContent = `Error: ${error.message}`;
                outputContainer.classList.add('has-error');
            } // try markdown

            runBtn.disabled = false;
            runBtn.classList.remove('executing');
            runBtn.innerHTML = 'Run<br><small>(Ctrl+Enter)</small>';
            return;
        } // if markdown

        // Execute code via API
        const response = await fetch(`${API_BASE}/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ code })
        });

        const result = await response.json();

        // Remove aria-live for code cells to prevent double speaking
        outputContainer.removeAttribute('aria-live');

        // Display output
        if (result.status === 'ok') {
            if (result.output && result.output.length > 0) {
                const outputText = result.output.map(item => {
                    if (item.type === 'stream') {
                        return item.text;
                    } else if (item.type === 'execute_result') {
                        return item.text;
                    } // if type
                    return '';
                }).join('');

                outputContainer.textContent = outputText;
                outputContainer.classList.add('has-output');
            } else {
                outputContainer.textContent = '(No output)';
            } // if output
        } else if (result.status === 'error') {
            // Display error
            const error = result.error;
            let errorText = `${error.ename}: ${error.evalue}`;

            if (error.traceback && error.traceback.length > 0) {
                errorText = error.traceback.join('\n');
            } // if traceback

            outputContainer.textContent = errorText;
            outputContainer.classList.add('has-error');
        } // if status

    } catch (error) {
        console.error('Error executing cell:', error);
        outputContainer.textContent = `Error: ${error.message}`;
        outputContainer.classList.add('has-error');
    } finally {
        // Reset button
        runBtn.disabled = false;
        runBtn.classList.remove('executing');
        runBtn.innerHTML = 'Run<br><small>(Ctrl+Enter)</small>';
    } // try
} // executeCell

// ============================================================================
// Action & Keymap System
// ============================================================================

const cellActions = new Map([
    ["executeCell", executeCell],
    ["enableEditMode", enableEditMode],
    ["toggleCellType", toggleCellType],
    ["disableEditMode", disableEditMode]
]); // cellActions

const keymap = new Map([
    ["control enter", executeCell],
    ["enter", enableEditMode],
    ["control space", toggleCellType]
]); // keymap

function performAction(action, cell) {
    if (not(action) || not(cell)) return;

    if (cellActions.has(action)) {
        cellActions.get(action)(cell);
    } else {
        console.error(`${action} is an invalid cell action`);
    } // if has action
} // performAction

function performShortcut(keyText, cell) {
    if (not(cell)) return;
    if (keymap.has(keyText)) {
        keymap.get(keyText)(cell);
    } // if has key
} // performShortcut

// ============================================================================
// Event Handlers
// ============================================================================

function handleCellClick(e) {
    const cell = findCell(e.target);
    if (not(cell)) return;

    // Find action from clicked element or its parent
    const actionElement = e.target.dataset.action ? e.target : e.target.closest('[data-action]');
    const action = actionElement ? actionElement.dataset.action : null;

    if (action) {
        e.preventDefault();
        performAction(action, cell);
        return;
    } // if action

    // Screen readers convert Enter/Space on focused elements to click events
    // So clicking on output (or its children, e.g. rendered markdown) should enter edit mode
    if (e.target.closest('.output')) {
        enableEditMode(cell);
    } // if output
} // handleCellClick

function handleCellKeydown(e) {
    const cell = findCell(e.target);
    if (not(cell)) return;

    const key = eventToKey(e);
    if (not(key)) return;

    const keyText = keyToText(key);

    // Allow Enter in code container for newlines
    if (keyText === "enter" && isCodeContainer(e.target)) {
        return; // Allow default behavior
    } // if enter in code

    if (keymap.has(keyText)) {
        e.preventDefault();
        performShortcut(keyText, cell);
    } // if has key
} // handleCellKeydown

function handleFocusIn(e) {
    const cell = findCell(e.target);
    if (not(cell)) return;

    if (isCodeContainer(e.target)) {
        activeCell = cell;
    } // if code container

    // When output gains focus, hide code container
    if (e.target.matches('.output')) {
        const codeContainer = getCodeContainer(cell);
        codeContainer.hidden = true;
        codeContainer.contentEditable = 'false';
        codeContainer.setAttribute('tabindex', '-1');
    } // if output
} // handleFocusIn

// ============================================================================
// Event Listeners
// ============================================================================

// Kernel controls
startKernelBtn.addEventListener('click', startKernel);
restartKernelBtn.addEventListener('click', restartKernel);
shutdownKernelBtn.addEventListener('click', shutdownKernel);

// Notebook table event delegation (all events bubble)
if (notebookTable) {
    notebookTable.addEventListener('click', handleCellClick);
    notebookTable.addEventListener('keydown', handleCellKeydown);
    notebookTable.addEventListener('focusin', handleFocusIn);
} // if notebookTable

// ============================================================================
// Initialize
// ============================================================================

checkStatus();

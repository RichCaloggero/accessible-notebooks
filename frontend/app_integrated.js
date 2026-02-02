// Accessible Notebooks Frontend (Integrated Server Version)
// For use with server_integrated.py - uses relative URLs

const API_BASE = '/api';  // Relative URL - no CORS needed!

// Elements
const startKernelBtn = document.getElementById('start-kernel-btn');
const restartKernelBtn = document.getElementById('restart-kernel-btn');
const shutdownKernelBtn = document.getElementById('shutdown-kernel-btn');
const kernelStatus = document.getElementById('kernel-status');
const notebookTable = document.querySelector('.notebook tbody');

// State
let kernelAlive = false;
let activeCell = null;

// Update kernel status display
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
    }

    // Enable/disable buttons
    startKernelBtn.disabled = alive;
    restartKernelBtn.disabled = !alive;
    shutdownKernelBtn.disabled = !alive;
}

// Start kernel
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
        }
    } catch (error) {
        console.error('Error starting kernel:', error);
    } finally {
        startKernelBtn.disabled = false;
    }
}

// Restart kernel
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
            document.querySelectorAll('output').forEach(output => {
                output.textContent = '';
                output.classList.remove('has-output', 'has-error');
            });
        }
    } catch (error) {
        console.error('Error restarting kernel:', error);
    } finally {
        restartKernelBtn.disabled = false;
    }
}

// Shutdown kernel
async function shutdownKernel() {
    try {
        shutdownKernelBtn.disabled = true;

        const response = await fetch(`${API_BASE}/shutdown`, {
            method: 'POST'
        });

        const result = await response.json();

        if (result.status === 'ok') {
            updateKernelStatus(false);
        }
    } catch (error) {
        console.error('Error shutting down kernel:', error);
    } finally {
        shutdownKernelBtn.disabled = false;
    }
}

// Get cell type
function getCellType(cellNumber) {
    const row = document.querySelector(`.run-btn[data-cell="${cellNumber}"]`).closest('tr');
    return row.dataset.cellType || 'code';
}

// Set cell type
function setCellType(cellNumber, type) {
    const row = document.querySelector(`.run-btn[data-cell="${cellNumber}"]`).closest('tr');
    row.dataset.cellType = type;

    // Update type indicator
    const typeLabel = row.querySelector('.type-label');
    typeLabel.textContent = type === 'markdown' ? 'Markdown' : 'Code';
}

// Toggle cell type
function toggleCellType(cellNumber) {
    const currentType = getCellType(cellNumber);
    const newType = currentType === 'code' ? 'markdown' : 'code';
    console.log(`Toggling cell ${cellNumber} from ${currentType} to ${newType}`);
    setCellType(cellNumber, newType);
}

// Enter edit mode for any cell
function enterEditMode(cellNumber) {
    const row = document.querySelector(`.run-btn[data-cell="${cellNumber}"]`).closest('tr');
    const codeInput = document.getElementById(`code-${cellNumber}`);
    const outputElement = document.getElementById(`output-${cellNumber}`);
    const editBtn = row.querySelector('.edit-btn');
    const cellType = getCellType(cellNumber);

    if (cellType === 'markdown' && row.dataset.mode === 'rendered') {
        // Markdown cell in rendered mode: clear output, show and focus input
        outputElement.textContent = '';
        outputElement.classList.remove('has-output', 'markdown-rendered');
        outputElement.removeAttribute('aria-live');
        editBtn.style.display = 'none';
        row.dataset.mode = 'edit';
    }

    // Always show, make editable, and focus the pre element
    // Keep tabindex="-1" - programmatic focus still works
    codeInput.hidden = false;
    codeInput.contentEditable = 'true';
    codeInput.setAttribute('tabindex', '-1');
    codeInput.focus();
}

// Execute code in a cell
async function executeCell(cellNumber) {
    const codeInput = document.getElementById(`code-${cellNumber}`);
    const outputElement = document.getElementById(`output-${cellNumber}`);
    const runBtn = document.querySelector(`.run-btn[data-cell="${cellNumber}"]`);
    const row = runBtn.closest('tr');
    const cellType = getCellType(cellNumber);

    const code = codeInput.textContent.trim();

    console.log(`Executing cell ${cellNumber}, type: ${cellType}, code: ${code.substring(0, 50)}...`);

    if (!code) {
        return;
    }

    try {
        // Update UI
        runBtn.disabled = true;
        runBtn.classList.add('executing');
        runBtn.textContent = 'Executing...';
        outputElement.textContent = '';
        outputElement.classList.remove('has-output', 'has-error', 'markdown-rendered');

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
                    if (!(isBlank && prevBlank)) {
                        resultLines.push(line);
                    }
                    prevBlank = isBlank;
                }
                cleanedMarkdown = resultLines.join('\n');

                console.log('Cleaned markdown:', cleanedMarkdown);

                // Render markdown to HTML using marked.js
                let html = marked.parse(cleanedMarkdown);

                // Remove whitespace between HTML tags
                html = html.replace(/>\s+</g, '><');

                console.log('Rendered HTML:', html);

                // Display the rendered HTML
                outputElement.innerHTML = html;
                outputElement.classList.add('markdown-rendered');

                // Set aria-live="off" to prevent double speaking
                outputElement.setAttribute('aria-live', 'off');

                // Keep pre visible and editable - output focus will hide it
                // Show edit button
                row.querySelector('.edit-btn').style.display = 'block';

                // Update mode
                row.dataset.mode = 'rendered';

                // Focus the output (focus listener will hide the pre)
                outputElement.focus();
            } catch (error) {
                console.error('Markdown render error:', error);
                outputElement.textContent = `Error: ${error.message}`;
                outputElement.classList.add('has-error');
            }

            runBtn.disabled = false;
            runBtn.classList.remove('executing');
            runBtn.innerHTML = 'Run<br><small>(Ctrl+Enter)</small>';
            return;
        }

        // Execute code
        const response = await fetch(`${API_BASE}/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ code })
        });

        const result = await response.json();

        // Remove aria-live for code cells to prevent double speaking
        outputElement.removeAttribute('aria-live');

        // Display output
        if (result.status === 'ok') {
            if (result.output && result.output.length > 0) {
                const outputText = result.output.map(item => {
                    if (item.type === 'stream') {
                        return item.text;
                    } else if (item.type === 'execute_result') {
                        return item.text;
                    }
                    return '';
                }).join('');

                outputElement.textContent = outputText;
                outputElement.classList.add('has-output');
            } else {
                outputElement.textContent = '(No output)';
            }
        } else if (result.status === 'error') {
            // Display error
            const error = result.error;
            let errorText = `${error.ename}: ${error.evalue}`;

            if (error.traceback && error.traceback.length > 0) {
                errorText = error.traceback.join('\n');
            }

            outputElement.textContent = errorText;
            outputElement.classList.add('has-error');
        }

    } catch (error) {
        console.error('Error executing cell:', error);
        outputElement.textContent = `Error: ${error.message}`;
        outputElement.classList.add('has-error');
    } finally {
        // Reset button
        runBtn.disabled = false;
        runBtn.classList.remove('executing');
        runBtn.innerHTML = 'Run<br><small>(Ctrl+Enter)</small>';
    }
}

// Check kernel status on load
async function checkStatus() {
    try {
        const response = await fetch(`${API_BASE}/status`);
        const result = await response.json();

        if (result.status === 'ok') {
            updateKernelStatus(result.kernel_alive);
        }
    } catch (error) {
        console.error('Error checking status:', error);
        console.error('Backend server not responding. Please start the backend server.');
    }
}

// Event listeners for kernel controls
startKernelBtn.addEventListener('click', startKernel);
restartKernelBtn.addEventListener('click', restartKernel);
shutdownKernelBtn.addEventListener('click', shutdownKernel);

// Event delegation for notebook table
if (notebookTable) {
    // Handle button clicks
    notebookTable.addEventListener('click', (e) => {
        // Run button
        if (e.target.classList.contains('run-btn') || e.target.closest('.run-btn')) {
            const btn = e.target.classList.contains('run-btn') ? e.target : e.target.closest('.run-btn');
            const cellNumber = btn.dataset.cell;
            executeCell(cellNumber);
        }

        // Toggle type button
        if (e.target.classList.contains('toggle-type-btn') || e.target.closest('.toggle-type-btn')) {
            const btn = e.target.classList.contains('toggle-type-btn') ? e.target : e.target.closest('.toggle-type-btn');
            const cellNumber = btn.dataset.cell;
            toggleCellType(cellNumber);
        }

        // Edit button
        if (e.target.classList.contains('edit-btn') || e.target.closest('.edit-btn')) {
            const btn = e.target.classList.contains('edit-btn') ? e.target : e.target.closest('.edit-btn');
            const cellNumber = btn.dataset.cell;
            enterEditMode(cellNumber);
        }
    });

    // Handle keyboard shortcuts
    notebookTable.addEventListener('keydown', (e) => {
        const row = e.target.closest('tr');
        if (!row) return;

        const runBtn = row.querySelector('.run-btn');
        if (!runBtn) return;

        const cellNumber = runBtn.dataset.cell;

        // Ctrl+Enter: Run cell
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            executeCell(cellNumber);
        }

        // Ctrl+Space: Toggle cell type
        if (e.ctrlKey && e.key === ' ') {
            e.preventDefault();
            toggleCellType(cellNumber);
        }

        // Enter: Enter edit mode (only if not already in the code input)
        if (e.key === 'Enter' && !e.ctrlKey) {
            const codeInput = document.getElementById(`code-${cellNumber}`);
            // If we're in the code input, let Enter insert a newline (default behavior)
            if (e.target === codeInput) {
                return; // Don't prevent default, allow newline insertion
            }
            // Otherwise, enter edit mode
            e.preventDefault();
            enterEditMode(cellNumber);
        }
    });
}

// Removed setActiveCell function - tabindex management now handled by focus listener

// Listen for focus events
document.addEventListener('focus', (e) => {
    if (e.target.classList.contains('code-input')) {
        const cellNumber = e.target.id.replace('code-', '');
        activeCell = cellNumber;
    }

    // When output gains focus, hide and disable pre for ALL cell types
    if (e.target.tagName === 'OUTPUT') {
        const cellNumber = e.target.id.replace('output-', '');
        const codeInput = document.getElementById(`code-${cellNumber}`);

        codeInput.hidden = true;
        codeInput.contentEditable = 'false';
        codeInput.setAttribute('tabindex', '-1');
    }
}, true);

// Initialize
checkStatus();

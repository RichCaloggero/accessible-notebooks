# Accessible Jupyter Notebooks

A screen reader friendly interface for Jupyter notebooks, built with accessibility as the top priority.

## Project Structure

```
accessible-notebooks/
├── backend/               # Python Flask server
│   ├── server.py         # Main Flask application
│   ├── kernel_manager.py # Jupyter kernel management
│   └── requirements.txt  # Python dependencies
├── frontend/             # Accessible HTML interface
│   ├── index.html        # Main interface
│   ├── styles.css        # Accessible styling
│   └── app.js            # Client-side logic
├── notebooks/            # Sample notebooks
│   └── sample.ipynb      # Example notebook
├── examples/             # Example code
│   ├── kernel_example.py
│   └── kernel_messages_debug.py
└── docs/                 # Documentation
    ├── PROJECT_OVERVIEW.md
    └── JUPYTER_KERNELS_EXPLAINED.md
```

## Getting Started

### 1. Create Virtual Environment (Recommended)

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

You should see `(venv)` in your terminal prompt.

### 2. Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 3. Start the Backend Server

```bash
cd backend
python server.py
```

You should see:
```
Accessible Notebooks Backend Server
Server starting on http://localhost:5000
```

### 4. Open the Frontend

Open `frontend/index.html` in your web browser.

You can do this by:
- open your browser
- point it to http://localhost:5000
   + be sure to explicitly specify http; some browser configurations will assume https: unless you explicitly say otherwise
   

### 5. load notebook

- focus on the "load notebook" button and click or press enter
- choose a file from your computer and press enter;

### 6. Start the Kernel

This should happen automatically when the app is loaded in the browser. The screen reader should announce "kernel running", and then automatically focus the "load notebok" button.

If the kernel does not start automatically then:

1. Navigate to the "Start Kernel" button (or press Tab until you reach it)
2. Press Enter or click to start the kernel
3. Wait for the announcement "Kernel started successfully"

### 7. Run Code Cells

Each cell has:

- a toolbar
   + these controls are hidden from screen readers because all actions can be executed efficiently from the keyboard
   + mouse users can use either the toolbar buttons or the keyboard as they wish
- An editable area for code input
- an area for output

To execute a cell:
- tab to the cell
   + if it's a markdown cell, the rendered text is read
   + f it's a code cell, screen reader simply says "code"
- press enter to edit (works for both code and markdown cells)
- Type or edit your Python code
- click the run cell button or press control+enter
   + The output will appear below and be announced by your screen reader.
- press tab to move to output area which you can read via screen reader in normal document mode
   + shift+tab moves back into the code area
- tabbing past the output area or shift+tabbing past the code area move to next / previous cell and hides the input area
   + pressing escape (possibly twice when using a screen reader to force document mode) also exits edit mode and focuses the output area
   + press enter again when on the cell to get back to the cell's input


## Accessibility Features

### Semantic HTML
- Proper heading hierarchy
- Landmark regions (header, main, footer)
- Clear labels for all interactive elements
- efficient keyboard commands and focus management

### ARIA Live Regions

- Output announcements when execution completes
- Error announcements when errors occur

### Keyboard Navigation

- Standard Tab order through all interactive elements
- Ctrl+Enter to run cell (common convention)
- enter to enter edit mode
- escape, tab, or shift+tab to exit cell edit mode


### Visual Design

- High contrast colors
- Large clickable targets (48px minimum)
- Clear focus indicators (thick yellow outline)
- Sufficient text size (18px base)
- Adequate spacing between elements

### Screen Reader Support

- Tested with NVDA
- Navigate by headings (H key)
- All dynamic content announced

## API Endpoints

The backend provides these endpoints:

- `GET /api/status` - Check kernel status
- `POST /api/start` - Start kernel
- `POST /api/execute` - Execute python code
   + markdown is executed in the browser
- `POST /api/restart` - Restart kernel
- `POST /api/shutdown` - Shutdown kernel

## Troubleshooting

### Backend server not responding
- Make sure you started the backend: `python backend/server.py`
- Check that it's running on port 5000
- Look for error messages in the terminal

### Kernel won't start
- Ensure dependencies are installed: `pip install -r backend/requirements.txt`
- Check Python version (3.7+ required)
- Look for error messages in browser console (F12)

### Output not appearing
- Check browser console for errors (F12)
- Verify kernel status shows "Running"
- Try restarting the kernel

## Contributing

This project was primarily built by ClaudeCode (claude.ai) with accessibility and guidance from Rich Caloggero (rjc@mit.edu).

This project is built for accessibility. If you have suggestions for improvements, especially from screen reader users, please share them!

## License

MIT License - Feel free to use and modify for your needs.

## Acknowledgments

Built with insights from:
- Jupyter project documentation
- WCAG 2.1 accessibility guidelines

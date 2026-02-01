# How Jupyter Kernels Work

## Overview

A Jupyter kernel is a **separate process** that executes code independently from the user interface. This separation is key to Jupyter's power and is exactly what we need for our accessible notebooks project.

## Architecture

### The Traditional REPL vs Jupyter
- **Traditional REPL** (like typing `python` in terminal): Read → Evaluate → Print → Loop (all in sequence)
- **Jupyter Model**: Frontend (Read/Print) ↔ Kernel (Evaluate) - these are **separate processes**

### Benefits of This Design
1. **Non-blocking**: You can write code while previous cells are still running
2. **Multiple interfaces**: Same kernel can connect to different frontends (perfect for our accessible interface!)
3. **Remote execution**: Kernels can run on different machines

## Communication Protocol

### The Five ZeroMQ Ports

The kernel binds to **5 different ports** using ZeroMQ:

1. **Shell (REQ/REP)**: Main channel for code execution, completion, inspection
2. **IOPub (PUB/SUB)**: Broadcasts output, status updates (this is what we'll use for displaying results!)
3. **Control (REQ/REP)**: System commands (shutdown, interrupt)
4. **Stdin (REQ/REP)**: Handles input() prompts
5. **Heartbeat**: Keeps connection alive

### Message Flow for Code Execution

When you execute code, the kernel sends multiple messages **in this order**:

1. **status** (`execution_state='busy'`): Kernel starts working
2. **execute_input**: Echo of what was sent
3. **stream**: stdout/stderr output (may be multiple messages)
4. **execute_result**: The actual return value (like REPL output)
   - OR **error**: If an exception occurred
5. **status** (`execution_state='idle'`): **⭐ THIS TELLS YOU EXECUTION IS COMPLETE!**
6. **execute_reply**: Final status on shell channel

**Critical**: You MUST wait for the `status='idle'` message to know execution is done. Don't guess with timeouts!

## Using jupyter_client

The `jupyter_client` Python library abstracts all the ZeroMQ complexity:

```python
from jupyter_client import KernelManager

# Start a kernel
km = KernelManager()
km.start_kernel()

# Get a client to communicate
client = km.client()

# IMPORTANT: Wait for kernel to be ready (event-driven, not time.sleep!)
client.wait_for_ready(timeout=60)

# Execute code
msg_id = client.execute("print('Hello!')")

# Listen for output on IOPub channel until we get status='idle'
while True:
    msg = client.get_iopub_msg()
    if msg['header']['msg_type'] == 'status':
        if msg['content']['execution_state'] == 'idle':
            break  # Execution complete!
```

### Key Methods
- `wait_for_ready(timeout)`: Waits until kernel is ready to accept requests
- `execute(code)`: Sends code to kernel, returns message ID for tracking
- `get_iopub_msg(timeout)`: Gets next message from output channel
- `is_alive()`: Checks if kernel is still running

## Key Insights for Our Project

1. **State persists**: Variables defined in one cell exist in later cells (single kernel session)
2. **Async output**: Results come back as messages, not return values
3. **Multiple message types**: Need to handle stdout, results, and errors differently
4. **Simple API**: `jupyter_client` handles the hard parts for us

## What This Means for Accessible Notebooks

Our backend can:
- Start a single kernel when the user opens a notebook
- Send each cell's code to the kernel when "Run" is clicked
- Collect all output messages and format them accessibly
- Announce status changes ("Cell executing...", "Cell complete", "Error occurred")
- Keep the kernel alive for the whole session (variables persist)

The frontend just needs to:
- Send code to our backend
- Display the collected output
- Use ARIA live regions to announce status changes

## Try It Out

Run the example:
```bash
pip install -r requirements.txt
python kernel_example.py
```

This demonstrates starting a kernel, executing code, and handling output.

## References
- [Jupyter Kernel Overview - Hex](https://hex.tech/blog/jupyter-kernel-overview/)
- [Jupyter Kernel Architecture - Roman Glushko](https://www.romaglushko.com/blog/jupyter-kernel-architecture/)
- [jupyter_client Documentation](https://jupyter-client.readthedocs.io/)
- [Making Kernels for Jupyter](https://jupyter-client.readthedocs.io/en/stable/kernels.html)

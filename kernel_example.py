"""
Simple example of interacting with a Jupyter kernel using jupyter_client.
This demonstrates the basic concepts needed for the accessible notebooks project.
"""

from jupyter_client import KernelManager
import time


def execute_code(kernel_manager, code):
    """
    Execute code in the kernel and return the output.

    Args:
        kernel_manager: The KernelManager instance
        code: String of Python code to execute

    Returns:
        dict with 'output', 'error', and 'status' keys
    """
    # Get the client to communicate with the kernel
    client = kernel_manager.client()

    # Execute the code and get a message ID to track responses
    msg_id = client.execute(code)

    result = {
        'output': [],
        'error': None,
        'status': 'unknown'
    }

    # Wait for messages from the kernel
    # The kernel sends multiple messages for a single execution in this order:
    # 1. status: execution_state='busy' (kernel started working)
    # 2. execute_input: echoes what was sent
    # 3. stream: stdout/stderr output (may have multiple)
    # 4. execute_result: the result value (like in a REPL)
    #    OR error: if an exception occurred
    # 5. status: execution_state='idle' (THIS IS HOW WE KNOW IT'S DONE!)
    # 6. execute_reply: final status on shell channel
    #
    # We listen until we get the 'idle' status message

    while True:
        try:
            # Check the IOPub channel for output messages
            msg = client.get_iopub_msg(timeout=10)
            msg_type = msg['header']['msg_type']
            content = msg['content']

            # Only process messages related to our execution
            if 'parent_header' in msg and msg['parent_header'].get('msg_id') == msg_id:

                if msg_type == 'stream':
                    # Standard output/error
                    result['output'].append(content['text'])

                elif msg_type == 'execute_result':
                    # The actual result value (what would be printed in REPL)
                    result['output'].append(content['data'].get('text/plain', ''))

                elif msg_type == 'error':
                    # An error occurred
                    result['error'] = '\n'.join(content['traceback'])
                    result['status'] = 'error'

                elif msg_type == 'status' and content['execution_state'] == 'idle':
                    # Kernel finished executing
                    if result['status'] == 'unknown':
                        result['status'] = 'ok'
                    break

        except Exception as e:
            result['error'] = f"Timeout or error waiting for kernel: {e}"
            result['status'] = 'error'
            break

    return result


def main():
    """
    Demonstrate basic kernel usage.
    """
    print("Starting Jupyter kernel...")

    # Create a kernel manager and start the kernel
    # This starts a Python kernel by default
    km = KernelManager()
    km.start_kernel()

    print(f"Kernel started with ID: {km.kernel_id}")
    print(f"Connection info: {km.connection_file}")

    # Wait for kernel to be ready (proper event-driven way!)
    print("Waiting for kernel to be ready...")
    kc = km.client()
    kc.wait_for_ready(timeout=60)
    print("Kernel is ready!\n")

    # Example 1: Simple calculation
    print("=" * 50)
    print("Example 1: Simple calculation")
    print("=" * 50)
    code1 = "2 + 2"
    print(f"Code: {code1}")
    result1 = execute_code(km, code1)
    print(f"Status: {result1['status']}")
    print(f"Output: {''.join(result1['output'])}\n")

    # Example 2: Print statement
    print("=" * 50)
    print("Example 2: Print statement")
    print("=" * 50)
    code2 = "print('Hello from kernel!')"
    print(f"Code: {code2}")
    result2 = execute_code(km, code2)
    print(f"Status: {result2['status']}")
    print(f"Output: {''.join(result2['output'])}\n")

    # Example 3: Multiple lines with variable
    print("=" * 50)
    print("Example 3: Variables persist across executions")
    print("=" * 50)
    code3a = "x = 42"
    code3b = "print(f'x = {x}')\nx * 2"
    print(f"Code: {code3a}")
    result3a = execute_code(km, code3a)
    print(f"Status: {result3a['status']}\n")

    print(f"Code: {code3b}")
    result3b = execute_code(km, code3b)
    print(f"Status: {result3b['status']}")
    print(f"Output: {''.join(result3b['output'])}\n")

    # Example 4: Error handling
    print("=" * 50)
    print("Example 4: Error handling")
    print("=" * 50)
    code4 = "1 / 0"
    print(f"Code: {code4}")
    result4 = execute_code(km, code4)
    print(f"Status: {result4['status']}")
    if result4['error']:
        print(f"Error:\n{result4['error']}\n")

    # Clean up
    print("=" * 50)
    print("Shutting down kernel...")
    km.shutdown_kernel()
    print("Done!")


if __name__ == "__main__":
    main()

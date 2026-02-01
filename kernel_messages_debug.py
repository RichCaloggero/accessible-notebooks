"""
Debug script to show ALL messages from the kernel.
This demonstrates the message flow and when execution is complete.
"""

from jupyter_client import KernelManager
import json


def show_all_messages(kernel_manager, code):
    """
    Execute code and print EVERY message we receive.
    This shows exactly how we know when execution is complete.
    """
    client = kernel_manager.client()
    msg_id = client.execute(code)

    print(f"\nExecuting: {code}")
    print("=" * 70)
    print(f"Message ID: {msg_id}\n")

    message_count = 0
    execution_complete = False

    while not execution_complete:
        try:
            # Get message from IOPub channel
            msg = client.get_iopub_msg(timeout=10)
            msg_type = msg['header']['msg_type']
            content = msg['content']
            parent_id = msg.get('parent_header', {}).get('msg_id', 'N/A')

            message_count += 1

            # Check if this message is related to our execution
            is_ours = parent_id == msg_id

            print(f"Message #{message_count}:")
            print(f"  Type: {msg_type}")
            print(f"  From our execution: {is_ours}")

            if is_ours:
                # Show relevant content
                if msg_type == 'status':
                    state = content.get('execution_state', 'unknown')
                    print(f"  Execution state: {state}")

                    # THIS IS THE KEY: When state is 'idle', we're done!
                    if state == 'idle':
                        print(f"\n  >>> EXECUTION COMPLETE! (received 'idle' status) <<<\n")
                        execution_complete = True

                elif msg_type == 'stream':
                    print(f"  Stream ({content.get('name', 'unknown')}): {content.get('text', '')}")

                elif msg_type == 'execute_result':
                    print(f"  Result: {content.get('data', {}).get('text/plain', '')}")

                elif msg_type == 'error':
                    print(f"  Error: {content.get('ename', '')}: {content.get('evalue', '')}")

                elif msg_type == 'execute_input':
                    print(f"  Code echoed: {content.get('code', '')[:50]}...")

            print()

        except Exception as e:
            print(f"Error or timeout: {e}")
            break

    print("=" * 70)
    print(f"Total messages received: {message_count}\n")


def main():
    print("Starting kernel...")
    km = KernelManager()
    km.start_kernel()

    print("Waiting for kernel to be ready...")
    kc = km.client()
    kc.wait_for_ready(timeout=60)
    print("Kernel ready!\n")

    # Example 1: Simple expression
    print("\n" + "▼" * 70)
    print("EXAMPLE 1: Simple expression (2 + 2)")
    print("▼" * 70)
    show_all_messages(km, "2 + 2")

    # Example 2: Print statement
    print("\n" + "▼" * 70)
    print("EXAMPLE 2: Print statement")
    print("▼" * 70)
    show_all_messages(km, "print('Hello, world!')")

    # Example 3: Multiple outputs
    print("\n" + "▼" * 70)
    print("EXAMPLE 3: Multiple outputs")
    print("▼" * 70)
    show_all_messages(km, "print('First line')\nprint('Second line')\n42")

    # Example 4: Error
    print("\n" + "▼" * 70)
    print("EXAMPLE 4: Error handling")
    print("▼" * 70)
    show_all_messages(km, "1 / 0")

    print("\n" + "=" * 70)
    print("KEY TAKEAWAY:")
    print("=" * 70)
    print("The kernel sends a status='idle' message when execution completes.")
    print("This is the ONLY reliable way to know execution is done.")
    print("You MUST wait for this message - don't guess with timeouts!")
    print("=" * 70)

    km.shutdown_kernel()
    print("\nKernel shut down.")


if __name__ == "__main__":
    main()

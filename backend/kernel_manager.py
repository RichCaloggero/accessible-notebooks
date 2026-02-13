"""
Kernel Manager for Accessible Notebooks.
Handles kernel lifecycle and code execution.
"""

import re
from jupyter_client import KernelManager

ANSI_ESCAPE = re.compile(r'\x1b\[[0-9;]*m')


class NotebookKernelManager:
    """
    Manages a single Jupyter kernel instance for the notebook session.
    """

    def __init__(self):
        self.km = None
        self.client = None

    def start(self):
        """
        Start the kernel and wait for it to be ready.

        Returns:
            dict with 'status' and 'kernel_id' keys
        """
        if self.km is not None:
            return {'status': 'error', 'message': 'Kernel already running'}

        try:
            self.km = KernelManager()
            self.km.start_kernel()
            self.client = self.km.client()
            self.client.wait_for_ready(timeout=60)

            return {
                'status': 'ok',
                'kernel_id': self.km.kernel_id,
                'message': 'Kernel started successfully'
            }
        except Exception as e:
            if self.km is not None:
                try:
                    self.km.shutdown_kernel(now=True)
                except Exception:
                    pass
            self.km = None
            self.client = None
            return {
                'status': 'error',
                'message': f'Failed to start kernel: {str(e)}'
            }

    def execute(self, code):
        """
        Execute code in the kernel and return all output.

        Args:
            code: String of Python code to execute

        Returns:
            dict with 'output', 'error', and 'status' keys
        """
        if self.km is None or self.client is None:
            return {
                'status': 'error',
                'error': 'Kernel not started',
                'output': []
            }

        try:
            # Execute the code and get a message ID to track responses
            msg_id = self.client.execute(code)

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
                    msg = self.client.get_iopub_msg(timeout=30)
                    msg_type = msg['header']['msg_type']
                    content = msg['content']

                    # Only process messages related to our execution
                    if 'parent_header' in msg and msg['parent_header'].get('msg_id') == msg_id:

                        if msg_type == 'stream':
                            # Standard output/error
                            result['output'].append({
                                'type': 'stream',
                                'name': content.get('name', 'stdout'),
                                'text': content['text']
                            })

                        elif msg_type == 'execute_result':
                            # The actual result value (what would be printed in REPL)
                            result['output'].append({
                                'type': 'execute_result',
                                'text': content['data'].get('text/plain', '')
                            })

                        elif msg_type == 'error':
                            # An error occurred
                            raw_tb = content.get('traceback', [])
                            clean_tb = [ANSI_ESCAPE.sub('', line) for line in raw_tb]
                            result['error'] = {
                                'ename': content.get('ename', 'Error'),
                                'evalue': content.get('evalue', ''),
                                'traceback': clean_tb
                            }
                            result['status'] = 'error'

                        elif msg_type == 'status' and content['execution_state'] == 'idle':
                            # Kernel finished executing
                            if result['status'] == 'unknown':
                                result['status'] = 'ok'
                            break

                except Exception as e:
                    result['error'] = {
                        'ename': 'Timeout',
                        'evalue': str(e),
                        'traceback': [f"Timeout or error waiting for kernel: {e}"]
                    }
                    result['status'] = 'error'
                    break

            return result

        except Exception as e:
            return {
                'status': 'error',
                'error': {
                    'ename': 'ExecutionError',
                    'evalue': str(e),
                    'traceback': [f"Failed to execute code: {e}"]
                },
                'output': []
            }

    def is_alive(self):
        """
        Check if the kernel is alive.

        Returns:
            bool: True if kernel is alive, False otherwise
        """
        if self.km is None:
            return False
        return self.km.is_alive()

    def restart(self):
        """
        Restart the kernel.

        Returns:
            dict with 'status' and 'message' keys
        """
        try:
            if self.km is not None:
                self.km.restart_kernel()
                self.client = self.km.client()
                self.client.wait_for_ready(timeout=60)
                return {
                    'status': 'ok',
                    'message': 'Kernel restarted successfully'
                }
            else:
                return self.start()
        except Exception as e:
            return {
                'status': 'error',
                'message': f'Failed to restart kernel: {str(e)}'
            }

    def shutdown(self):
        """
        Shutdown the kernel.

        Returns:
            dict with 'status' and 'message' keys
        """
        if self.km is None:
            return {
                'status': 'ok',
                'message': 'Kernel not running'
            }

        try:
            self.km.shutdown_kernel()
            self.km = None
            self.client = None
            return {
                'status': 'ok',
                'message': 'Kernel shutdown successfully'
            }
        except Exception as e:
            return {
                'status': 'error',
                'message': f'Failed to shutdown kernel: {str(e)}'
            }

"""
Flask server for Accessible Notebooks.
Provides API endpoints for kernel management and code execution.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from kernel_manager import NotebookKernelManager
import markdown

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend access

# Global kernel manager instance
kernel = NotebookKernelManager()


@app.route('/api/status', methods=['GET'])
def status():
    """
    Check kernel status.

    Returns:
        JSON with kernel status
    """
    return jsonify({
        'status': 'ok',
        'kernel_alive': kernel.is_alive()
    })


@app.route('/api/start', methods=['POST'])
def start_kernel():
    """
    Start the kernel.

    Returns:
        JSON with start result
    """
    result = kernel.start()
    return jsonify(result)


@app.route('/api/execute', methods=['POST'])
def execute_code():
    """
    Execute code in the kernel.

    Expected JSON body:
        {
            "code": "print('Hello, world!')"
        }

    Returns:
        JSON with execution result
    """
    data = request.get_json()

    if not data or 'code' not in data:
        return jsonify({
            'status': 'error',
            'error': {
                'ename': 'BadRequest',
                'evalue': 'Missing code parameter',
                'traceback': []
            },
            'output': []
        }), 400

    code = data['code']

    # Start kernel if not running
    if not kernel.is_alive():
        start_result = kernel.start()
        if start_result['status'] != 'ok':
            return jsonify({
                'status': 'error',
                'error': {
                    'ename': 'KernelStartError',
                    'evalue': start_result.get('message', 'Failed to start kernel'),
                    'traceback': []
                },
                'output': []
            }), 500

    # Execute the code
    result = kernel.execute(code)
    return jsonify(result)


@app.route('/api/render-markdown', methods=['POST'])
def render_markdown():
    """
    Legacy endpoint - markdown rendering now done client-side.
    Kept for backwards compatibility.
    """
    return jsonify({
        'status': 'error',
        'error': 'Markdown rendering is now done client-side',
        'html': ''
    }), 410  # 410 Gone - endpoint deprecated


@app.route('/api/restart', methods=['POST'])
def restart_kernel():
    """
    Restart the kernel.

    Returns:
        JSON with restart result
    """
    result = kernel.restart()
    return jsonify(result)


@app.route('/api/shutdown', methods=['POST'])
def shutdown_kernel():
    """
    Shutdown the kernel.

    Returns:
        JSON with shutdown result
    """
    result = kernel.shutdown()
    return jsonify(result)


@app.route('/health', methods=['GET'])
def health():
    """
    Health check endpoint.

    Returns:
        JSON with health status
    """
    return jsonify({
        'status': 'healthy',
        'service': 'accessible-notebooks-backend'
    })


if __name__ == '__main__':
    print("=" * 70)
    print("Accessible Notebooks Backend Server")
    print("=" * 70)
    print("Server starting on http://localhost:5000")
    print("\nAPI Endpoints:")
    print("  GET  /api/status          - Check kernel status")
    print("  POST /api/start           - Start kernel")
    print("  POST /api/execute         - Execute code")
    print("  POST /api/render-markdown - Render markdown to HTML")
    print("  POST /api/restart         - Restart kernel")
    print("  POST /api/shutdown        - Shutdown kernel")
    print("  GET  /health              - Health check")
    print("=" * 70)
    print("\nPress CTRL+C to stop the server")
    print()

    app.run(host='0.0.0.0', port=5000, debug=True)

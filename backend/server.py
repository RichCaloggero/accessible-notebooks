"""
Alternative Flask server that serves both frontend and backend.
This avoids CORS issues entirely by serving everything from the same origin.
"""

from flask import Flask, request, jsonify, send_from_directory
import os
from kernel_manager import NotebookKernelManager

app = Flask(__name__)

# Global kernel manager instance
kernel = NotebookKernelManager()

# Path to frontend directory
FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend')


# Serve frontend files
@app.route('/')
def index():
    """Serve the main HTML file."""
    return send_from_directory(FRONTEND_DIR, 'index.html')


@app.route('/<path:path>')
def serve_static(path):
    """Serve static files (CSS, JS)."""
    return send_from_directory(FRONTEND_DIR, path)


# API endpoints (same as before)
@app.route('/api/status', methods=['GET'])
def status():
    return jsonify({
        'status': 'ok',
        'kernel_alive': kernel.is_alive()
    })


@app.route('/api/start', methods=['POST'])
def start_kernel():
    result = kernel.start()
    return jsonify(result)


@app.route('/api/execute', methods=['POST'])
def execute_code():
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

    result = kernel.execute(code)
    return jsonify(result)



@app.route('/api/restart', methods=['POST'])
def restart_kernel():
    result = kernel.restart()
    return jsonify(result)


@app.route('/api/shutdown', methods=['POST'])
def shutdown_kernel():
    result = kernel.shutdown()
    return jsonify(result)


@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'service': 'accessible-notebooks-backend'
    })


if __name__ == '__main__':
    print("=" * 70)
    print("Accessible Notebooks Integrated Server")
    print("=" * 70)
    print("Server starting on http://localhost:5000")
    print("\nOpen in browser: http://localhost:5000")
    print("\nNo CORS needed - everything served from same origin!")
    print("=" * 70)
    print("\nPress CTRL+C to stop the server")
    print()

#    app.run(host='0.0.0.0', port=5000, debug=True)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
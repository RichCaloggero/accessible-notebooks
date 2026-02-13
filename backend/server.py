"""
Alternative Flask server that serves both frontend and backend.
This avoids CORS issues entirely by serving everything from the same origin.
"""

from flask import Flask, request, jsonify, send_from_directory, abort
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import os
from kernel_manager import NotebookKernelManager

app = Flask(__name__)
limiter = Limiter(get_remote_address, app=app, default_limits=[])

ALLOWED_ORIGINS = {
    'https://richcaloggero.space',
    'http://localhost:5000',
    'http://127.0.0.1:5000',
}


def check_origin():
    origin = request.headers.get('Origin')
    if origin is not None and origin not in ALLOWED_ORIGINS:
        abort(403)


@app.after_request
def add_security_headers(response):
    response.headers['Content-Security-Policy'] = "default-src 'self'"
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['Referrer-Policy'] = 'no-referrer'
    return response


# Global kernel manager instance
kernel = NotebookKernelManager()

# Path to frontend directory
FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend')

ALLOWED_EXTENSIONS = {'.html', '.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.json', '.woff', '.woff2', '.ttf', '.map'}


# Serve frontend files
@app.route('/')
def index():
    """Serve the main HTML file."""
    return send_from_directory(FRONTEND_DIR, 'index.html')


@app.route('/<path:path>')
def serve_static(path):
    """Serve static files (CSS, JS)."""
    ext = os.path.splitext(path)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        abort(403)
    return send_from_directory(FRONTEND_DIR, path)


# API endpoints (same as before)
@app.route('/api/status', methods=['GET'])
@limiter.limit("30/minute")
def status():
    return jsonify({
        'status': 'ok',
        'kernel_alive': kernel.is_alive()
    })


@app.route('/api/start', methods=['POST'])
@limiter.limit("30/minute")
def start_kernel():
    check_origin()
    result = kernel.start()
    return jsonify(result)


@app.route('/api/execute', methods=['POST'])
@limiter.limit("30/minute")
def execute_code():
    check_origin()
    MAX_PAYLOAD_BYTES = 1 * 1024 * 1024  # 1MB
    if request.content_length and request.content_length > MAX_PAYLOAD_BYTES:
        abort(413)
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
@limiter.limit("30/minute")
def restart_kernel():
    check_origin()
    result = kernel.restart()
    return jsonify(result)


@app.route('/api/shutdown', methods=['POST'])
@limiter.limit("30/minute")
def shutdown_kernel():
    check_origin()
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

    app.run(host='127.0.0.1', port=5000, debug=False)
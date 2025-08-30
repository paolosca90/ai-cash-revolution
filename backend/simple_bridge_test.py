#!/usr/bin/env python3
"""
Simple bridge server test - minimal Flask app to verify functionality
"""
from flask import Flask, jsonify
from flask_cors import CORS
import json

app = Flask(__name__)
CORS(app)

@app.route('/api/health')
def health():
    return jsonify({
        "status": "healthy",
        "test": True,
        "message": "Bridge server is working"
    })

@app.route('/')
def home():
    return """
    <h1>AI Trading Bridge - Test Server</h1>
    <p>Status: <strong>Running</strong></p>
    <p><a href="/api/health">Health Check API</a></p>
    """

if __name__ == '__main__':
    print("[TEST] Starting minimal bridge server on port 8081...")
    print("[TEST] Visit: http://localhost:8081")
    print("[TEST] API: http://localhost:8081/api/health")
    app.run(host='127.0.0.1', port=8081, debug=False)
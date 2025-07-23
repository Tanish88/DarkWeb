#!/usr/bin/env python3
"""
Simple HTTP server to serve the e-commerce website on port 5000
"""
import http.server
import socketserver
import os
import urllib.request
import urllib.parse
import json

PORT = 5000
HOST = "0.0.0.0"
EMAIL_SERVER_URL = "http://localhost:5001"

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add security headers for privacy
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'DENY')
        self.send_header('X-XSS-Protection', '1; mode=block')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_POST(self):
        if self.path == '/send-order-email':
            self.handle_email_request()
        else:
            super().do_POST()

    def handle_email_request(self):
        try:
            # Read request body
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            # Forward to email server
            req = urllib.request.Request(
                f"{EMAIL_SERVER_URL}/send-order-email",
                data=post_data,
                headers={'Content-Type': 'application/json'}
            )
            
            with urllib.request.urlopen(req) as response:
                response_data = response.read()
                
            # Send response back to client
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(response_data)
            
        except Exception as e:
            print(f"Email proxy error: {e}")
            # Send error response
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            error_response = json.dumps({"error": "Email service unavailable"}).encode()
            self.wfile.write(error_response)

if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Allow socket reuse to prevent "Address already in use" errors
    socketserver.TCPServer.allow_reuse_address = True
    
    with socketserver.TCPServer((HOST, PORT), CustomHTTPRequestHandler) as httpd:
        print(f"Privacy-focused e-commerce server running at http://{HOST}:{PORT}")
        print("Press Ctrl+C to stop the server")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")

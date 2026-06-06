import socket
import sys
import time
import urllib.parse

def wait_for_url(url, timeout=60):
    parsed = urllib.parse.urlparse(url)
    host = parsed.hostname or '127.0.0.1'
    port = parsed.port or (80 if parsed.scheme == 'http' else 443)
    start_time = time.time()

    print(f"Waiting for service at {url} ({host}:{port})...")
    while True:
        try:
            # Try to establish a TCP connection
            with socket.create_connection((host, port), timeout=1):
                print(f"Service at {url} is up and responding!")
                return True
        except (socket.timeout, ConnectionRefusedError, OSError):
            if time.time() - start_time > timeout:
                print(f"Error: Timeout after {timeout} seconds waiting for {url}")
                sys.exit(1)
            time.sleep(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python wait_for_services.py <url1> [<url2> ...]")
        sys.exit(1)

    for url_arg in sys.argv[1:]:
        wait_for_url(url_arg)

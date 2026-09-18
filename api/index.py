import sys
import os

# Ensure backend root is on Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_path = os.path.abspath(os.path.join(current_dir, "..", "backend"))

if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.main import app

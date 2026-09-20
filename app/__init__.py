import os
import sys

root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
backend_dir = os.path.join(root_dir, "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

backend_app_dir = os.path.join(backend_dir, "app")
if os.path.exists(backend_app_dir) and backend_app_dir not in __path__:
    __path__.append(backend_app_dir)

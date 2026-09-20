"""
Root wrapper for backend/scripts/seed.py
Enables direct execution from repository root in cloud deployment environments like Render.
"""
import sys
import os
import runpy

root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
backend_dir = os.path.join(root_dir, "backend")

if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

seed_script = os.path.join(backend_dir, "scripts", "seed.py")
if os.path.exists(seed_script):
    runpy.run_path(seed_script, run_name="__main__")
else:
    print(f"Error: Could not find seed script at {seed_script}")
    sys.exit(1)

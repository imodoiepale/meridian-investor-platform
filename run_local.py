"""
Run MiroFish × Kenya Invest backend locally (no Docker needed)
"""

import os
import sys

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Set in-memory Qdrant mode
os.environ['QDRANT_MODE'] = 'memory'

# Import and run Flask app
from backend.app import create_app

if __name__ == '__main__':
    app = create_app()
    port = int(os.getenv('PORT_BACKEND', 5001))
    
    print("\n" + "="*60)
    print("Meridian Global Investor OS Backend")
    print("="*60)
    print(f"Backend API: http://localhost:{port}")
    print(f"Health check: http://localhost:{port}/health")
    print(f"Research endpoint: http://localhost:{port}/api/invest/research")
    print("="*60 + "\n")
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=True
    )

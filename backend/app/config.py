"""Flask configuration"""
import os

class Config:
    """Base configuration"""
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    DEBUG = os.getenv('NODE_ENV', 'development') == 'development'
    TESTING = False
    
    # JSON settings
    JSON_AS_ASCII = False
    JSONIFY_PRETTYPRINT_REGULAR = True
    
    # CORS
    CORS_ORIGINS = '*'

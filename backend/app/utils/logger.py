"""Simple logging setup"""
import logging
import sys

def setup_logger(name='app'):
    """Setup basic logger"""
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)
    
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(logging.INFO)
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        handler.setFormatter(formatter)
        logger.addHandler(handler)
    
    return logger

def get_logger(name='app'):
    """Get existing logger"""
    return logging.getLogger(name)

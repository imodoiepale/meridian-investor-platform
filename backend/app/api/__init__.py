"""API blueprints stub - not needed for Kenya Invest testing"""
from flask import Blueprint

# Stub blueprints for MiroFish compatibility
graph_bp = Blueprint('graph', __name__)
simulation_bp = Blueprint('simulation', __name__)
report_bp = Blueprint('report', __name__)

@graph_bp.route('/health')
def graph_health():
    return {'status': 'ok', 'service': 'graph'}

@simulation_bp.route('/health')
def simulation_health():
    return {'status': 'ok', 'service': 'simulation'}

@report_bp.route('/health')
def report_health():
    return {'status': 'ok', 'service': 'report'}

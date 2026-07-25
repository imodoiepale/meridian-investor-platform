FROM ghcr.io/666ghj/mirofish:latest

WORKDIR /app

# Install Kenya Invest extra Python dependencies
COPY backend/requirements_kenya_invest.txt /tmp/requirements_kenya_invest.txt
RUN pip install --no-cache-dir -r /tmp/requirements_kenya_invest.txt

# Copy Kenya Invest backend modules into the image
COPY backend/vector_db/ /app/backend/vector_db/
COPY backend/research_agent/ /app/backend/research_agent/
COPY backend/agents/ /app/backend/agents/
COPY backend/routes/kenya_invest.py /app/backend/routes/kenya_invest.py

# Override the Flask app factory to register Kenya routes
COPY backend/app/__init__.py /app/backend/app/__init__.py

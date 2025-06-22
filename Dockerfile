FROM python:3.11-slim

WORKDIR /app

# Copy backend files
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY backend/ .

# Create data directory
RUN mkdir -p data

# Expose port
EXPOSE 8000

# Start the application
CMD ["uvicorn", "main:socket_app", "--host", "0.0.0.0", "--port", "8000"] 
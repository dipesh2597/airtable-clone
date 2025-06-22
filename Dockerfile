FROM python:3.11-slim

WORKDIR /app

# Copy the entire project
COPY . .

# Install numpy first to avoid compatibility issues
RUN pip install --no-cache-dir numpy==1.24.3

# Install dependencies
RUN cd backend && pip install --no-cache-dir -r requirements.txt

# Make scripts executable
RUN chmod +x start.sh build.sh

# Create data directory
RUN mkdir -p backend/data

# Expose port
EXPOSE 8000

# Start the application
CMD ["./start.sh"] 
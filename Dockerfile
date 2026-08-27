# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Install system dependencies needed for Pillow and TensorFlow
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory to /app
WORKDIR /app

# Copy the requirements file into the container
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend files
COPY backend/ ./backend/

# Copy the frontend files (Flask serves these as static files by default)
COPY frontend/ ./frontend/

# Set environment variables
ENV PORT=5000
ENV PYTHONUNBUFFERED=1

# Expose the port
EXPOSE 5000

# Start Gunicorn server, binding to the PORT environment variable assigned by the host
CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:${PORT:-5000} --chdir backend app:app"]

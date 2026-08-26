# Use a lightweight python image
FROM python:3.10-slim

# Set working directory inside container
WORKDIR /app

# Copy dependency specifications
COPY requirements.txt .

# Install dependencies without cache to minimize container footprint
RUN pip install --no-cache-dir -r requirements.txt

# Copy all project code
COPY . .

# Expose port (7860 is the standard port for Hugging Face Spaces)
EXPOSE 7860

# Run Flask application using Gunicorn WSGI
CMD ["gunicorn", "--bind", "0.0.0.0:7860", "app:app"]

FROM python:3.13-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && useradd --uid 10001 --create-home oneri && mkdir /var/lib/oneri && chown oneri /var/lib/oneri
COPY app.py .
COPY templates templates
COPY static static
USER oneri
ENV ONERI_DATABASE=/var/lib/oneri/oneriler.sqlite3
EXPOSE 4326
CMD ["waitress-serve", "--listen=0.0.0.0:4326", "--call", "app:create_app"]

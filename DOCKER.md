# Docker Build & Deploy Guide

## Build Locally

```bash
# Build dengan default API URL
docker build -t despro-frontend .

# Build dengan custom API URL
docker build \
  --build-arg EXPO_PUBLIC_API_URL=https://your-api.com/api/v1 \
  --build-arg EXPO_PUBLIC_CDN_URL=https://your-cdn.com \
  --build-arg EXPO_PUBLIC_WEBPUSH_VAPID_KEY=your-key \
  -t despro-frontend .
```

## Run Locally

```bash
# Run container
docker run -d -p 8080:8080 despro-frontend

# Access at http://localhost:8080
```

## Docker Compose

```bash
# Build and run
docker-compose up -d

# Rebuild
docker-compose up -d --build

# View logs
docker-compose logs -f frontend

# Stop
docker-compose down
```

## GitHub Actions (Automated)

Workflow `.github/workflows/docker-build.yml` akan otomatis:
- Build image saat push ke `main`
- Push ke GitHub Container Registry (ghcr.io)
- Support multi-platform (amd64, arm64)
- Cache layers untuk build lebih cepat

### Pull Pre-built Image

```bash
# Pull latest
docker pull ghcr.io/morpknight/despro-mbg:latest

# Pull specific version
docker pull ghcr.io/morpknight/despro-mbg:v1.0.0

# Run pre-built image
docker run -d -p 8080:8080 ghcr.io/morpknight/despro-mbg:latest
```

## Environment Variables

Set di `.env` atau docker-compose.yml:

```env
EXPO_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1
EXPO_PUBLIC_CDN_URL=https://your-cdn.com
EXPO_PUBLIC_WEBPUSH_VAPID_KEY=your-vapid-key
```

Do not pass a private CDN credential to the frontend build. Frontend bundles are distributed to users; private upload authorization should be implemented through the backend.

## Troubleshooting

### Build gagal di npm ci
- Sudah fixed dengan `--ignore-scripts` (skip native modules)

### Image terlalu besar
- Sudah optimize dengan multi-stage build
- Final image hanya berisi dist + serve

### Port conflict
```bash
# Gunakan port lain
docker run -d -p 3000:8080 despro-frontend
```

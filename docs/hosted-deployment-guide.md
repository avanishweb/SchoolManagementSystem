# Commercial Hosted Multi-Tenant SaaS Deployment Guide

This guide describes how to deploy, secure, scale, and maintain the **Smart School Multi-Tenant SaaS platform** in a production cloud environment.

---

## 1. Production Architecture Overview

The multi-tenant web edition serves multiple independent school institutions from a unified, horizontally scalable infrastructure while enforcing strict cryptographic and database tenant isolation.

```mermaid
graph TD
    User([Public Internet / Browser / Mobile]) --> DNS[Public DNS / Anycast Edge]
    DNS --> Edge[Cloud Edge / Cloudflare / WAF]
    Edge --> LB[Reverse Proxy & Ingress Gateway<br/>Traefik / Nginx with Auto-SSL]
    
    subgraph Compute Cluster [Scalable Application Tier]
        LB --> API1[API Node 1 :5000]
        LB --> API2[API Node 2 :5000]
        LB --> APIn[API Node N :5000]
        LB --> WebSPA[Static Web App CDN / S3]
    end

    subgraph Data Tier [High-Availability Persistence]
        API1 & API2 & APIn --> MongoPrimary[(MongoDB Primary<br/>WiredTiger Engine)]
        MongoPrimary -.-> MongoSec1[(MongoDB Secondary 1)]
        MongoPrimary -.-> MongoSec2[(MongoDB Secondary 2)]
        
        API1 & API2 & APIn --> S3Store[(Tenant S3 Storage<br/>MinIO / AWS S3)]
        API1 & API2 & APIn --> RedisCache[(Redis Cluster<br/>Sessions & Rate Limits)]
    end
```

---

## 2. Infrastructure Sizing & Requirements

| Component | Minimum Production Spec | Recommended Enterprise Spec | Notes |
| :--- | :--- | :--- | :--- |
| **API Application Nodes** | 2 Nodes (2 vCPU, 4GB RAM) | 4+ Nodes (4 vCPU, 8GB RAM) | Horizontally autoscaling behind load balancer |
| **Database Cluster** | 3-Node Replica Set (4 vCPU, 16GB RAM, NVMe SSD) | 3-Node Dedicated Cluster (8 vCPU, 32GB RAM, Provisioned IOPS) | MongoDB 7.0+ with WiredTiger cache enabled |
| **Tenant Object Storage** | 250 GB S3-compatible | 2 TB+ S3 / Cloudflare R2 | Multi-region durable object storage |
| **Ingress / Reverse Proxy** | 1 Node (2 vCPU, 4GB RAM) | High-availability active-passive pair | Traefik v3 or Nginx with Let's Encrypt |

---

## 3. Production Environment Configuration (`.env`)

Create a secured `/etc/smartschool/.env` file with restrictive permissions (`chmod 600`):

```bash
# --- Application Environment ---
NODE_ENV=production
PORT=5000
API_PUBLIC_URL=https://api.smartschoolsaas.com
FRONTEND_PUBLIC_URL=https://app.smartschoolsaas.com
PLATFORM_DOMAIN=smartschoolsaas.com

# --- Database Tier ---
# MongoDB Replica Set connection with SSL/TLS and replica set verification
MONGODB_URI=mongodb://user:StrongPass123!@mongo-node1:27017,mongo-node2:27017,mongo-node3:27017/smart_school_erp?replicaSet=rs0&authSource=admin&ssl=true

# --- Cryptographic Tokens ---
# Generate using: openssl rand -base64 48
JWT_SECRET=c84f67d609214ab9a18413a9686fe492658823b190f845a7d90390f7a93417de65c3b9420
JWT_EXPIRES_IN=1d
REFRESH_TOKEN_SECRET=3a84df0025fbc741e98d5c6b4e2874bc053a94837dc8295a63901bce4710db842
REFRESH_TOKEN_EXPIRES_IN=7d

# --- CORS & Domain Gateway ---
# Comma-separated list of trusted platform origins; wildcard support handles verified tenant custom domains
CORS_ORIGIN=https://app.smartschoolsaas.com,https://admin.smartschoolsaas.com

# --- Ingress & DNS Configuration ---
VENDOR_EDGE_IP=198.51.100.24
CNAME_TARGET=ingress.smartschoolsaas.com

# --- Object Storage (Tenant Files) ---
STORAGE_PROVIDER=s3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAEXAMPLEACCESSKEY
AWS_SECRET_ACCESS_KEY=exampleSecretKeyTenantStorage123456
AWS_S3_BUCKET=smartschool-tenant-assets

# --- Logging & Auditing ---
LOG_LEVEL=info
ENABLE_AUDIT_LOGS=true
```

---

## 4. Reverse Proxy & Ingress Configurations

### Option A: Traefik Ingress Configuration (Recommended for Auto-SSL)

Traefik dynamically requests and renews Let's Encrypt SSL certificates for wildcard platform domains and dynamically verified school custom domains.

```yaml
# /etc/traefik/traefik.yml
api:
  dashboard: false

entryPoints:
  web:
    address: ":80"
    http:
      redirections:
        entryPoint:
          to: websecure
          scheme: https
  websecure:
    address: ":443"

certificatesResolvers:
  letsencrypt:
    acme:
      email: certs@smartschoolsaas.com
      storage: /etc/traefik/acme.json
      httpChallenge:
        entryPoint: web

providers:
  file:
    directory: /etc/traefik/conf.d
    watch: true
```

Dynamic route configuration:
```yaml
# /etc/traefik/conf.d/smartschool-routes.yml
http:
  routers:
    api-router:
      rule: "Host(`api.smartschoolsaas.com`)"
      entryPoints: ["websecure"]
      service: api-service
      tls:
        certResolver: letsencrypt

    tenant-router:
      rule: "HostRegexp(`{domain:[a-z0-9.-]+}`)"
      entryPoints: ["websecure"]
      service: web-service
      tls:
        certResolver: letsencrypt

  services:
    api-service:
      loadBalancer:
        servers:
          - url: "http://10.0.1.10:5000"
          - url: "http://10.0.1.11:5000"
    web-service:
      loadBalancer:
        servers:
          - url: "http://10.0.1.20:80"
```

---

### Option B: Nginx Production Configuration

```nginx
# /etc/nginx/sites-available/smartschool-multi-tenant.conf

# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=30r/s;
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/s;

# Upstream API cluster
upstream api_cluster {
    least_conn;
    server 10.0.1.10:5000 max_fails=3 fail_timeout=10s;
    server 10.0.1.11:5000 max_fails=3 fail_timeout=10s;
    keepalive 32;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name .smartschoolsaas.com;
    return 301 https://$host$request_uri;
}

# Main Application Gateway
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ~^(?<subdomain>.+)\.smartschoolsaas.com$ app.smartschoolsaas.com;

    ssl_certificate /etc/letsencrypt/live/smartschoolsaas.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/smartschoolsaas.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Frame-Options SAMEORIGIN always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    root /var/www/smartschool-web/dist;
    index index.html;

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # API Proxy
    location /api/ {
        limit_req zone=api_limit burst=50 nodelay;

        proxy_pass http://api_cluster;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_connect_timeout 5s;
        proxy_read_timeout 60s;
    }

    # SPA routing fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 5. Strict Tenant Data Isolation & Storage Layout

### Database Security Controls
1. **Compound Indexes**: Every tenant-owned document collection includes a primary compound index on `{ schoolId: 1, ... }`.
2. **Server-Side Enforcement**: The `resolveTenant` middleware extracts and cryptographically validates the tenant identity from the signed JWT token. Any request attempting cross-tenant access is terminated with `403 Forbidden` (`TENANT_MISMATCH`).
3. **No Cross-School Database Queries**: Queries never execute without `{ schoolId: req.tenantId }`.

### Tenant Object Storage Partitioning (S3 / MinIO)
Uploaded documents, branding logos, student photos, and receipts are isolated into deterministic tenant directory trees:
```
s3://smartschool-tenant-assets/
├── schools/
│   ├── 670c1a8e9f123456789abc01/         <-- Unique School ID
│   │   ├── branding/
│   │   │   ├── logo_1728859200.png
│   │   │   └── favicon_1728859200.ico
│   │   ├── receipts/
│   │   │   └── 2026/
│   │   │       └── REC-2026-0042.pdf
│   │   └── students/
│   │       └── photos/
│   │           └── ADM-2026-0001.webp
│   └── 670c1a8e9f123456789abc02/         <-- Separate Tenant Boundary
│       └── ...
```
File downloads are served strictly via short-lived, pre-signed URLs (60-second expiration) generated after server-side tenant permission checks.

---

## 6. High-Availability MongoDB Replica Set Deployment

### Deploying the Replica Set
Initialize a 3-member replica set (`rs0`) across distinct availability zones:

```bash
# Connect to Primary Node
mongosh "mongodb://localhost:27017"

# Initialize replica set
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "mongo-node1:27017", priority: 2 },
    { _id: 1, host: "mongo-node2:27017", priority: 1 },
    { _id: 2, host: "mongo-node3:27017", priority: 1 }
  ]
})
```

### Automated Disaster Recovery & Backups
1. **Continuous Point-In-Time Backups**: Use MongoDB Atlas or automated backup daemon with oplog tailing.
2. **Scheduled Daily Physical Dump**:
   ```bash
   mongodump --uri="mongodb://mongo-cluster/smart_school_erp?replicaSet=rs0" --gzip --archive=/backups/backup-$(date +%F).gz
   ```
3. **Tenant-Specific Logical Extraction**: To export or restore a single school's complete data footprint (e.g. for customer compliance or migration):
   ```bash
   SCHOOL_ID="670c1a8e9f123456789abc01"
   
   # Export all collections scoped to target school
   for coll in users students courses attendances invoices audits; do
     mongoexport --uri="mongodb://mongo-cluster/smart_school_erp" \
       --collection=$coll \
       --query="{\"schoolId\": {\"\$oid\": \"$SCHOOL_ID\"}}" \
       --out="/exports/$SCHOOL_ID/$coll.json"
   done
   ```

---

## 7. Production Docker Compose Deployment

A turnkey `docker-compose.prod.yml` configuration for deploying the full stack on Linux VM clusters:

```yaml
version: '3.8'

services:
  traefik:
    image: traefik:v3.1
    command:
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web"
      - "--certificatesresolvers.letsencrypt.acme.email=admin@smartschoolsaas.com"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock:ro"
      - "./letsencrypt:/letsencrypt"
    restart: always

  api:
    image: smartschool-api:latest
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    restart: always
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo-primary:27017/smart_school_erp
      - JWT_SECRET=${JWT_SECRET}
    deploy:
      replicas: 3
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.api.rule=Host(`api.smartschoolsaas.com`)"
      - "traefik.http.routers.api.entrypoints=websecure"
      - "traefik.http.routers.api.tls.certresolver=letsencrypt"
      - "traefik.http.services.api.loadbalancer.server.port=5000"

  web:
    image: smartschool-web:latest
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    restart: always
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.web.rule=HostRegexp(`{domain:.+}`)"
      - "traefik.http.routers.web.entrypoints=websecure"
      - "traefik.http.routers.web.tls.certresolver=letsencrypt"
      - "traefik.http.services.web.loadbalancer.server.port=80"
```

---

## 8. Health Monitoring & Observability

- **API Health Endpoint**: `GET /api/health` returns status code `200` with uptime, memory footprint, and MongoDB connection status.
- **Vendor Audit Trail**: Monitored via the Vendor Super Admin Portal (`/super-admin/audit`) capturing all tenant activations, plan updates, and emergency support logins.
- **License Capacity Alarms**: Prometheus alerts fire when a school reaches 90% of its `maxStudents` subscription threshold.

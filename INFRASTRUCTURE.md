# EduFarm Infrastructure Guide

## 🚀 Quick Start

### Full Stack Deployment

```bash
# 1. Start PostgreSQL HA cluster with pgpool-II
docker-compose -f docker-compose.postgres-ha.yml up -d

# 2. Start monitoring stack (Prometheus, Grafana, Loki)
docker-compose -f docker-compose.monitoring.yml up -d

# 3. Start ELK stack (Elasticsearch, Kibana, Logstash)
docker-compose -f docker-compose.elk.yml up -d

# 4. Start main application
docker-compose up -d
```

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Load Balancer / Ingress                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend Pods (3-20 replicas)              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Backend  │  │ Backend  │  │ Backend  │  │ Backend  │   │
│  │  Node 1  │  │  Node 2  │  │  Node 3  │  │  Node N  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
         │                │                │
         └────────────────┼────────────────┘
                          ▼
         ┌────────────────────────────────┐
         │     Redis (WebSocket Adapter)   │
         └────────────────────────────────┘
                          │
                          ▼
         ┌────────────────────────────────┐
         │         Pgpool-II              │
         │    (Connection Pooling)        │
         └────────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         ▼                ▼                ▼
    ┌────────┐      ┌────────┐      ┌────────┐
    │  PG    │◄────►│  PG    │◄────►│  PG    │
    │ Primary│      │Replica1│      │Replica2│
    └────────┘      └────────┘      └────────┘
                          │
                          ▼
         ┌────────────────────────────────┐
         │      MinIO / S3 Storage         │
         └────────────────────────────────┘
```

## 🗄️ PostgreSQL High Availability

### Architecture

- **Primary Node**: Handles all writes and reads
- **Replica 1 & 2**: Handle read queries via pgpool-II load balancing
- **Pgpool-II**: Connection pooling, load balancing, automatic failover

### Access Points

```bash
# Primary (read/write)
psql -h localhost -p 5432 -U postgres -d edufarm

# Replica 1 (read-only)
psql -h localhost -p 5433 -U postgres -d edufarm

# Replica 2 (read-only)
psql -h localhost -p 5434 -U postgres -d edufarm

# Pgpool (load balanced)
psql -h localhost -p 5430 -U postgres -d edufarm
```

### Configuration

Backend `.env`:
```env
# Use pgpool for load-balanced connections
DB_HOST=pgpool
DB_PORT=5430
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=edufarm
```

### Monitoring

- **Pgpool Admin**: http://localhost:9898
- **Postgres Exporter**: http://localhost:9187/metrics

### Manual Failover

```bash
# Check replication status
docker exec edufarm-postgres-primary psql -U postgres -c "SELECT * FROM pg_stat_replication;"

# Promote replica to primary (if primary fails)
docker exec edufarm-postgres-replica1 pg_ctl promote
```

## 📈 Monitoring Stack

### Components

1. **Prometheus** - Metrics collection
2. **Grafana** - Visualization dashboards
3. **Loki** - Log aggregation
4. **Promtail** - Log shipping
5. **Alertmanager** - Alert routing
6. **cAdvisor** - Container metrics
7. **Node Exporter** - System metrics

### Access

- **Grafana**: http://localhost:3000 (admin/admin)
- **Prometheus**: http://localhost:9090
- **Alertmanager**: http://localhost:9093
- **cAdvisor**: http://localhost:8080

### Pre-configured Dashboards

1. **EduFarm Overview** (`edufarm-overview`)
   - Request rate
   - Response time
   - Error rate
   - WebSocket connections
   - Database performance
   - Business metrics (tasks, submissions)

2. **EduFarm Performance** (`edufarm-performance`)
   - API response time percentiles (p50, p95, p99)
   - Database query duration
   - Memory usage
   - Event loop performance

### Import Dashboards

```bash
# Dashboards are auto-loaded from:
monitoring/grafana/dashboards/
├── edufarm-overview.json
└── edufarm-performance.json
```

### Custom Metrics

Backend exposes metrics at: http://localhost:3001/monitoring/metrics

```prometheus
# HTTP request rate
rate(http_requests_total[5m])

# Response time (p95)
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Error rate
rate(errors_total[5m])

# WebSocket connections
websocket_connections

# Database query performance
histogram_quantile(0.95, rate(database_query_duration_seconds_bucket[5m]))

# Active database connections
database_connections_active

# Business metrics
rate(tasks_completed_total[5m])
sum(submissions_total) by (status)
```

### Alert Configuration

Edit `monitoring/prometheus/alerts.yml` and `monitoring/alertmanager/alertmanager.yml`:

```yaml
# Example: Slack webhook
receivers:
  - name: 'slack'
    slack_configs:
      - api_url: 'YOUR_WEBHOOK_URL'
        channel: '#edufarm-alerts'
        title: '{{ .GroupLabels.alertname }}'
```

## 🔍 ELK Stack (Elasticsearch + Kibana + Logstash)

### Components

1. **Elasticsearch** - Search and analytics
2. **Kibana** - Log exploration and visualization
3. **Logstash** - Log processing pipeline
4. **Filebeat** - Log shipping from containers
5. **Metricbeat** - System and service metrics
6. **APM Server** - Application performance monitoring

### Access

- **Kibana**: http://localhost:5601
- **Elasticsearch**: http://localhost:9200
- **APM Server**: http://localhost:8200

### Setup Kibana

1. Open http://localhost:5601
2. Go to **Management** → **Index Patterns**
3. Create patterns:
   - `filebeat-edufarm-*`
   - `metricbeat-edufarm-*`
   - `apm-edufarm-*`

### Useful Queries

```
# All backend errors
container.name:"edufarm-backend" AND log_level:"ERROR"

# Slow API requests
container.name:"edufarm-backend" AND response_time > 1000

# Failed database queries
log_message:"QueryFailedError"

# WebSocket errors
log_message:"WebSocket" AND log_level:"ERROR"

# HTTP 5xx errors
status_code >= 500

# Specific user activity
user_id:"uuid-here"
```

### Custom Visualizations

Create in Kibana:
- Error rate over time (line chart)
- Top 10 slowest endpoints (bar chart)
- HTTP status code distribution (pie chart)
- Request volume by endpoint (heat map)

## ☸️ Kubernetes Deployment

### Prerequisites

```bash
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"

# Configure kubeconfig
export KUBECONFIG=~/.kube/config
```

### Deploy to Kubernetes

```bash
# 1. Create namespace
kubectl apply -f k8s/namespace.yaml

# 2. Apply secrets
kubectl apply -f k8s/secrets.yaml

# 3. Apply ConfigMap
kubectl apply -f k8s/configmap.yaml

# 4. Deploy application
kubectl apply -f k8s/deployment.yaml

# 5. Create service
kubectl apply -f k8s/service.yaml

# 6. Setup ingress
kubectl apply -f k8s/ingress.yaml

# 7. Configure autoscaling
kubectl apply -f k8s/hpa.yaml
```

### Update Secrets

```bash
# Edit secrets
kubectl edit secret edufarm-secrets -n edufarm-production

# Or replace from file
kubectl create secret generic edufarm-secrets \
  --from-literal=DB_PASSWORD=your_password \
  --from-literal=JWT_SECRET=your_jwt_secret \
  --from-literal=REDIS_PASSWORD=your_redis_password \
  --from-literal=MINIO_ACCESS_KEY=your_access_key \
  --from-literal=MINIO_SECRET_KEY=your_secret_key \
  -n edufarm-production \
  --dry-run=client -o yaml | kubectl apply -f -
```

### Monitor Deployment

```bash
# Check pods
kubectl get pods -n edufarm-production

# View logs
kubectl logs -f deployment/edufarm-backend -n edufarm-production

# Describe pod
kubectl describe pod <pod-name> -n edufarm-production

# Check HPA status
kubectl get hpa -n edufarm-production

# View resource usage
kubectl top pods -n edufarm-production
kubectl top nodes
```

### Scale Manually

```bash
# Scale backend
kubectl scale deployment edufarm-backend --replicas=10 -n edufarm-production

# Scale frontend
kubectl scale deployment edufarm-frontend --replicas=5 -n edufarm-production
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflows

1. **CI/CD Pipeline** (`.github/workflows/ci-cd.yml`)
   - Backend tests (unit + E2E)
   - Frontend tests + build
   - Security scanning (Trivy)
   - Docker image build & push
   - Kubernetes deployment (staging/production)

2. **Visual Regression** (`.github/workflows/visual-regression.yml`)
   - Playwright visual tests
   - Screenshot comparisons
   - Automatic failure notifications

### Required Secrets

Add to GitHub repository settings:

```bash
# Container Registry
REGISTRY_URL=ghcr.io/your-org
REGISTRY_USERNAME=github_username
REGISTRY_PASSWORD=github_pat_token

# Kubernetes
KUBE_CONFIG_STAGING=<base64-encoded-kubeconfig>
KUBE_CONFIG_PRODUCTION=<base64-encoded-kubeconfig>

# Application
VITE_API_URL=https://api.yourdomain.com
VITE_WS_URL=wss://api.yourdomain.com
STAGING_API_URL=https://api-staging.yourdomain.com
STAGING_WS_URL=wss://api-staging.yourdomain.com

# Monitoring
STAGING_SENTRY_DSN=https://...
STAGING_LOGROCKET_APP_ID=app-id

# Notifications
SLACK_WEBHOOK=https://hooks.slack.com/services/...

# Supabase (if used)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Deployment Flow

```
main branch push
    ↓
Run tests (backend + frontend + E2E)
    ↓
Security scan (Trivy)
    ↓
Build Docker images
    ↓
Push to registry
    ↓
Deploy to production (canary → full rollout)
    ↓
Health checks
    ↓
Slack notification

develop branch push
    ↓
Run tests
    ↓
Security scan
    ↓
Build Docker images
    ↓
Push to registry
    ↓
Deploy to staging
    ↓
Health checks
    ↓
Slack notification
```

### Manual Deployment

```bash
# Build and push manually
docker build -t your-registry/edufarm-backend:latest ./backend
docker push your-registry/edufarm-backend:latest

docker build -t your-registry/edufarm-frontend:latest .
docker push your-registry/edufarm-frontend:latest

# Deploy to Kubernetes
kubectl set image deployment/edufarm-backend \
  backend=your-registry/edufarm-backend:latest \
  -n edufarm-production

kubectl rollout status deployment/edufarm-backend -n edufarm-production
```

## 🔐 Security Best Practices

### Secrets Management

```bash
# Never commit secrets to Git
# Use Kubernetes secrets or external secret managers

# Example: Use sealed-secrets
kubectl create secret generic edufarm-secrets \
  --from-literal=DB_PASSWORD=password \
  --dry-run=client -o yaml | \
  kubeseal -o yaml > sealed-secret.yaml
```

### Network Policies

```yaml
# Restrict pod-to-pod communication
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: edufarm-network-policy
spec:
  podSelector:
    matchLabels:
      app: edufarm-backend
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: edufarm-frontend
  egress:
    - to:
        - podSelector:
            matchLabels:
              app: postgres
    - to:
        - podSelector:
            matchLabels:
              app: redis
```

### SSL/TLS

```bash
# Use cert-manager for automatic certificate management
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Configure Let's Encrypt issuer
kubectl apply -f k8s/cert-issuer.yaml
```

## 📊 Performance Tuning

### Backend Optimization

```typescript
// Enable connection pooling
DB_POOL_SIZE=20
DB_POOL_MIN=5

// Redis caching
REDIS_TTL=3600

// Enable compression
ENABLE_COMPRESSION=true
```

### Database Optimization

```sql
-- Analyze and vacuum regularly
ANALYZE;
VACUUM ANALYZE;

-- Check slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Optimize indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_name ON table_name(column);
```

### Horizontal Scaling

```bash
# Increase replicas based on load
kubectl scale deployment/edufarm-backend --replicas=20 -n edufarm-production

# Or let HPA handle it automatically (configured in k8s/hpa.yaml)
# Scale from 3 to 20 replicas based on CPU/Memory
```

## 🧪 Testing

### Local Testing

```bash
# Backend tests
cd backend
npm run test
npm run test:e2e

# Frontend tests
npm run test

# E2E tests
npm run test:e2e
```

### Load Testing

```bash
# Install k6
brew install k6

# Run load test
k6 run loadtest.js
```

### Smoke Tests

```bash
# Check health endpoints
curl http://localhost:3001/api/health
curl http://localhost:3001/monitoring/metrics

# Check database connection
psql -h localhost -p 5430 -U postgres -d edufarm -c "SELECT 1"

# Check Redis connection
redis-cli -h localhost ping
```

## 🔧 Troubleshooting

### Logs

```bash
# Backend logs
docker logs -f edufarm-backend

# Kubernetes logs
kubectl logs -f deployment/edufarm-backend -n edufarm-production

# Stream logs from multiple pods
kubectl logs -f -l app=edufarm-backend -n edufarm-production --all-containers=true
```

### Common Issues

**Issue: Pods not starting**
```bash
kubectl describe pod <pod-name> -n edufarm-production
# Check events section for errors
```

**Issue: Database connection refused**
```bash
# Check if pgpool is running
docker ps | grep pgpool

# Test connection
psql -h localhost -p 5430 -U postgres -d edufarm
```

**Issue: High memory usage**
```bash
# Check resource usage
kubectl top pods -n edufarm-production

# Adjust resource limits in k8s/deployment.yaml
```

## 📚 Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Prometheus Query Examples](https://prometheus.io/docs/prometheus/latest/querying/examples/)
- [Grafana Dashboard Best Practices](https://grafana.com/docs/grafana/latest/dashboards/)
- [ELK Stack Guide](https://www.elastic.co/guide/index.html)
- [PostgreSQL High Availability](https://www.postgresql.org/docs/current/high-availability.html)

## 🆘 Support

For issues and questions:
1. Check logs in Kibana or Grafana
2. Review metrics in Prometheus
3. Check pod status in Kubernetes
4. Review GitHub Actions logs
5. Open issue in GitHub repository

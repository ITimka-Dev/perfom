# Kubernetes Deployment Guide for EduFarm

This directory contains Kubernetes manifests for deploying the EduFarm application in a production environment.

## Prerequisites

- Kubernetes cluster (1.24+)
- kubectl configured
- Helm (optional, for managing releases)
- Ingress controller (nginx-ingress recommended)
- cert-manager (for TLS certificates)

## Architecture

The deployment includes:
- **Backend**: 3-20 pods (auto-scaling)
- **Frontend**: 2-10 pods (auto-scaling)
- **PostgreSQL**: Stateful database
- **Redis**: In-memory cache for Socket.io scaling
- **MinIO**: S3-compatible object storage

## Deployment Steps

### 1. Create Namespace

```bash
kubectl apply -f namespace.yaml
```

### 2. Configure Secrets

**IMPORTANT**: Update secrets with production values before deploying!

```bash
# Edit secrets.yaml with your production values
vim secrets.yaml

# Apply secrets
kubectl apply -f secrets.yaml
```

Or create secrets from command line:

```bash
kubectl create secret generic edufarm-secrets \
  --from-literal=DB_USERNAME=postgres \
  --from-literal=DB_PASSWORD=your_secure_password \
  --from-literal=JWT_SECRET=your_jwt_secret_minimum_32_chars \
  --from-literal=REDIS_PASSWORD=your_redis_password \
  --from-literal=S3_ACCESS_KEY=your_minio_access_key \
  --from-literal=S3_SECRET_KEY=your_minio_secret_key \
  -n edufarm
```

### 3. Apply ConfigMap

```bash
# Edit configmap.yaml with your domain and settings
vim configmap.yaml

kubectl apply -f configmap.yaml
```

### 4. Deploy Services

```bash
kubectl apply -f service.yaml
```

### 5. Deploy Applications

```bash
kubectl apply -f deployment.yaml
```

### 6. Configure Horizontal Pod Autoscaling

```bash
kubectl apply -f hpa.yaml
```

### 7. Setup Ingress

**Before applying ingress:**
- Update domain names in `ingress.yaml`
- Ensure cert-manager is installed for TLS
- Configure DNS to point to your cluster

```bash
kubectl apply -f ingress.yaml
```

## Monitoring

Check deployment status:

```bash
# Get all resources
kubectl get all -n edufarm

# Check pod status
kubectl get pods -n edufarm

# Check HPA status
kubectl get hpa -n edufarm

# View logs
kubectl logs -f deployment/edufarm-backend -n edufarm
kubectl logs -f deployment/edufarm-frontend -n edufarm
```

## Scaling

### Manual Scaling

```bash
# Scale backend
kubectl scale deployment edufarm-backend --replicas=5 -n edufarm

# Scale frontend
kubectl scale deployment edufarm-frontend --replicas=3 -n edufarm
```

### Auto-scaling

HPA automatically scales between:
- Backend: 3-20 pods based on CPU (70%) and Memory (80%)
- Frontend: 2-10 pods based on CPU (70%) and Memory (80%)

## Rolling Updates

```bash
# Update backend image
kubectl set image deployment/edufarm-backend backend=edufarm/backend:v2.0.0 -n edufarm

# Update frontend image
kubectl set image deployment/edufarm-frontend frontend=edufarm/frontend:v2.0.0 -n edufarm

# Check rollout status
kubectl rollout status deployment/edufarm-backend -n edufarm
```

## Rollback

```bash
# Rollback to previous version
kubectl rollout undo deployment/edufarm-backend -n edufarm

# Rollback to specific revision
kubectl rollout undo deployment/edufarm-backend --to-revision=2 -n edufarm
```

## Health Checks

The deployment includes:
- **Liveness probes**: Restart unhealthy containers
- **Readiness probes**: Remove unhealthy pods from service

## Resource Limits

### Backend (per pod):
- Request: 256Mi RAM, 250m CPU
- Limit: 512Mi RAM, 500m CPU

### Frontend (per pod):
- Request: 128Mi RAM, 100m CPU
- Limit: 256Mi RAM, 200m CPU

## Troubleshooting

### Pod not starting

```bash
kubectl describe pod <pod-name> -n edufarm
kubectl logs <pod-name> -n edufarm
```

### Service not accessible

```bash
kubectl get svc -n edufarm
kubectl get endpoints -n edufarm
```

### Database connection issues

```bash
# Check if database is running
kubectl get pods -n edufarm | grep postgres

# Test connection from backend pod
kubectl exec -it <backend-pod> -n edufarm -- sh
nc -zv postgres 5432
```

### Redis connection issues

```bash
# Check if Redis is running
kubectl get pods -n edufarm | grep redis

# Test connection
kubectl exec -it <backend-pod> -n edufarm -- sh
redis-cli -h redis ping
```

## Security Considerations

1. **Secrets**: Never commit actual secret values to Git
2. **RBAC**: Configure proper role-based access control
3. **Network Policies**: Restrict pod-to-pod communication
4. **Pod Security**: Enable pod security policies
5. **TLS**: Always use HTTPS in production (cert-manager)

## Backup & Disaster Recovery

### Database Backup

```bash
# Create backup
kubectl exec -it <postgres-pod> -n edufarm -- pg_dump -U postgres edufarm > backup.sql

# Restore backup
kubectl exec -i <postgres-pod> -n edufarm -- psql -U postgres edufarm < backup.sql
```

### Persistent Volumes

Ensure PersistentVolumes are backed up according to your cloud provider's recommendations.

## Clean Up

```bash
# Delete all resources
kubectl delete namespace edufarm

# Or delete individually
kubectl delete -f deployment.yaml
kubectl delete -f service.yaml
kubectl delete -f hpa.yaml
kubectl delete -f ingress.yaml
kubectl delete -f configmap.yaml
kubectl delete -f secrets.yaml
kubectl delete -f namespace.yaml
```

## Cost Optimization

1. Use node affinity to schedule pods on appropriate instance types
2. Implement cluster autoscaler for node-level scaling
3. Use spot instances for non-critical workloads
4. Monitor resource usage and adjust limits
5. Enable pod disruption budgets for high availability

## Performance Tuning

1. **Database**: Use connection pooling (already configured)
2. **Redis**: Configure appropriate memory limits
3. **WebSocket**: Redis adapter enables horizontal scaling
4. **Storage**: Use fast SSDs for database volumes
5. **CDN**: Use CDN for static frontend assets

## Support

For issues or questions, check:
- Application logs: `kubectl logs -n edufarm`
- Kubernetes events: `kubectl get events -n edufarm`
- Monitoring dashboard: See `monitoring/` directory

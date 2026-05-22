# EduFarm Monitoring Stack

Complete monitoring solution for EduFarm using Prometheus, Grafana, Loki, and Alertmanager.

## Components

### 1. Prometheus
- **Port**: 9090
- **Purpose**: Metrics collection and storage
- **Metrics Collected**:
  - HTTP requests (total, duration, status codes)
  - WebSocket connections
  - Database query performance
  - Application errors
  - System metrics (CPU, memory, disk)

### 2. Grafana
- **Port**: 3000
- **Default Credentials**: admin/admin (change immediately!)
- **Purpose**: Metrics visualization and dashboards
- **Features**:
  - Pre-configured datasources (Prometheus, Loki)
  - Custom dashboards for EduFarm
  - Alert visualization

### 3. Loki
- **Port**: 3100
- **Purpose**: Log aggregation and querying
- **Log Sources**:
  - Application logs
  - Container logs
  - System logs

### 4. Promtail
- **Purpose**: Log shipping to Loki
- **Configuration**: Ships Docker container logs

### 5. Alertmanager
- **Port**: 9093
- **Purpose**: Alert routing and management
- **Features**:
  - Alert grouping
  - Silencing
  - Inhibition rules

### 6. cAdvisor
- **Port**: 8080
- **Purpose**: Container metrics

### 7. Node Exporter
- **Port**: 9100
- **Purpose**: System-level metrics

## Quick Start

### 1. Start Monitoring Stack

```bash
docker-compose -f docker-compose.monitoring.yml up -d
```

### 2. Access Dashboards

- **Grafana**: http://localhost:3000
  - Username: admin
  - Password: admin
  
- **Prometheus**: http://localhost:9090
- **Alertmanager**: http://localhost:9093
- **cAdvisor**: http://localhost:8080

### 3. Configure Alerts

Edit `monitoring/alertmanager/alertmanager.yml` to add:
- Slack webhooks
- Email notifications
- PagerDuty integration

## Metrics Exposed by EduFarm

### HTTP Metrics

```
# Total HTTP requests
http_requests_total{method="GET",route="/api/tasks",status_code="200"}

# Request duration histogram
http_request_duration_seconds{method="POST",route="/api/submissions",status_code="201"}
```

### WebSocket Metrics

```
# Active WebSocket connections
websocket_connections{namespace="/farm"}

# Total WebSocket messages
websocket_messages_total{namespace="/tasks",event="submission:new"}
```

### Database Metrics

```
# Query duration
database_query_duration_seconds{query_type="SELECT",table="tasks"}

# Active connections
database_connections_active
```

### Application Metrics

```
# Total errors
errors_total{type="ValidationError",endpoint="/api/tasks"}

# Completed tasks
tasks_completed_total{zone_id="math"}

# Submissions
submissions_total{status="pending"}
```

## Custom Dashboards

Create custom Grafana dashboards for:

### 1. Application Overview
- Request rate
- Error rate
- Response time
- Active users

### 2. Performance
- Database query performance
- Cache hit rate
- API endpoint latency
- WebSocket message rate

### 3. Business Metrics
- Tasks completed per hour
- Submissions per zone
- User engagement
- System load

## Alerting Rules

Pre-configured alerts in `monitoring/prometheus/alerts.yml`:

### Critical Alerts
- `HighErrorRate`: >5% errors for 5 minutes
- `ServiceDown`: Service unreachable for 2 minutes
- `HighMemoryUsage`: >85% memory usage for 5 minutes

### Warning Alerts
- `HighResponseTime`: 95th percentile >2s for 5 minutes
- `HighCPUUsage`: >80% CPU usage for 5 minutes
- `HighDatabaseConnections`: >80 active connections

## Querying Logs with Loki

### Via Grafana
1. Open Grafana
2. Go to Explore
3. Select Loki datasource
4. Use LogQL queries:

```logql
# All logs from backend
{container="backend"}

# Error logs only
{container="backend"} |= "ERROR"

# Logs from specific endpoint
{container="backend"} | json | endpoint="/api/tasks"

# Aggregate error count
sum(rate({container="backend"} |= "ERROR" [5m]))
```

## Prometheus Queries (PromQL)

### Request Rate
```promql
# Requests per second
rate(http_requests_total[5m])

# Requests per endpoint
sum by (route) (rate(http_requests_total[5m]))
```

### Error Rate
```promql
# Error percentage
(
  sum(rate(http_requests_total{status_code=~"5.."}[5m]))
  /
  sum(rate(http_requests_total[5m]))
) * 100
```

### Response Time
```promql
# 95th percentile response time
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Average response time per endpoint
avg by (route) (rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m]))
```

## Setting Up Alerts

### Slack Integration

Edit `monitoring/alertmanager/alertmanager.yml`:

```yaml
receivers:
  - name: 'slack'
    slack_configs:
      - api_url: 'YOUR_SLACK_WEBHOOK_URL'
        channel: '#alerts'
        title: '{{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
```

### Email Alerts

```yaml
receivers:
  - name: 'email'
    email_configs:
      - to: 'alerts@example.com'
        from: 'alertmanager@example.com'
        smarthost: 'smtp.gmail.com:587'
        auth_username: 'your-email@gmail.com'
        auth_password: 'your-app-password'
```

## Backup & Retention

### Prometheus Data Retention
- Default: 30 days
- Configure in `prometheus.yml`:
  ```yaml
  --storage.tsdb.retention.time=30d
  ```

### Loki Data Retention
- Configure in `loki-config.yml`:
  ```yaml
  limits_config:
    retention_period: 744h  # 31 days
  ```

## Performance Tuning

### Prometheus
```yaml
# Increase scrape interval for less critical services
scrape_configs:
  - job_name: 'low-priority'
    scrape_interval: 60s
```

### Loki
```yaml
# Adjust ingestion limits
limits_config:
  ingestion_rate_mb: 10
  ingestion_burst_size_mb: 20
```

## Troubleshooting

### Prometheus Not Scraping

```bash
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# Check Prometheus config
docker exec edufarm-prometheus promtool check config /etc/prometheus/prometheus.yml
```

### Grafana Connection Issues

```bash
# Check Grafana logs
docker logs edufarm-grafana

# Restart Grafana
docker restart edufarm-grafana
```

### Loki Not Receiving Logs

```bash
# Check Promtail logs
docker logs edufarm-promtail

# Test Loki endpoint
curl http://localhost:3100/ready
```

## Scaling Monitoring

For large deployments:

1. **Prometheus Federation**: Aggregate metrics from multiple Prometheus instances
2. **Thanos**: Long-term storage and global query view
3. **Cortex**: Multi-tenant Prometheus as a service
4. **Loki Clustering**: Distribute log ingestion and storage

## Security

### Secure Grafana
1. Change default password immediately
2. Enable HTTPS
3. Configure OAuth (Google, GitHub, etc.)
4. Set up user roles and permissions

### Secure Prometheus
1. Enable basic auth
2. Use TLS for metrics endpoints
3. Restrict access with firewall rules

## Cost Optimization

1. Adjust retention periods based on needs
2. Use sampling for high-cardinality metrics
3. Archive old data to object storage
4. Optimize Prometheus recording rules

## Maintenance

### Regular Tasks
- Review and update alert rules
- Clean up unused dashboards
- Update Grafana plugins
- Backup Grafana dashboards
- Review metric cardinality

### Monthly Tasks
- Review alert fatigue
- Optimize slow queries
- Clean up old data
- Update monitoring stack versions

## Production Checklist

- [ ] Change default Grafana password
- [ ] Configure alert destinations (Slack, Email, PagerDuty)
- [ ] Set up dashboard backup
- [ ] Configure data retention policies
- [ ] Enable HTTPS for all services
- [ ] Set up authentication for Prometheus
- [ ] Configure firewall rules
- [ ] Test alert routing
- [ ] Document runbooks for alerts
- [ ] Set up on-call rotation

## Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Loki Documentation](https://grafana.com/docs/loki/)
- [PromQL Cheat Sheet](https://promlabs.com/promql-cheat-sheet/)
- [LogQL Cheat Sheet](https://grafana.com/docs/loki/latest/logql/)

# ELK Stack for EduFarm

## Overview

Complete logging and monitoring solution using the Elastic Stack:

- **Elasticsearch**: Search and analytics engine
- **Kibana**: Visualization and exploration
- **Logstash**: Log processing pipeline
- **Filebeat**: Log shipping from containers
- **Metricbeat**: System and service metrics
- **APM Server**: Application performance monitoring

## Quick Start

```bash
# Start ELK stack
docker-compose -f docker-compose.elk.yml up -d

# Wait for Elasticsearch to be ready (2-3 minutes)
curl http://localhost:9200/_cluster/health

# Access Kibana
open http://localhost:5601
```

## Architecture

```
┌──────────────┐
│  Containers  │
│    (Logs)    │
└──────┬───────┘
       │
       ▼
┌──────────────┐         ┌──────────────┐
│   Filebeat   │────────▶│  Logstash    │
└──────────────┘         └──────┬───────┘
                                │
       ┌────────────────────────┘
       │
       ▼
┌──────────────┐         ┌──────────────┐
│ Elasticsearch│◀───────│   Kibana     │
└──────┬───────┘         └──────────────┘
       │
       ▼
┌──────────────┐
│  APM Server  │
└──────────────┘
```

## Access Points

- **Kibana**: http://localhost:5601
- **Elasticsearch**: http://localhost:9200
- **Logstash**: Beats input on port 5044
- **APM Server**: http://localhost:8200

## Setup Kibana

### 1. Create Index Patterns

1. Open http://localhost:5601
2. Go to **Stack Management** → **Index Patterns**
3. Create the following patterns:

```
filebeat-edufarm-*
metricbeat-edufarm-*
apm-edufarm-*
docker-logs-*
```

### 2. Import Pre-built Dashboards

```bash
# Import Filebeat dashboards
docker exec edufarm-filebeat filebeat setup --dashboards

# Import Metricbeat dashboards
docker exec edufarm-metricbeat metricbeat setup --dashboards
```

## Log Analysis

### Discover Logs

Navigate to **Discover** in Kibana.

### Useful Queries (KQL - Kibana Query Language)

```kql
# All backend errors
container.name:"edufarm-backend" AND log.level:"ERROR"

# Slow API requests (>1 second)
container.name:"edufarm-backend" AND response_time > 1000

# Database errors
log_message:"QueryFailedError" OR log_message:"connection refused"

# WebSocket errors
log_message:"WebSocket" AND log.level:"ERROR"

# HTTP 5xx errors
status_code >= 500 AND status_code < 600

# Specific endpoint
request_path:"/api/tasks" AND http_method:"POST"

# Time range
@timestamp >= "2024-01-01" AND @timestamp <= "2024-01-31"

# User activity
user_id:"uuid-here" AND log.level:"INFO"

# Authentication failures
log_message:"Unauthorized" OR log_message:"Invalid credentials"
```

### Lucene Syntax (Alternative)

```lucene
# Boolean operators
log.level:ERROR AND container.name:edufarm-backend
log.level:(ERROR OR WARN)
log.level:ERROR NOT container.name:postgres

# Wildcards
log_message:Query*
log_message:*Error*
user_email:*@example.com

# Regex
log_message:/[0-9]{3}-[0-9]{3}-[0-9]{4}/

# Range queries
response_time:[1000 TO *]
status_code:[500 TO 599]
```

## Visualizations

### Create Dashboard

1. Go to **Dashboard** → **Create dashboard**
2. Add visualizations:

#### Error Rate Over Time (Line Chart)

- **Metric**: Count
- **Bucket**: Date Histogram on @timestamp
- **Filter**: log.level:ERROR

#### Top 10 Slowest Endpoints (Bar Chart)

- **Metric**: Average of response_time
- **Bucket**: Terms on request_path
- **Size**: 10
- **Order by**: Metric (descending)

#### HTTP Status Distribution (Pie Chart)

- **Metric**: Count
- **Bucket**: Terms on status_code

#### Request Volume Heatmap

- **Metric**: Count
- **Bucket X**: Date Histogram on @timestamp (hourly)
- **Bucket Y**: Terms on request_path

#### Error Log Table

- **Columns**: @timestamp, log.level, log_message, container.name
- **Filter**: log.level:ERROR
- **Sort**: @timestamp descending

## Metricbeat Dashboards

### System Metrics

Navigate to **Dashboard** → Search "Metricbeat system"

Metrics include:
- CPU usage
- Memory usage
- Disk I/O
- Network traffic
- Process list

### Docker Metrics

Search "Metricbeat docker"

Metrics include:
- Container CPU usage
- Container memory usage
- Container network I/O
- Container health status

### PostgreSQL Metrics

Search "Metricbeat PostgreSQL"

Metrics include:
- Database size
- Table sizes
- Index usage
- Connection count
- Transaction rate
- Deadlocks

### Redis Metrics

Search "Metricbeat Redis"

Metrics include:
- Memory usage
- Hit rate
- Connected clients
- Commands per second
- Keyspace statistics

## APM (Application Performance Monitoring)

### Instrument Backend

Install APM agent:

```bash
cd backend
npm install elastic-apm-node
```

Add to `src/main.ts`:

```typescript
// At the very top, before any other imports
import apm from 'elastic-apm-node';

apm.start({
  serviceName: 'edufarm-backend',
  serverUrl: 'http://apm-server:8200',
  environment: process.env.NODE_ENV || 'development',
});

// Rest of imports and code...
```

### View APM Data

1. Go to **Observability** → **APM**
2. Select **edufarm-backend** service
3. Explore:
   - **Transactions**: API endpoint performance
   - **Errors**: Exception tracking
   - **Metrics**: JVM metrics (for Node.js)
   - **Service Map**: Dependencies visualization

## Alerting

### Create Alert

1. Go to **Stack Management** → **Rules and Connectors**
2. Click **Create rule**

#### Example: High Error Rate Alert

```json
{
  "name": "High Error Rate",
  "tags": ["backend", "errors"],
  "consumer": "alerts",
  "ruleTypeId": ".es-query",
  "schedule": {
    "interval": "5m"
  },
  "params": {
    "index": ["filebeat-edufarm-*"],
    "timeField": "@timestamp",
    "esQuery": "log.level:ERROR",
    "threshold": [10],
    "thresholdComparator": ">",
    "timeWindowSize": 5,
    "timeWindowUnit": "m"
  },
  "actions": [
    {
      "group": "threshold met",
      "id": "slack-connector-id",
      "params": {
        "message": "High error rate detected: {{context.hits}} errors in 5 minutes"
      }
    }
  ]
}
```

### Slack Integration

1. Go to **Stack Management** → **Connectors**
2. Create **Slack** connector
3. Add webhook URL
4. Use in alert actions

## Log Retention

### Configure in Elasticsearch

```bash
# Delete old indices automatically
curl -X PUT "localhost:9200/_ilm/policy/edufarm-logs" -H 'Content-Type: application/json' -d'
{
  "policy": {
    "phases": {
      "hot": {
        "actions": {
          "rollover": {
            "max_size": "50GB",
            "max_age": "7d"
          }
        }
      },
      "delete": {
        "min_age": "30d",
        "actions": {
          "delete": {}
        }
      }
    }
  }
}
'
```

### Manual Deletion

```bash
# Delete indices older than 30 days
curator_cli --host localhost delete-indices \
  --filter_list '[{"filtertype":"age","source":"name","direction":"older","timestring":"%Y.%m.%d","unit":"days","unit_count":30}]'
```

## Performance Optimization

### Elasticsearch Tuning

Edit `docker-compose.elk.yml`:

```yaml
environment:
  - "ES_JAVA_OPTS=-Xms2g -Xmx2g"  # 50% of container memory
  - bootstrap.memory_lock=true
```

### Indexing Performance

```bash
# Increase refresh interval (for bulk indexing)
curl -X PUT "localhost:9200/filebeat-edufarm-*/_settings" -H 'Content-Type: application/json' -d'
{
  "index": {
    "refresh_interval": "30s"
  }
}
'
```

### Query Performance

```bash
# Check slow queries
curl -X GET "localhost:9200/_cat/indices?v&h=index,search.query_time_in_millis,search.query_total&s=search.query_time_in_millis:desc"

# Clear cache if needed
curl -X POST "localhost:9200/_cache/clear"
```

## Backup & Restore

### Create Snapshot Repository

```bash
# Create snapshot directory
docker exec edufarm-elasticsearch mkdir -p /usr/share/elasticsearch/backup

# Register repository
curl -X PUT "localhost:9200/_snapshot/edufarm_backup" -H 'Content-Type: application/json' -d'
{
  "type": "fs",
  "settings": {
    "location": "/usr/share/elasticsearch/backup"
  }
}
'
```

### Create Snapshot

```bash
# Create snapshot
curl -X PUT "localhost:9200/_snapshot/edufarm_backup/snapshot_1?wait_for_completion=true"

# List snapshots
curl -X GET "localhost:9200/_snapshot/edufarm_backup/_all"
```

### Restore Snapshot

```bash
# Close indices
curl -X POST "localhost:9200/filebeat-edufarm-*/_close"

# Restore
curl -X POST "localhost:9200/_snapshot/edufarm_backup/snapshot_1/_restore"

# Reopen indices
curl -X POST "localhost:9200/filebeat-edufarm-*/_open"
```

## Troubleshooting

### Elasticsearch Won't Start

```bash
# Check logs
docker logs edufarm-elasticsearch

# Common issue: vm.max_map_count too low
sudo sysctl -w vm.max_map_count=262144

# Make permanent
echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf
```

### Kibana Can't Connect to Elasticsearch

```bash
# Check Elasticsearch health
curl http://localhost:9200/_cluster/health

# Check Kibana logs
docker logs edufarm-kibana

# Restart Kibana
docker restart edufarm-kibana
```

### No Logs Appearing

```bash
# Check Filebeat status
docker logs edufarm-filebeat

# Test Filebeat can reach Logstash
docker exec edufarm-filebeat nc -zv logstash 5044

# Check Logstash processing
docker logs edufarm-logstash

# Manually test log ingestion
echo '{"message":"test log"}' | docker exec -i edufarm-logstash nc localhost 5000
```

### Disk Space Full

```bash
# Check disk usage
curl "localhost:9200/_cat/allocation?v"

# Delete old indices
curl -X DELETE "localhost:9200/filebeat-edufarm-2024.01.*"

# Or use curator (recommended)
curator_cli --host localhost delete-indices \
  --filter_list '[{"filtertype":"age","source":"creation_date","direction":"older","unit":"days","unit_count":7}]'
```

## Security

### Enable X-Pack Security

Edit `docker-compose.elk.yml`:

```yaml
environment:
  - xpack.security.enabled=true
  - xpack.security.enrollment.enabled=true
```

### Create Users

```bash
# Generate password for elastic user
docker exec edufarm-elasticsearch bin/elasticsearch-reset-password -u elastic

# Create custom users
docker exec edufarm-elasticsearch bin/elasticsearch-users useradd edufarm_user -p password -r superuser
```

## Cost Estimation

### Disk Space

- **Logs**: ~1-5GB/day (depends on traffic)
- **Metrics**: ~100-500MB/day
- **APM**: ~500MB-2GB/day
- **Total**: Plan for 50-150GB/month

### Resource Requirements

- **Elasticsearch**: 4 CPU, 8GB RAM (minimum)
- **Kibana**: 1 CPU, 2GB RAM
- **Logstash**: 1 CPU, 2GB RAM
- **Beats**: 0.5 CPU, 512MB RAM each

## Production Recommendations

1. **Elasticsearch cluster**: Run 3+ nodes for HA
2. **Index lifecycle management**: Auto-delete old logs
3. **Snapshot backups**: Daily automated backups
4. **Monitoring**: Use Elastic Cloud monitoring
5. **Security**: Enable authentication and TLS
6. **Resource limits**: Set appropriate CPU/memory
7. **Shard strategy**: Don't over-shard (1 shard per 50GB)
8. **Separate hot/warm nodes**: Archive old data to slower storage
9. **Alerting**: Set up alerts for critical errors
10. **Documentation**: Document custom queries and dashboards

## Additional Resources

- [Elasticsearch Documentation](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)
- [Kibana User Guide](https://www.elastic.co/guide/en/kibana/current/index.html)
- [Filebeat Reference](https://www.elastic.co/guide/en/beats/filebeat/current/index.html)
- [APM Documentation](https://www.elastic.co/guide/en/apm/guide/current/index.html)

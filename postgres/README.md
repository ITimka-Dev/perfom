# PostgreSQL High Availability Setup

## Architecture

```
┌─────────────────┐
│   Application   │
│    (Backend)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Pgpool-II     │  ← Connection pooling, load balancing, failover
│  (Port 5430)    │
└────────┬────────┘
         │
    ┌────┴────┬────────────┐
    ▼         ▼            ▼
┌─────────┐ ┌──────────┐ ┌──────────┐
│PostgreSQL│ │PostgreSQL│ │PostgreSQL│
│ Primary  │ │ Replica1 │ │ Replica2 │
│(Port 5432)│(Port 5433)│(Port 5434)│
│   R/W    │ │   R/O    │ │   R/O    │
└─────────┘ └──────────┘ └──────────┘
     │           │            │
     └───────────┴────────────┘
         Streaming Replication
```

## Quick Start

```bash
# Start PostgreSQL HA cluster
docker-compose -f docker-compose.postgres-ha.yml up -d

# Wait for replication to setup (30-60 seconds)
sleep 60

# Check cluster status
docker-compose -f docker-compose.postgres-ha.yml ps
```

## Verification

### Check Replication Status

```bash
# On primary
docker exec edufarm-postgres-primary psql -U postgres -c "SELECT * FROM pg_stat_replication;"

# Expected output: 2 replicas connected
```

### Test Read/Write Split

```bash
# Write to primary (via pgpool)
docker exec edufarm-pgpool psql -U postgres -d edufarm -c "INSERT INTO test_table (data) VALUES ('test');"

# Read from replica (automatically load balanced)
docker exec edufarm-pgpool psql -U postgres -d edufarm -c "SELECT * FROM test_table;"
```

### Check Pgpool Status

```bash
# Show pool nodes
docker exec edufarm-pgpool psql -U postgres -d edufarm -c "SHOW POOL_NODES;"

# Expected output: 3 nodes (1 primary + 2 replicas)
```

## Connection Strings

### For Application (Recommended)

```env
# Use pgpool for load balancing
DB_HOST=pgpool
DB_PORT=5430
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=edufarm
```

### Direct Connections

```bash
# Primary (read/write) - localhost
postgresql://postgres:password@localhost:5432/edufarm

# Replica 1 (read-only) - localhost
postgresql://postgres:password@localhost:5433/edufarm

# Replica 2 (read-only) - localhost
postgresql://postgres:password@localhost:5434/edufarm

# Pgpool (load balanced) - localhost
postgresql://postgres:password@localhost:5430/edufarm

# Inside Docker network
postgresql://postgres:password@pgpool:5432/edufarm
```

## Features

### Automatic Load Balancing

- **Write queries** → Always go to primary
- **Read queries** → Load balanced across primary + replicas
- **Algorithm**: Round-robin with connection pooling

### Connection Pooling

- **Max connections per child**: 100
- **Num init children**: 32
- **Reuses connections**: Reduces overhead

### Automatic Failover

If primary fails:
1. Pgpool detects failure via health checks
2. Promotes a replica to primary
3. Updates routing automatically
4. No application downtime (brief connection reset)

## Configuration

### Primary Configuration

File: `postgres/primary/postgresql.conf`

Key settings:
```conf
wal_level = replica
max_wal_senders = 10
max_replication_slots = 10
hot_standby = on
```

### Replication User

Created automatically: `replicator` / `replicator_password`

Change in:
- `postgres/primary/init-primary.sh`
- `docker-compose.postgres-ha.yml` (pg_basebackup command)

## Monitoring

### Prometheus Metrics

Endpoint: http://localhost:9187/metrics

Key metrics:
- `pg_stat_database_*`: Database statistics
- `pg_stat_replication_*`: Replication lag
- `pg_locks_*`: Lock information

### Grafana Dashboard

Import pre-built PostgreSQL dashboard:
- Dashboard ID: 9628 (PostgreSQL Database)
- Or create custom using metrics above

### Replication Lag

```bash
# Check lag on primary
docker exec edufarm-postgres-primary psql -U postgres -c "
SELECT 
    client_addr,
    state,
    sent_lsn,
    write_lsn,
    flush_lsn,
    replay_lsn,
    sync_state,
    pg_wal_lsn_diff(sent_lsn, replay_lsn) AS lag_bytes
FROM pg_stat_replication;
"
```

## Manual Operations

### Promote Replica to Primary

If primary fails permanently:

```bash
# 1. Promote replica1 to primary
docker exec edufarm-postgres-replica1 pg_ctl promote

# 2. Update pgpool configuration to point to new primary
# Edit docker-compose.postgres-ha.yml
# Update PGPOOL_BACKEND_NODES

# 3. Restart pgpool
docker restart edufarm-pgpool
```

### Add New Replica

```bash
# 1. Create new replica container
# Add to docker-compose.postgres-ha.yml

# 2. Initialize from primary
docker exec new-replica pg_basebackup -h postgres-primary -U replicator -D /var/lib/postgresql/data

# 3. Configure as standby
# 4. Start replica
# 5. Update pgpool configuration
```

### Backup Primary

```bash
# Logical backup (SQL dump)
docker exec edufarm-postgres-primary pg_dump -U postgres edufarm > backup.sql

# Physical backup (PITR-ready)
docker exec edufarm-postgres-primary pg_basebackup -U postgres -D /backup -Ft -z -P
```

### Restore from Backup

```bash
# From SQL dump
docker exec -i edufarm-postgres-primary psql -U postgres edufarm < backup.sql

# From physical backup
# 1. Stop primary
# 2. Replace data directory with backup
# 3. Start primary
```

## Performance Tuning

### Shared Buffers

Recommended: 25% of system RAM

```conf
# In postgresql.conf
shared_buffers = 256MB  # For 1GB RAM
shared_buffers = 2GB    # For 8GB RAM
shared_buffers = 8GB    # For 32GB RAM
```

### Connection Pooling

```conf
# Pgpool settings in docker-compose.postgres-ha.yml
PGPOOL_NUM_INIT_CHILDREN=32      # Number of pool processes
PGPOOL_MAX_POOL=4                # Connections per pool process
PGPOOL_CHILD_LIFE_TIME=300       # Child process lifetime (seconds)
```

### Query Optimization

```sql
-- Enable query statistics
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Find slow queries
SELECT 
    query,
    calls,
    total_exec_time,
    mean_exec_time,
    max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Create indexes for slow queries
CREATE INDEX CONCURRENTLY idx_name ON table_name(column_name);
```

## Troubleshooting

### Issue: Replicas not syncing

```bash
# Check primary for errors
docker logs edufarm-postgres-primary

# Check replica for errors
docker logs edufarm-postgres-replica1

# Check replication slots
docker exec edufarm-postgres-primary psql -U postgres -c "SELECT * FROM pg_replication_slots;"

# Restart replica
docker restart edufarm-postgres-replica1
```

### Issue: Pgpool shows replica as down

```bash
# Check pgpool logs
docker logs edufarm-pgpool

# Check node status
docker exec edufarm-pgpool psql -U postgres -c "SHOW POOL_NODES;"

# Attach node manually
docker exec edufarm-pgpool pcp_attach_node -h localhost -p 9898 -U admin -n 1
```

### Issue: High replication lag

```bash
# Check network between primary and replica
docker exec edufarm-postgres-replica1 ping postgres-primary

# Check WAL archive
docker exec edufarm-postgres-primary psql -U postgres -c "SELECT pg_current_wal_lsn();"

# Increase wal_keep_size
# Edit postgres/primary/postgresql.conf
wal_keep_size = 2048  # MB
```

### Issue: Connection refused

```bash
# Check if services are running
docker-compose -f docker-compose.postgres-ha.yml ps

# Test direct connection to primary
psql -h localhost -p 5432 -U postgres -d edufarm

# Test connection via pgpool
psql -h localhost -p 5430 -U postgres -d edufarm

# Check pg_hba.conf allows connections
docker exec edufarm-postgres-primary cat /etc/postgresql/pg_hba.conf
```

## Security

### Change Default Passwords

```bash
# 1. Update in docker-compose.postgres-ha.yml
POSTGRES_PASSWORD=new_strong_password

# 2. Update replicator password
# Edit postgres/primary/init-primary.sh

# 3. Rebuild containers
docker-compose -f docker-compose.postgres-ha.yml down -v
docker-compose -f docker-compose.postgres-ha.yml up -d
```

### SSL/TLS Encryption

```bash
# Generate certificates
openssl req -new -x509 -days 365 -nodes -text -out server.crt -keyout server.key

# Add to postgresql.conf
ssl = on
ssl_cert_file = 'server.crt'
ssl_key_file = 'server.key'

# Connect with SSL
psql "postgresql://postgres:password@localhost:5432/edufarm?sslmode=require"
```

### Restrict Connections

Edit `postgres/primary/pg_hba.conf`:

```conf
# Only allow specific IPs
host    all             all             10.0.0.0/8              md5
host    all             all             172.16.0.0/12           md5

# Require SSL
hostssl all             all             0.0.0.0/0               md5
```

## Production Recommendations

1. **Use external volumes**: Mount data directories to host for persistence
2. **Backup regularly**: Daily automated backups to S3/GCS
3. **Monitor replication lag**: Alert if lag > 100MB or 60 seconds
4. **Use strong passwords**: Generate random 32+ character passwords
5. **Enable SSL**: Always encrypt connections in production
6. **Separate networks**: Isolate database network from application
7. **Resource limits**: Set appropriate CPU/memory limits
8. **Log retention**: Keep PostgreSQL logs for 7+ days
9. **Health checks**: Monitor with Prometheus + Alertmanager
10. **Disaster recovery**: Test restore procedures monthly

## Cost Estimation

### AWS RDS Equivalent

- **RDS Multi-AZ (db.t3.medium)**: ~$200/month
- **Self-managed on EC2**: ~$50/month + management overhead
- **This setup (containers)**: $0 infrastructure + compute costs

### Resource Requirements

- **Primary**: 2 CPU, 4GB RAM, 100GB SSD
- **Each Replica**: 2 CPU, 4GB RAM, 100GB SSD
- **Pgpool**: 1 CPU, 1GB RAM
- **Total**: 7 CPU, 13GB RAM, 300GB storage

## Additional Resources

- [PostgreSQL Streaming Replication](https://www.postgresql.org/docs/current/warm-standby.html)
- [Pgpool-II Documentation](https://www.pgpool.net/docs/latest/en/html/)
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)

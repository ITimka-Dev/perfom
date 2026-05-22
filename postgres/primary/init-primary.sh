#!/bin/bash
set -e

# Create replication user
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE USER replicator WITH REPLICATION ENCRYPTED PASSWORD 'replicator_password';
    GRANT CONNECT ON DATABASE $POSTGRES_DB TO replicator;
EOSQL

echo "Primary database initialized with replication user"

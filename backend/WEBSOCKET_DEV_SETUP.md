# WebSocket Development Setup

## Automatic Development Logging

The backend WebSocket gateways automatically log all events in development mode (`NODE_ENV=development`).

### What Gets Logged

#### Farm Gateway (`/farm` namespace)
- Client connections and disconnections
- Room joins
- All emitted events:
  - `plant:updated`
  - `plant:harvested`
  - `animal:updated`
  - `animal:collected`
  - `production:started`
  - `production:completed`
  - `inventory:updated`

#### Pet Gateway (`/pet` namespace)
- Client connections and disconnections
- Room joins
- All emitted events:
  - `pet:created`
  - `pet:statsUpdated`
  - `pet:fed`
  - `pet:watered`
  - `pet:played`
  - `pet:itemUsed`
  - `pet:ranAway`

### Log Format

Logs are prefixed with `[Farm WebSocket]` or `[Pet WebSocket]` for easy filtering:

```
[Farm WebSocket] Client connected: abc123
[Farm WebSocket] Client abc123 joined room user:user-id-123
[Pet WebSocket] Client connected: def456
[Pet WebSocket] Client def456 joined pet room user:user-id-123
```

### Frontend Development Logging

The frontend `useRealtimeUpdates` hook also logs all events in development mode:

```typescript
[WebSocket:farm] Connected { socketId: 'abc123' }
[WebSocket:farm] plant:updated { id: '...', ... }
[WebSocket:pet] pet:fed { id: '...', ... }
```

### Disabling Logs

To disable WebSocket logs, set `NODE_ENV=production` in your `.env` file.

### Debugging Tips

1. **Check Console**: Open browser DevTools to see frontend WebSocket logs
2. **Check Terminal**: Backend logs appear in the terminal running NestJS
3. **Network Tab**: Use DevTools Network tab to inspect WebSocket frames
4. **Socket.io Admin**: Consider installing Socket.io Admin UI for visual debugging

### Common Issues

**Connection Errors**: Check that:
- Backend is running on the correct port
- `CORS_ORIGIN` is set correctly in backend `.env`
- `VITE_BACKEND_URL` is set correctly in frontend `.env`

**Events Not Received**: Verify:
- Client called `joinUserRoom` with correct userId
- Room name matches on client and server (`user:${userId}`)
- Event names match exactly between emit and listener

# WebSocket Real-time Updates

## Overview

The backend provides WebSocket connections for real-time updates of farm and pet states. This allows the frontend to receive instant notifications when data changes.

## Namespaces

- `/farm` - Farm-related updates (plants, animals, production)
- `/pet` - Pet-related updates (stats, actions)

## Connection

```typescript
import { io } from 'socket.io-client';

const farmSocket = io('http://localhost:3001/farm', {
  transports: ['websocket']
});

const petSocket = io('http://localhost:3001/pet', {
  transports: ['websocket']
});
```

## Join User Room

After connecting, join your user-specific room to receive updates:

```typescript
farmSocket.emit('joinUserRoom', userId);
petSocket.emit('joinUserRoom', userId);
```

## Farm Events

### Listen to Events

```typescript
// Plant updates
farmSocket.on('plant:updated', (plant) => {
  console.log('Plant updated:', plant);
});

farmSocket.on('plant:harvested', ({ plantId, item }) => {
  console.log('Plant harvested:', plantId, item);
});

// Animal updates
farmSocket.on('animal:updated', (animal) => {
  console.log('Animal updated:', animal);
});

farmSocket.on('animal:collected', ({ animalId, item }) => {
  console.log('Product collected:', animalId, item);
});

// Production updates
farmSocket.on('production:started', (production) => {
  console.log('Production started:', production);
});

farmSocket.on('production:completed', ({ productionId, item }) => {
  console.log('Production completed:', productionId, item);
});

// Inventory updates
farmSocket.on('inventory:updated', (inventory) => {
  console.log('Inventory updated:', inventory);
});
```

## Pet Events

### Listen to Events

```typescript
// Pet creation
petSocket.on('pet:created', (pet) => {
  console.log('Pet created:', pet);
});

// Pet stats updates
petSocket.on('pet:statsUpdated', (pet) => {
  console.log('Pet stats updated:', pet);
});

// Pet actions
petSocket.on('pet:fed', (pet) => {
  console.log('Pet fed:', pet);
});

petSocket.on('pet:watered', (pet) => {
  console.log('Pet watered:', pet);
});

petSocket.on('pet:played', (pet) => {
  console.log('Played with pet:', pet);
});

petSocket.on('pet:itemUsed', ({ pet, item }) => {
  console.log('Item used on pet:', pet, item);
});

petSocket.on('pet:ranAway', ({ petId }) => {
  console.log('Pet ran away:', petId);
});
```

## Cleanup

Always disconnect sockets when component unmounts:

```typescript
useEffect(() => {
  return () => {
    farmSocket.disconnect();
    petSocket.disconnect();
  };
}, []);
```

## Error Handling

```typescript
farmSocket.on('connect_error', (error) => {
  console.error('Farm socket connection error:', error);
});

petSocket.on('connect_error', (error) => {
  console.error('Pet socket connection error:', error);
});
```

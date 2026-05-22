# Testing Guide

## Running Tests

### Unit Tests
```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov

# Debug tests
npm run test:debug
```

### E2E Tests
```bash
# Run all e2e tests
npm run test:e2e
```

## Test Structure

### Unit Tests
Located in `src/**/*.spec.ts` files, unit tests focus on testing individual services and their methods in isolation.

**Example test files:**
- `src/modules/auth/auth.service.spec.ts` - Authentication service tests
- `src/modules/users/users.service.spec.ts` - User service tests
- `src/modules/tasks/tasks.service.spec.ts` - Tasks service tests
- `src/modules/progress/progress.service.spec.ts` - Progress service tests

### E2E Tests
Located in `test/**/*.e2e-spec.ts` files, e2e tests focus on testing entire API endpoints and their integration.

**Example test files:**
- `test/auth.e2e-spec.ts` - Authentication endpoints tests
- `test/tasks.e2e-spec.ts` - Tasks endpoints tests
- `test/farm.e2e-spec.ts` - Farm endpoints tests

## Testing API Endpoints via Swagger

1. Start the backend server:
```bash
cd backend
npm run start:dev
```

2. Open Swagger UI at: http://localhost:3001/api

3. Test endpoints:
   - Click on any endpoint to expand it
   - Click "Try it out"
   - Fill in required parameters
   - Click "Execute"

### Authentication Flow in Swagger

1. **Sign up** via `/auth/signup`:
```json
{
  "email": "test@example.com",
  "password": "password123",
  "fullName": "Test User"
}
```

2. **Copy the `access_token`** from the response

3. **Authorize** by clicking the "Authorize" button at the top and pasting the token

4. Now you can test protected endpoints

## WebSocket Integration Tests

### Running WebSocket Tests

WebSocket integration tests are located in `test/farm-websocket.e2e-spec.ts` and `test/pet-websocket.e2e-spec.ts`:

```bash
# Run WebSocket tests specifically
npm run test:e2e -- --testNamePattern="WebSocket"

# Run farm WebSocket tests
npm run test:e2e -- farm-websocket.e2e-spec.ts

# Run pet WebSocket tests
npm run test:e2e -- pet-websocket.e2e-spec.ts
```

### What the WebSocket Tests Cover

**Farm Gateway Tests:**
- Connection and disconnection handling
- Room management (joining user-specific rooms)
- Plant events (updated, harvested)
- Animal events (updated, collected)
- Production events (started, completed)
- Inventory updates
- Multiple clients in the same room
- Error handling

**Pet Gateway Tests:**
- Connection and disconnection handling
- Room management
- Pet creation and stats updates
- Pet care actions (feeding, watering, playing)
- Item usage on pets
- Pet running away scenarios
- Multiple clients in the same room
- Pet lifecycle management

## Testing WebSocket Events Manually

### Farm WebSocket Events (namespace: `/farm`)

1. Connect to `ws://localhost:3001/farm`
2. Join user room:
```json
{
  "event": "joinUserRoom",
  "data": "user-id-here"
}
```

3. Listen for events:
- `plant:updated` - Plant state updated
- `plant:harvested` - Plant harvested
- `animal:updated` - Animal state updated
- `animal:collected` - Resource collected from animal
- `production:started` - Production started
- `production:completed` - Production completed
- `inventory:updated` - Inventory updated

### Pet WebSocket Events (namespace: `/pet`)

1. Connect to `ws://localhost:3001/pet`
2. Join user room:
```json
{
  "event": "joinUserRoom",
  "data": "user-id-here"
}
```

3. Listen for events:
- `pet:created` - New pet created
- `pet:statsUpdated` - Pet stats updated
- `pet:fed` - Pet fed
- `pet:watered` - Pet watered
- `pet:played` - Played with pet
- `pet:itemUsed` - Item used on pet
- `pet:ranAway` - Pet ran away

### WebSocket Test Script Example

```javascript
const io = require('socket.io-client');

// Connect to farm namespace
const farmSocket = io('http://localhost:3001/farm');

farmSocket.on('connect', () => {
  console.log('Connected to farm socket');
  
  // Join user room
  farmSocket.emit('joinUserRoom', 'your-user-id');
});

// Listen for events
farmSocket.on('plant:updated', (data) => {
  console.log('Plant updated:', data);
});

farmSocket.on('inventory:updated', (data) => {
  console.log('Inventory updated:', data);
});
```

## Coverage Reports

After running `npm run test:cov`, view the coverage report at:
`backend/coverage/lcov-report/index.html`

## Writing New Tests

### Unit Test Template
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { YourService } from './your.service';

describe('YourService', () => {
  let service: YourService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        YourService,
        // Mock dependencies here
      ],
    }).compile();

    service = module.get<YourService>(YourService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('yourMethod', () => {
    it('should do something', async () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = await service.yourMethod(input);
      
      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

### E2E Test Template
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('YourController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/your-endpoint (GET)', () => {
    return request(app.getHttpServer())
      .get('/your-endpoint')
      .expect(200);
  });
});
```

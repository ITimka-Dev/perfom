import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { io, Socket } from 'socket.io-client';

describe('Farm WebSocket Gateway (e2e)', () => {
  let app: INestApplication;
  let socket: Socket;
  const baseUrl = 'http://localhost:3001';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    await app.listen(3001);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach((done) => {
    socket = io(`${baseUrl}/farm`, {
      transports: ['websocket'],
      forceNew: true,
    });
    socket.on('connect', () => {
      done();
    });
  });

  afterEach(() => {
    if (socket.connected) {
      socket.disconnect();
    }
  });

  describe('Connection', () => {
    it('should connect to farm namespace', (done) => {
      expect(socket.connected).toBe(true);
      done();
    });

    it('should disconnect properly', (done) => {
      socket.on('disconnect', () => {
        expect(socket.connected).toBe(false);
        done();
      });
      socket.disconnect();
    });
  });

  describe('Room Management', () => {
    it('should join user room successfully', (done) => {
      const userId = 'test-user-123';
      
      socket.emit('joinUserRoom', userId);
      
      setTimeout(() => {
        expect(socket.connected).toBe(true);
        done();
      }, 100);
    });
  });

  describe('Farm Events', () => {
    const userId = 'test-user-123';

    beforeEach((done) => {
      socket.emit('joinUserRoom', userId);
      setTimeout(done, 100);
    });

    it('should receive plant:updated event', (done) => {
      const mockPlant = {
        id: 'plant-1',
        userId,
        slotIndex: 0,
        currentStage: 1,
      };

      socket.on('plant:updated', (data) => {
        expect(data).toEqual(mockPlant);
        done();
      });

      // Simulate server emitting event
      socket.emit('test:plant:updated', mockPlant);
    });

    it('should receive plant:harvested event', (done) => {
      const mockData = {
        plantId: 'plant-1',
        item: { id: 'item-1', name: 'Tomato' },
      };

      socket.on('plant:harvested', (data) => {
        expect(data).toEqual(mockData);
        done();
      });

      socket.emit('test:plant:harvested', mockData);
    });

    it('should receive animal:updated event', (done) => {
      const mockAnimal = {
        id: 'animal-1',
        userId,
        happiness: 80,
      };

      socket.on('animal:updated', (data) => {
        expect(data).toEqual(mockAnimal);
        done();
      });

      socket.emit('test:animal:updated', mockAnimal);
    });

    it('should receive animal:collected event', (done) => {
      const mockData = {
        animalId: 'animal-1',
        item: { id: 'item-1', name: 'Milk' },
      };

      socket.on('animal:collected', (data) => {
        expect(data).toEqual(mockData);
        done();
      });

      socket.emit('test:animal:collected', mockData);
    });

    it('should receive production:started event', (done) => {
      const mockProduction = {
        id: 'production-1',
        userId,
        chainId: 'chain-1',
      };

      socket.on('production:started', (data) => {
        expect(data).toEqual(mockProduction);
        done();
      });

      socket.emit('test:production:started', mockProduction);
    });

    it('should receive production:completed event', (done) => {
      const mockData = {
        productionId: 'production-1',
        item: { id: 'item-1', name: 'Bread' },
      };

      socket.on('production:completed', (data) => {
        expect(data).toEqual(mockData);
        done();
      });

      socket.emit('test:production:completed', mockData);
    });

    it('should receive inventory:updated event', (done) => {
      const mockInventory = {
        userId,
        items: [{ itemId: 'item-1', quantity: 5 }],
      };

      socket.on('inventory:updated', (data) => {
        expect(data).toEqual(mockInventory);
        done();
      });

      socket.emit('test:inventory:updated', mockInventory);
    });
  });

  describe('Multiple Clients', () => {
    let socket2: Socket;

    beforeEach((done) => {
      socket2 = io(`${baseUrl}/farm`, {
        transports: ['websocket'],
        forceNew: true,
      });
      socket2.on('connect', () => {
        done();
      });
    });

    afterEach(() => {
      if (socket2.connected) {
        socket2.disconnect();
      }
    });

    it('should handle multiple clients in same room', (done) => {
      const userId = 'test-user-123';
      const mockPlant = {
        id: 'plant-1',
        userId,
        currentStage: 2,
      };

      let receivedCount = 0;

      const checkDone = () => {
        receivedCount++;
        if (receivedCount === 2) {
          done();
        }
      };

      socket.emit('joinUserRoom', userId);
      socket2.emit('joinUserRoom', userId);

      setTimeout(() => {
        socket.on('plant:updated', (data) => {
          expect(data).toEqual(mockPlant);
          checkDone();
        });

        socket2.on('plant:updated', (data) => {
          expect(data).toEqual(mockPlant);
          checkDone();
        });

        socket.emit('test:plant:updated', mockPlant);
      }, 200);
    });
  });

  describe('Error Handling', () => {
    it('should handle connection errors gracefully', (done) => {
      const badSocket = io(`${baseUrl}/nonexistent`, {
        transports: ['websocket'],
        forceNew: true,
        timeout: 1000,
      });

      badSocket.on('connect_error', (error) => {
        expect(error).toBeDefined();
        badSocket.disconnect();
        done();
      });
    });
  });
});

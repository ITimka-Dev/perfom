import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { io, Socket } from 'socket.io-client';

describe('Pet WebSocket Gateway (e2e)', () => {
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
    socket = io(`${baseUrl}/pet`, {
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
    it('should connect to pet namespace', (done) => {
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
      const userId = 'test-user-456';
      
      socket.emit('joinUserRoom', userId);
      
      setTimeout(() => {
        expect(socket.connected).toBe(true);
        done();
      }, 100);
    });
  });

  describe('Pet Events', () => {
    const userId = 'test-user-456';

    beforeEach((done) => {
      socket.emit('joinUserRoom', userId);
      setTimeout(done, 100);
    });

    it('should receive pet:created event', (done) => {
      const mockPet = {
        id: 'pet-1',
        userId,
        name: 'Fluffy',
        type: 'cat',
        hunger: 100,
        thirst: 100,
        happiness: 100,
      };

      socket.on('pet:created', (data) => {
        expect(data).toEqual(mockPet);
        done();
      });

      socket.emit('test:pet:created', mockPet);
    });

    it('should receive pet:statsUpdated event', (done) => {
      const mockPet = {
        id: 'pet-1',
        userId,
        hunger: 80,
        thirst: 90,
        happiness: 85,
      };

      socket.on('pet:statsUpdated', (data) => {
        expect(data).toEqual(mockPet);
        done();
      });

      socket.emit('test:pet:statsUpdated', mockPet);
    });

    it('should receive pet:fed event', (done) => {
      const mockPet = {
        id: 'pet-1',
        userId,
        hunger: 100,
      };

      socket.on('pet:fed', (data) => {
        expect(data).toEqual(mockPet);
        done();
      });

      socket.emit('test:pet:fed', mockPet);
    });

    it('should receive pet:watered event', (done) => {
      const mockPet = {
        id: 'pet-1',
        userId,
        thirst: 100,
      };

      socket.on('pet:watered', (data) => {
        expect(data).toEqual(mockPet);
        done();
      });

      socket.emit('test:pet:watered', mockPet);
    });

    it('should receive pet:played event', (done) => {
      const mockPet = {
        id: 'pet-1',
        userId,
        happiness: 95,
      };

      socket.on('pet:played', (data) => {
        expect(data).toEqual(mockPet);
        done();
      });

      socket.emit('test:pet:played', mockPet);
    });

    it('should receive pet:itemUsed event', (done) => {
      const mockData = {
        pet: {
          id: 'pet-1',
          userId,
          hunger: 100,
        },
        item: {
          id: 'item-1',
          name: 'Premium Food',
        },
      };

      socket.on('pet:itemUsed', (data) => {
        expect(data).toEqual(mockData);
        done();
      });

      socket.emit('test:pet:itemUsed', mockData);
    });

    it('should receive pet:ranAway event', (done) => {
      const mockData = {
        petId: 'pet-1',
      };

      socket.on('pet:ranAway', (data) => {
        expect(data).toEqual(mockData);
        done();
      });

      socket.emit('test:pet:ranAway', mockData);
    });
  });

  describe('Pet Lifecycle', () => {
    const userId = 'test-user-456';

    beforeEach((done) => {
      socket.emit('joinUserRoom', userId);
      setTimeout(done, 100);
    });

    it('should handle complete pet care cycle', (done) => {
      const events = ['pet:fed', 'pet:watered', 'pet:played'];
      let receivedEvents = 0;

      const mockPet = {
        id: 'pet-1',
        userId,
        hunger: 100,
        thirst: 100,
        happiness: 100,
      };

      events.forEach((event) => {
        socket.on(event, (data) => {
          expect(data.id).toBe(mockPet.id);
          receivedEvents++;
          if (receivedEvents === events.length) {
            done();
          }
        });
      });

      setTimeout(() => {
        socket.emit('test:pet:fed', mockPet);
        socket.emit('test:pet:watered', mockPet);
        socket.emit('test:pet:played', mockPet);
      }, 100);
    });
  });

  describe('Multiple Clients', () => {
    let socket2: Socket;

    beforeEach((done) => {
      socket2 = io(`${baseUrl}/pet`, {
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
      const userId = 'test-user-456';
      const mockPet = {
        id: 'pet-1',
        userId,
        happiness: 95,
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
        socket.on('pet:statsUpdated', (data) => {
          expect(data).toEqual(mockPet);
          checkDone();
        });

        socket2.on('pet:statsUpdated', (data) => {
          expect(data).toEqual(mockPet);
          checkDone();
        });

        socket.emit('test:pet:statsUpdated', mockPet);
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

    it('should handle pet running away scenario', (done) => {
      const userId = 'test-user-456';
      
      socket.emit('joinUserRoom', userId);
      
      setTimeout(() => {
        socket.on('pet:ranAway', (data) => {
          expect(data.petId).toBeDefined();
          done();
        });

        socket.emit('test:pet:ranAway', { petId: 'pet-1' });
      }, 100);
    });
  });
});

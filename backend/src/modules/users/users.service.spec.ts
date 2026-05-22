import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Profile } from './entities/profile.entity';
import { TeacherSubject } from './entities/teacher-subject.entity';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: Repository<User>;
  let profilesRepository: Repository<Profile>;
  let teacherSubjectsRepository: Repository<TeacherSubject>;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    password: 'hashedPassword',
    role: 'student',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProfile = {
    id: 'user-1',
    fullName: 'Test User',
    schoolName: null,
    grade: null,
    bio: null,
    avatarUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Profile),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(TeacherSubject),
          useValue: {
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    usersRepository = module.get<Repository<User>>(getRepositoryToken(User));
    profilesRepository = module.get<Repository<Profile>>(getRepositoryToken(Profile));
    teacherSubjectsRepository = module.get<Repository<TeacherSubject>>(getRepositoryToken(TeacherSubject));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(mockUser as any);

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        relations: ['profile'],
      });
    });

    it('should return null if user not found', async () => {
      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(null);

      const result = await service.findByEmail('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      jest.spyOn(profilesRepository, 'findOne').mockResolvedValue(mockProfile as any);

      const result = await service.getProfile('user-1');

      expect(result).toEqual(mockProfile);
    });

    it('should throw NotFoundException if profile not found', async () => {
      jest.spyOn(profilesRepository, 'findOne').mockResolvedValue(null);

      await expect(service.getProfile('user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getTeacherSubjects', () => {
    it('should return teacher subjects', async () => {
      const mockSubjects = [
        { id: '1', userId: 'teacher-1', zoneId: 'zone-1' },
        { id: '2', userId: 'teacher-1', zoneId: 'zone-2' },
      ];

      jest.spyOn(teacherSubjectsRepository, 'find').mockResolvedValue(mockSubjects as any);

      const result = await service.getTeacherSubjects('teacher-1');

      expect(result).toEqual(['zone-1', 'zone-2']);
      expect(teacherSubjectsRepository.find).toHaveBeenCalledWith({
        where: { userId: 'teacher-1' },
        relations: ['zone'],
      });
    });
  });

  describe('updateTeacherSubjects', () => {
    it('should update teacher subjects', async () => {
      const zoneIds = ['zone-1', 'zone-2'];
      const mockNewSubjects = zoneIds.map(zoneId => ({ userId: 'teacher-1', zoneId }));

      jest.spyOn(teacherSubjectsRepository, 'delete').mockResolvedValue({ affected: 2 } as any);
      jest.spyOn(teacherSubjectsRepository, 'create').mockImplementation((data) => data as any);
      jest.spyOn(teacherSubjectsRepository, 'save').mockResolvedValue(mockNewSubjects as any);

      const result = await service.updateTeacherSubjects('teacher-1', { zoneIds });

      expect(result).toEqual(zoneIds);
      expect(teacherSubjectsRepository.delete).toHaveBeenCalledWith({ userId: 'teacher-1' });
      expect(teacherSubjectsRepository.save).toHaveBeenCalled();
    });
  });

  describe('getTeacherStats', () => {
    it('should return teacher stats', async () => {
      const result = await service.getTeacherStats('teacher-1');

      expect(result).toEqual({
        totalStudents: 0,
        pendingReviews: 0,
        reviewedToday: 0,
        avgGrade: 0,
      });
    });
  });

  describe('getStudentsList', () => {
    it('should return students list', async () => {
      const result = await service.getStudentsList('teacher-1');

      expect(result).toEqual([]);
    });
  });
});

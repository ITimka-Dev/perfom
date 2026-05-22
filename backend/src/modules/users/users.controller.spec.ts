import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { StudentFilterDto } from './dto/pagination.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUsersService = {
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    findById: jest.fn(),
    getTeacherSubjects: jest.fn(),
    updateTeacherSubjects: jest.fn(),
    getTeacherStats: jest.fn(),
    getStudentsList: jest.fn(),
    getSubmissionsByTeacher: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const mockProfile = { id: 'user-1', fullName: 'Test User' };
      mockUsersService.getProfile.mockResolvedValue(mockProfile);

      const result = await controller.getProfile('user-1');

      expect(result).toEqual(mockProfile);
      expect(service.getProfile).toHaveBeenCalledWith('user-1');
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const mockProfile = { id: 'user-1', fullName: 'Updated Name' };
      const updateDto = { fullName: 'Updated Name' };
      mockUsersService.updateProfile.mockResolvedValue(mockProfile);

      const result = await controller.updateProfile('user-1', updateDto);

      expect(result).toEqual(mockProfile);
      expect(service.updateProfile).toHaveBeenCalledWith('user-1', updateDto);
    });
  });

  describe('getTeacherSubjects', () => {
    it('should return teacher subjects', async () => {
      const mockSubjects = ['zone-1', 'zone-2'];
      mockUsersService.getTeacherSubjects.mockResolvedValue(mockSubjects);

      const result = await controller.getTeacherSubjects('teacher-1');

      expect(result).toEqual(mockSubjects);
      expect(service.getTeacherSubjects).toHaveBeenCalledWith('teacher-1');
    });
  });

  describe('getTeacherStats', () => {
    it('should return teacher statistics', async () => {
      const mockStats = {
        totalStudents: 10,
        pendingReviews: 5,
        reviewedToday: 2,
        avgGrade: 4.5,
      };
      mockUsersService.getTeacherStats.mockResolvedValue(mockStats);

      const result = await controller.getTeacherStats('teacher-1');

      expect(result).toEqual(mockStats);
      expect(service.getTeacherStats).toHaveBeenCalledWith('teacher-1');
    });
  });

  describe('getStudentsList', () => {
    it('should return students list', async () => {
      const mockStudents = [
        { id: 'student-1', name: 'Student 1', level: 5 },
        { id: 'student-2', name: 'Student 2', level: 3 },
      ];
      const filters: StudentFilterDto = {};
      mockUsersService.getStudentsList.mockResolvedValue(mockStudents);

      const result = await controller.getStudentsList('teacher-1', filters);

      expect(result).toEqual(mockStudents);
      expect(service.getStudentsList).toHaveBeenCalledWith('teacher-1', filters);
    });
  });
});

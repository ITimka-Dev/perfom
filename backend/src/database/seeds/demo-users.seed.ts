import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../modules/users/entities/user.entity';
import { Profile } from '../../modules/users/entities/profile.entity';
import { FarmZone } from '../../modules/zones/entities/farm-zone.entity';
import { FarmItem } from '../../modules/farm/entities/farm-item.entity';
import { UserInventory } from '../../modules/farm/entities/user-inventory.entity';
import { UserZoneProgress } from '../../modules/progress/entities/user-zone-progress.entity';
import { StudentGroup } from '../../modules/groups/entities/student-group.entity';
import { GroupMember } from '../../modules/groups/entities/group-member.entity';
import { TeacherSubject } from '../../modules/users/entities/teacher-subject.entity';

export const DEMO_USERS = [
  {
    email: 'admin@edufarm.demo',
    password: 'Admin123!',
    role: 'admin' as const,
    fullName: 'Demo Admin',
  },
  {
    email: 'teacher@edufarm.demo',
    password: 'Teacher123!',
    role: 'teacher' as const,
    fullName: 'Demo Teacher',
  },
  {
    email: 'student1@edufarm.demo',
    password: 'Student123!',
    role: 'student' as const,
    fullName: 'Demo Student 1',
    schoolName: 'EduFarm Demo School',
    grade: 7,
  },
  {
    email: 'student2@edufarm.demo',
    password: 'Student123!',
    role: 'student' as const,
    fullName: 'Demo Student 2',
    schoolName: 'EduFarm Demo School',
    grade: 7,
  },
  {
    email: 'student3@edufarm.demo',
    password: 'Student123!',
    role: 'student' as const,
    fullName: 'Demo Student 3',
    schoolName: 'EduFarm Demo School',
    grade: 8,
  },
];

const BIOLOGY_SEED_QUANTITY = 5;

async function upsertUser(
  usersRepository: Repository<User>,
  profilesRepository: Repository<Profile>,
  demoUser: (typeof DEMO_USERS)[number],
): Promise<User> {
  const hashedPassword = await bcrypt.hash(demoUser.password, 10);
  let user = await usersRepository.findOne({ where: { email: demoUser.email } });

  if (!user) {
    user = usersRepository.create({
      email: demoUser.email,
      password: hashedPassword,
      role: demoUser.role,
    });
  } else {
    user.password = hashedPassword;
    user.role = demoUser.role;
  }

  const savedUser = await usersRepository.save(user);

  let profile = await profilesRepository.findOne({ where: { id: savedUser.id } });
  if (!profile) {
    profile = profilesRepository.create({ id: savedUser.id });
  }

  profile.fullName = demoUser.fullName;
  profile.schoolName = demoUser.schoolName || null;
  profile.grade = demoUser.grade || null;
  await profilesRepository.save(profile);

  return savedUser;
}

async function ensureTeacherSubject(
  teacherSubjectsRepository: Repository<TeacherSubject>,
  teacherId: string,
  zoneId: string,
) {
  const existing = await teacherSubjectsRepository.findOne({
    where: { userId: teacherId, zoneId },
  });

  if (!existing) {
    await teacherSubjectsRepository.save(
      teacherSubjectsRepository.create({ userId: teacherId, zoneId }),
    );
  }
}

async function ensureStudentGroup(
  groupsRepository: Repository<StudentGroup>,
  membersRepository: Repository<GroupMember>,
  teacherId: string,
  grade: number,
  studentIds: string[],
) {
  const groupName = `${grade} класс`;
  let group = await groupsRepository.findOne({
    where: { name: groupName, teacherId },
  });

  if (!group) {
    group = await groupsRepository.save(
      groupsRepository.create({
        name: groupName,
        description: `Демо-группа ${grade} класса`,
        teacherId,
      }),
    );
  }

  for (const studentId of studentIds) {
    const existing = await membersRepository.findOne({
      where: { groupId: group.id, studentId },
    });

    if (!existing) {
      await membersRepository.save(
        membersRepository.create({ groupId: group.id, studentId }),
      );
    }
  }
}

async function ensureStudentProgressAndSeeds(
  progressRepository: Repository<UserZoneProgress>,
  inventoryRepository: Repository<UserInventory>,
  studentId: string,
  biologyZoneId: string,
  biologySeedItemId: string,
) {
  let progress = await progressRepository.findOne({
    where: { userId: studentId, zoneId: biologyZoneId },
  });

  if (!progress) {
    progress = progressRepository.create({
      userId: studentId,
      zoneId: biologyZoneId,
      level: 1,
      experience: 0,
      tasksCompleted: 0,
      isUnlocked: true,
    });
  } else {
    progress.level = 1;
    progress.experience = Math.max(progress.experience || 0, 0);
    progress.isUnlocked = true;
  }
  await progressRepository.save(progress);

  let inventory = await inventoryRepository.findOne({
    where: { userId: studentId, itemId: biologySeedItemId },
  });

  if (!inventory) {
    inventory = inventoryRepository.create({
      userId: studentId,
      itemId: biologySeedItemId,
      quantity: BIOLOGY_SEED_QUANTITY,
    });
  } else {
    inventory.quantity = Math.max(inventory.quantity || 0, BIOLOGY_SEED_QUANTITY);
  }
  await inventoryRepository.save(inventory);
}

export async function seedDemoUsers(dataSource: DataSource): Promise<void> {
  const usersRepository = dataSource.getRepository(User);
  const profilesRepository = dataSource.getRepository(Profile);
  const zonesRepository = dataSource.getRepository(FarmZone);
  const farmItemsRepository = dataSource.getRepository(FarmItem);
  const inventoryRepository = dataSource.getRepository(UserInventory);
  const progressRepository = dataSource.getRepository(UserZoneProgress);
  const groupsRepository = dataSource.getRepository(StudentGroup);
  const membersRepository = dataSource.getRepository(GroupMember);
  const teacherSubjectsRepository = dataSource.getRepository(TeacherSubject);

  const biologyZone = await zonesRepository.findOne({
    where: { zoneType: 'biology' },
  });
  if (!biologyZone) {
    throw new Error('Biology zone not found. Run zones seed first.');
  }

  const biologySeeds = await farmItemsRepository.find({
    where: { category: 'seed', zoneId: biologyZone.id },
  });
  const firstBiologySeed = biologySeeds[0];
  if (!firstBiologySeed) {
    throw new Error('Biology seed item not found. Run farm items seed first.');
  }

  const savedUsers = new Map<string, User>();
  for (const demoUser of DEMO_USERS) {
    savedUsers.set(
      demoUser.email,
      await upsertUser(usersRepository, profilesRepository, demoUser),
    );
  }

  const teacher = savedUsers.get('teacher@edufarm.demo');
  if (!teacher) {
    throw new Error('Demo teacher was not created.');
  }

  await ensureTeacherSubject(
    teacherSubjectsRepository,
    teacher.id,
    biologyZone.id,
  );

  const students = DEMO_USERS.filter((user) => user.role === 'student');
  for (const student of students) {
    const savedStudent = savedUsers.get(student.email);
    if (!savedStudent) {
      continue;
    }

    await ensureStudentProgressAndSeeds(
      progressRepository,
      inventoryRepository,
      savedStudent.id,
      biologyZone.id,
      firstBiologySeed.id,
    );
  }

  const studentIdsByGrade = students.reduce<Record<number, string[]>>((acc, student) => {
    const savedStudent = savedUsers.get(student.email);
    if (savedStudent && student.grade) {
      acc[student.grade] = [...(acc[student.grade] || []), savedStudent.id];
    }
    return acc;
  }, {});

  for (const [grade, studentIds] of Object.entries(studentIdsByGrade)) {
    await ensureStudentGroup(
      groupsRepository,
      membersRepository,
      teacher.id,
      Number(grade),
      studentIds,
    );
  }

  console.log('\nDemo users:');
  for (const demoUser of DEMO_USERS) {
    console.log(`   - ${demoUser.role}: ${demoUser.email} / ${demoUser.password}`);
  }
}

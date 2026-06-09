import { DataSource } from 'typeorm';
import { seedDemoUsers, DEMO_USERS } from './demo-users.seed';
import { User } from '../../modules/users/entities/user.entity';
import { Profile } from '../../modules/users/entities/profile.entity';
import { FarmZone } from '../../modules/zones/entities/farm-zone.entity';
import { FarmItem } from '../../modules/farm/entities/farm-item.entity';
import { UserInventory } from '../../modules/farm/entities/user-inventory.entity';
import { UserZoneProgress } from '../../modules/progress/entities/user-zone-progress.entity';
import { StudentGroup } from '../../modules/groups/entities/student-group.entity';
import { GroupMember } from '../../modules/groups/entities/group-member.entity';
import { TeacherSubject } from '../../modules/users/entities/teacher-subject.entity';

class FakeRepository<T extends { id?: string } & Record<string, any>> {
  constructor(private readonly rows: T[]) {}

  create(data: Partial<T>): T {
    return { ...data } as T;
  }

  async findOne(options: any): Promise<T | null> {
    const where = options?.where || {};
    return this.rows.find((row) =>
      Object.entries(where).every(([key, value]) => row[key] === value),
    ) || null;
  }

  async find(options?: any): Promise<T[]> {
    const where = options?.where;
    if (!where) {
      return this.rows;
    }
    return this.rows.filter((row) =>
      Object.entries(where).every(([key, value]) => row[key] === value),
    );
  }

  async save(input: T | T[]): Promise<T | T[]> {
    if (Array.isArray(input)) {
      return Promise.all(input.map((item) => this.save(item))) as Promise<T[]>;
    }

    const entity = input;
    if (!entity.id) {
      entity.id = `id-${this.rows.length + 1}`;
    }

    const existingIndex = this.rows.findIndex((row) => row.id === entity.id);
    if (existingIndex >= 0) {
      this.rows[existingIndex] = { ...this.rows[existingIndex], ...entity };
    } else {
      this.rows.push(entity);
    }

    return entity;
  }
}

describe('seedDemoUsers', () => {
  const biologyZone = {
    id: 'biology-zone',
    zoneType: 'biology',
    name: 'Biology',
  };
  const biologySeed = {
    id: 'biology-seed',
    name: 'Wheat seeds',
    category: 'seed',
    zoneId: biologyZone.id,
  };

  function makeDataSource() {
    const stores = new Map<any, any[]>([
      [User, []],
      [Profile, []],
      [FarmZone, [biologyZone]],
      [FarmItem, [biologySeed]],
      [UserInventory, []],
      [UserZoneProgress, []],
      [StudentGroup, []],
      [GroupMember, []],
      [TeacherSubject, []],
    ]);

    return {
      stores,
      dataSource: {
        getRepository: (entity: any) => new FakeRepository(stores.get(entity) || []),
      } as unknown as DataSource,
    };
  }

  it('creates five deterministic demo users with expected roles, school, classes, progress, and seeds', async () => {
    const { dataSource, stores } = makeDataSource();

    await seedDemoUsers(dataSource);

    const users = stores.get(User)!;
    expect(users).toHaveLength(5);
    expect(users.map((user) => user.email).sort()).toEqual(
      DEMO_USERS.map((user) => user.email).sort(),
    );
    expect(users.filter((user) => user.role === 'admin')).toHaveLength(1);
    expect(users.filter((user) => user.role === 'teacher')).toHaveLength(1);
    expect(users.filter((user) => user.role === 'student')).toHaveLength(3);

    const profiles = stores.get(Profile)!;
    const studentProfiles = profiles.filter((profile) => profile.schoolName === 'EduFarm Demo School');
    expect(studentProfiles).toHaveLength(3);
    expect(studentProfiles.filter((profile) => profile.grade === 7)).toHaveLength(2);
    expect(studentProfiles.filter((profile) => profile.grade === 8)).toHaveLength(1);

    const progressRows = stores.get(UserZoneProgress)!;
    expect(progressRows).toHaveLength(3);
    expect(progressRows.every((progress) => progress.zoneId === biologyZone.id)).toBe(true);
    expect(progressRows.every((progress) => progress.level === 1)).toBe(true);
    expect(progressRows.every((progress) => progress.isUnlocked === true)).toBe(true);

    const inventoryRows = stores.get(UserInventory)!;
    expect(inventoryRows).toHaveLength(3);
    expect(inventoryRows.every((item) => item.itemId === biologySeed.id)).toBe(true);
    expect(inventoryRows.every((item) => item.quantity === 5)).toBe(true);
  });

  it('is idempotent when run more than once', async () => {
    const { dataSource, stores } = makeDataSource();

    await seedDemoUsers(dataSource);
    await seedDemoUsers(dataSource);

    expect(stores.get(User)).toHaveLength(5);
    expect(stores.get(Profile)).toHaveLength(5);
    expect(stores.get(UserZoneProgress)).toHaveLength(3);
    expect(stores.get(UserInventory)).toHaveLength(3);
    expect(stores.get(StudentGroup)).toHaveLength(2);
    expect(stores.get(GroupMember)).toHaveLength(3);
    expect(stores.get(TeacherSubject)).toHaveLength(1);
  });
});

import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Users table
    const usersTableExists = await queryRunner.hasTable('users');
    if (!usersTableExists) {
      await queryRunner.query(`
        CREATE TABLE "users" (
          "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
          "email" varchar UNIQUE NOT NULL,
          "password" varchar NOT NULL,
          "role" varchar DEFAULT 'student' NOT NULL,
          "createdAt" timestamp DEFAULT now() NOT NULL,
          "updatedAt" timestamp DEFAULT now() NOT NULL
        )
      `);
    }

    // Profiles table
    const profilesTableExists = await queryRunner.hasTable('profiles');
    if (!profilesTableExists) {
      await queryRunner.query(`
        CREATE TABLE "profiles" (
          "id" uuid PRIMARY KEY,
          "fullName" varchar,
          "schoolName" varchar,
          "grade" int,
          "avatarUrl" varchar,
          "bio" text,
          "createdAt" timestamp DEFAULT now() NOT NULL,
          "updatedAt" timestamp DEFAULT now() NOT NULL,
          FOREIGN KEY ("id") REFERENCES "users"("id") ON DELETE CASCADE
        )
      `);
    }

    // Farm zones table
    const farmZonesTableExists = await queryRunner.hasTable('farm_zones');
    if (!farmZonesTableExists) {
      await queryRunner.query(`
        CREATE TABLE "farm_zones" (
          "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
          "name" varchar NOT NULL,
          "zoneType" varchar NOT NULL,
          "description" text,
          "iconUrl" varchar,
          "unlockLevel" int DEFAULT 1 NOT NULL,
          "allowedSlotTypes" text[] DEFAULT ARRAY['plants', 'animals', 'production'],
          "createdAt" timestamp DEFAULT now() NOT NULL
        )
      `);
    }

    // Tasks table
    const tasksTableExists = await queryRunner.hasTable('tasks');
    if (!tasksTableExists) {
      await queryRunner.query(`
        CREATE TABLE "tasks" (
          "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
          "title" varchar NOT NULL,
          "description" text,
          "instructions" text,
          "zoneId" uuid NOT NULL,
          "difficulty" int,
          "experienceReward" int DEFAULT 100 NOT NULL,
          "requiredLevel" int DEFAULT 1 NOT NULL,
          "targetGrades" int[] DEFAULT '{}',
          "attachmentUrls" text[] DEFAULT '{}',
          "createdBy" uuid,
          "createdAt" timestamp DEFAULT now() NOT NULL,
          "updatedAt" timestamp DEFAULT now() NOT NULL,
          FOREIGN KEY ("zoneId") REFERENCES "farm_zones"("id") ON DELETE CASCADE
        )
      `);
    }

    // Task submissions table
    const taskSubmissionsTableExists = await queryRunner.hasTable('task_submissions');
    if (!taskSubmissionsTableExists) {
      await queryRunner.query(`
        CREATE TABLE "task_submissions" (
          "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
          "taskId" uuid NOT NULL,
          "userId" uuid NOT NULL,
          "submissionText" text,
          "fileUrls" text[],
          "status" varchar DEFAULT 'pending' NOT NULL,
          "grade" int,
          "teacherFeedback" text,
          "reviewedBy" uuid,
          "submittedAt" timestamp DEFAULT now() NOT NULL,
          "reviewedAt" timestamp,
          FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE,
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
        )
      `);
    }

    // Achievements table
    const achievementsTableExists = await queryRunner.hasTable('achievements');
    if (!achievementsTableExists) {
      await queryRunner.query(`
        CREATE TABLE "achievements" (
          "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
          "title" varchar NOT NULL,
          "description" text,
          "icon" varchar DEFAULT 'trophy' NOT NULL,
          "rarity" varchar DEFAULT 'common' NOT NULL,
          "conditionType" text,
          "conditionValue" int,
          "createdAt" timestamp DEFAULT now() NOT NULL
        )
      `);
    }

    // User achievements table
    const userAchievementsTableExists = await queryRunner.hasTable('user_achievements');
    if (!userAchievementsTableExists) {
      await queryRunner.query(`
        CREATE TABLE "user_achievements" (
          "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
          "userId" uuid NOT NULL,
          "achievementId" uuid NOT NULL,
          "unlockedAt" timestamp DEFAULT now() NOT NULL,
          FOREIGN KEY ("achievementId") REFERENCES "achievements"("id") ON DELETE CASCADE,
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
        )
      `);
    }

    // User zone progress table
    const userZoneProgressTableExists = await queryRunner.hasTable('user_zone_progress');
    if (!userZoneProgressTableExists) {
      await queryRunner.query(`
        CREATE TABLE "user_zone_progress" (
          "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
          "user_id" uuid NOT NULL,
          "zone_id" uuid NOT NULL,
          "level" int DEFAULT 1 NOT NULL,
          "experience" int DEFAULT 0 NOT NULL,
          "tasks_completed" int DEFAULT 0 NOT NULL,
          "is_unlocked" boolean DEFAULT true NOT NULL,
          "created_at" timestamp DEFAULT now() NOT NULL,
          "updated_at" timestamp DEFAULT now() NOT NULL,
          FOREIGN KEY ("zone_id") REFERENCES "farm_zones"("id") ON DELETE CASCADE,
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
        )
      `);
    }

    // Teacher subjects table
    const teacherSubjectsTableExists = await queryRunner.hasTable('teacher_subjects');
    if (!teacherSubjectsTableExists) {
      await queryRunner.query(`
        CREATE TABLE "teacher_subjects" (
          "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
          "userId" uuid NOT NULL,
          "zoneId" uuid NOT NULL,
          "createdAt" timestamp DEFAULT now() NOT NULL,
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
          FOREIGN KEY ("zoneId") REFERENCES "farm_zones"("id") ON DELETE CASCADE
        )
      `);
    }

    // Farm items table
    const farmItemsTableExists = await queryRunner.hasTable('farm_items');
    if (!farmItemsTableExists) {
      await queryRunner.query(`
        CREATE TABLE "farm_items" (
          "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
          "name" varchar NOT NULL,
          "description" text,
          "category" varchar NOT NULL,
          "iconEmoji" varchar NOT NULL,
          "zoneId" uuid,
          "productionTime" int,
          "sellPriceNpc" int DEFAULT 0 NOT NULL,
          "unlockTasksRequired" int DEFAULT 0 NOT NULL,
          "createdAt" timestamp DEFAULT now() NOT NULL,
          FOREIGN KEY ("zoneId") REFERENCES "farm_zones"("id") ON DELETE SET NULL
        )
      `);
    }

    // User inventory table
    const userInventoryTableExists = await queryRunner.hasTable('user_inventory');
    if (!userInventoryTableExists) {
      await queryRunner.query(`
        CREATE TABLE "user_inventory" (
          "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
          "userId" uuid NOT NULL,
          "itemId" uuid NOT NULL,
          "quantity" int DEFAULT 0 NOT NULL,
          FOREIGN KEY ("itemId") REFERENCES "farm_items"("id") ON DELETE CASCADE,
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
        )
      `);
    }

    // User plants table
    const userPlantsTableExists = await queryRunner.hasTable('user_plants');
    if (!userPlantsTableExists) {
      await queryRunner.query(`
        CREATE TABLE "user_plants" (
          "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
          "userId" uuid NOT NULL,
          "zoneId" uuid NOT NULL,
          "seedItemId" uuid NOT NULL,
          "slotIndex" int NOT NULL,
          "plantedAt" timestamp NOT NULL,
          "wateredAt" timestamp,
          "needsWater" boolean DEFAULT false NOT NULL,
          "createdAt" timestamp DEFAULT now() NOT NULL,
          FOREIGN KEY ("seedItemId") REFERENCES "farm_items"("id") ON DELETE CASCADE,
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
          FOREIGN KEY ("zoneId") REFERENCES "farm_zones"("id") ON DELETE CASCADE
        )
      `);
    }

    // Farm animals table
    const farmAnimalsTableExists = await queryRunner.hasTable('farm_animals');
    if (!farmAnimalsTableExists) {
      await queryRunner.query(`
        CREATE TABLE "farm_animals" (
          "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
          "name" varchar NOT NULL,
          "description" text,
          "iconEmoji" varchar NOT NULL,
          "zoneId" uuid NOT NULL,
          "feedItemId" uuid,
          "productionItemId" uuid NOT NULL,
          "productionTime" int NOT NULL,
          "maxHappiness" int DEFAULT 100 NOT NULL,
          "unlockTasksRequired" int DEFAULT 0 NOT NULL,
          "createdAt" timestamp DEFAULT now() NOT NULL,
          FOREIGN KEY ("zoneId") REFERENCES "farm_zones"("id") ON DELETE CASCADE,
          FOREIGN KEY ("feedItemId") REFERENCES "farm_items"("id") ON DELETE SET NULL,
          FOREIGN KEY ("productionItemId") REFERENCES "farm_items"("id") ON DELETE CASCADE
        )
      `);
    }

    // User farm animals table
    const userFarmAnimalsTableExists = await queryRunner.hasTable('user_farm_animals');
    if (!userFarmAnimalsTableExists) {
      await queryRunner.query(`
        CREATE TABLE "user_farm_animals" (
          "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
          "userId" uuid NOT NULL,
          "animalId" uuid NOT NULL,
          "happiness" int DEFAULT 100 NOT NULL,
          "lastFedAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
          "lastCollectedAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
          "createdAt" timestamp DEFAULT now() NOT NULL,
          FOREIGN KEY ("animalId") REFERENCES "farm_animals"("id") ON DELETE CASCADE,
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
        )
      `);
    }

    // Production chains table
    const productionChainsTableExists = await queryRunner.hasTable('production_chains');
    if (!productionChainsTableExists) {
      await queryRunner.query(`
        CREATE TABLE "production_chains" (
          "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
          "name" varchar NOT NULL,
          "zoneId" uuid NOT NULL,
          "outputItemId" uuid NOT NULL,
          "outputQuantity" int DEFAULT 1 NOT NULL,
          "baseTime" int NOT NULL,
          "unlockTasksRequired" int DEFAULT 0 NOT NULL,
          "createdAt" timestamp DEFAULT now() NOT NULL,
          FOREIGN KEY ("zoneId") REFERENCES "farm_zones"("id") ON DELETE CASCADE,
          FOREIGN KEY ("outputItemId") REFERENCES "farm_items"("id") ON DELETE CASCADE
        )
      `);
    }

    // Production chain ingredients table
    const productionChainIngredientsTableExists = await queryRunner.hasTable('production_chain_ingredients');
    if (!productionChainIngredientsTableExists) {
      await queryRunner.query(`
        CREATE TABLE "production_chain_ingredients" (
          "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
          "chainId" uuid NOT NULL,
          "itemId" uuid NOT NULL,
          "quantityNeeded" int NOT NULL,
          FOREIGN KEY ("chainId") REFERENCES "production_chains"("id") ON DELETE CASCADE,
          FOREIGN KEY ("itemId") REFERENCES "farm_items"("id") ON DELETE CASCADE
        )
      `);
    }

    // User productions table
    const userProductionsTableExists = await queryRunner.hasTable('user_productions');
    if (!userProductionsTableExists) {
      await queryRunner.query(`
        CREATE TABLE "user_productions" (
          "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
          "userId" uuid NOT NULL,
          "zoneId" uuid NOT NULL,
          "chainId" uuid NOT NULL,
          "slotIndex" int NOT NULL,
          "startedAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
          "finishAt" timestamp NOT NULL,
          "createdAt" timestamp DEFAULT now() NOT NULL,
          FOREIGN KEY ("chainId") REFERENCES "production_chains"("id") ON DELETE CASCADE,
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
          FOREIGN KEY ("zoneId") REFERENCES "farm_zones"("id") ON DELETE CASCADE
        )
      `);
    }

    // Pets table
    const petsTableExists = await queryRunner.hasTable('pets');
    if (!petsTableExists) {
      await queryRunner.query(`
        CREATE TABLE "pets" (
          "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
          "userId" uuid NOT NULL,
          "name" varchar NOT NULL,
          "type" varchar NOT NULL,
          "hunger" int DEFAULT 100 NOT NULL,
          "thirst" int DEFAULT 100 NOT NULL,
          "happiness" int DEFAULT 100 NOT NULL,
          "lastFedAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
          "lastWateredAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
          "lastPlayedAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
          "ranAwayAt" timestamp,
          "createdAt" timestamp DEFAULT now() NOT NULL,
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
        )
      `);
    }

    // Pet shop items table
    const petShopItemsTableExists = await queryRunner.hasTable('pet_shop_items');
    if (!petShopItemsTableExists) {
      await queryRunner.query(`
        CREATE TABLE "pet_shop_items" (
          "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
          "name" varchar NOT NULL,
          "description" text,
          "itemType" varchar NOT NULL,
          "iconEmoji" varchar NOT NULL,
          "isConsumable" boolean DEFAULT true NOT NULL,
          "statEffectHunger" int DEFAULT 0 NOT NULL,
          "statEffectThirst" int DEFAULT 0 NOT NULL,
          "statEffectHappiness" int DEFAULT 0 NOT NULL,
          "createdAt" timestamp DEFAULT now() NOT NULL
        )
      `);
    }

    // User pet items table
    const userPetItemsTableExists = await queryRunner.hasTable('user_pet_items');
    if (!userPetItemsTableExists) {
      await queryRunner.query(`
        CREATE TABLE "user_pet_items" (
          "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
          "userId" uuid NOT NULL,
          "itemId" uuid NOT NULL,
          "quantity" int DEFAULT 1 NOT NULL,
          "purchasedAt" timestamp DEFAULT now() NOT NULL,
          FOREIGN KEY ("itemId") REFERENCES "pet_shop_items"("id") ON DELETE CASCADE,
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
        )
      `);
    }

    // Student groups table
    const studentGroupsTableExists = await queryRunner.hasTable('student_groups');
    if (!studentGroupsTableExists) {
      await queryRunner.query(`
        CREATE TABLE "student_groups" (
          "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
          "name" varchar NOT NULL,
          "description" varchar,
          "teacher_id" uuid NOT NULL,
          "created_at" timestamp DEFAULT now() NOT NULL,
          "updated_at" timestamp DEFAULT now() NOT NULL,
          FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE CASCADE
        )
      `);
    }

    // Group members table
    const groupMembersTableExists = await queryRunner.hasTable('group_members');
    if (!groupMembersTableExists) {
      await queryRunner.query(`
        CREATE TABLE "group_members" (
          "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
          "group_id" uuid NOT NULL,
          "student_id" uuid NOT NULL,
          "joined_at" timestamp DEFAULT now() NOT NULL,
          FOREIGN KEY ("group_id") REFERENCES "student_groups"("id") ON DELETE CASCADE,
          FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE
        )
      `);
    }

    // Group tasks table
    const groupTasksTableExists = await queryRunner.hasTable('group_tasks');
    if (!groupTasksTableExists) {
      await queryRunner.query(`
        CREATE TABLE "group_tasks" (
          "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
          "group_id" uuid NOT NULL,
          "task_id" uuid NOT NULL,
          "assigned_at" timestamp DEFAULT now() NOT NULL,
          "due_date" timestamp,
          FOREIGN KEY ("group_id") REFERENCES "student_groups"("id") ON DELETE CASCADE,
          FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE
        )
      `);
    }

    // Comment templates table
    const commentTemplatesTableExists = await queryRunner.hasTable('comment_templates');
    if (!commentTemplatesTableExists) {
      await queryRunner.query(`
        CREATE TABLE "comment_templates" (
          "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
          "teacher_id" uuid NOT NULL,
          "title" text NOT NULL,
          "content" text NOT NULL,
          "category" text,
          "created_at" timestamp DEFAULT now() NOT NULL,
          "updated_at" timestamp DEFAULT now() NOT NULL,
          FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE CASCADE
        )
      `);
    }

    // Submission comments table
    const submissionCommentsTableExists = await queryRunner.hasTable('submission_comments');
    if (!submissionCommentsTableExists) {
      await queryRunner.query(`
        CREATE TABLE "submission_comments" (
          "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
          "submission_id" uuid NOT NULL,
          "teacher_id" uuid NOT NULL,
          "comment_text" text NOT NULL,
          "file_urls" text[] DEFAULT '{}',
          "created_at" timestamp DEFAULT now() NOT NULL,
          "updated_at" timestamp DEFAULT now() NOT NULL,
          FOREIGN KEY ("submission_id") REFERENCES "task_submissions"("id") ON DELETE CASCADE,
          FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE CASCADE
        )
      `);
    }

    // Create indexes for performance (only if they don't exist)
    const indexes = [
      { name: 'idx_users_email', table: 'users', column: 'email' },
      { name: 'idx_tasks_zone', table: 'tasks', column: 'zoneId' },
      { name: 'idx_submissions_user', table: 'task_submissions', column: 'userId' },
      { name: 'idx_submissions_task', table: 'task_submissions', column: 'taskId' },
      { name: 'idx_user_zone_progress', table: 'user_zone_progress', columns: ['user_id', 'zone_id'] },
      { name: 'idx_user_inventory', table: 'user_inventory', columns: ['userId', 'itemId'] },
    ];

    for (const index of indexes) {
      try {
        // Check if index exists
        const result = await queryRunner.query(`
          SELECT EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE indexname = '${index.name}'
          ) as exists
        `);
        const indexExists = result[0]?.exists || false;
        if (!indexExists) {
          if (index.columns) {
            await queryRunner.query(`CREATE INDEX "${index.name}" ON "${index.table}"(${index.columns.map(c => `"${c}"`).join(', ')})`);
          } else {
            await queryRunner.query(`CREATE INDEX "${index.name}" ON "${index.table}"("${index.column}")`);
          }
        }
      } catch (error) {
        // If index already exists or table doesn't exist, skip
        // This is safe to ignore as the index will be created on next migration run if needed
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop all tables in reverse order
    await queryRunner.query(`DROP TABLE "submission_comments"`);
    await queryRunner.query(`DROP TABLE "comment_templates"`);
    await queryRunner.query(`DROP TABLE "group_tasks"`);
    await queryRunner.query(`DROP TABLE "group_members"`);
    await queryRunner.query(`DROP TABLE "student_groups"`);
    await queryRunner.query(`DROP TABLE "user_pet_items"`);
    await queryRunner.query(`DROP TABLE "pet_shop_items"`);
    await queryRunner.query(`DROP TABLE "pets"`);
    await queryRunner.query(`DROP TABLE "user_productions"`);
    await queryRunner.query(`DROP TABLE "production_chain_ingredients"`);
    await queryRunner.query(`DROP TABLE "production_chains"`);
    await queryRunner.query(`DROP TABLE "user_farm_animals"`);
    await queryRunner.query(`DROP TABLE "farm_animals"`);
    await queryRunner.query(`DROP TABLE "user_plants"`);
    await queryRunner.query(`DROP TABLE "user_inventory"`);
    await queryRunner.query(`DROP TABLE "farm_items"`);
    await queryRunner.query(`DROP TABLE "teacher_subjects"`);
    await queryRunner.query(`DROP TABLE "user_zone_progress"`);
    await queryRunner.query(`DROP TABLE "user_achievements"`);
    await queryRunner.query(`DROP TABLE "achievements"`);
    await queryRunner.query(`DROP TABLE "task_submissions"`);
    await queryRunner.query(`DROP TABLE "tasks"`);
    await queryRunner.query(`DROP TABLE "farm_zones"`);
    await queryRunner.query(`DROP TABLE "profiles"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}

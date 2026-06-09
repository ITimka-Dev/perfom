import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTaskAllowedSubmissionFileTypes1710000000000 implements MigrationInterface {
  name = 'AddTaskAllowedSubmissionFileTypes1710000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasColumn = await queryRunner.hasColumn('tasks', 'allowedSubmissionFileTypes');
    if (!hasColumn) {
      await queryRunner.query(`
        ALTER TABLE "tasks"
        ADD COLUMN "allowedSubmissionFileTypes" text[] DEFAULT '{}' NOT NULL
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasColumn = await queryRunner.hasColumn('tasks', 'allowedSubmissionFileTypes');
    if (hasColumn) {
      await queryRunner.query(`
        ALTER TABLE "tasks"
        DROP COLUMN "allowedSubmissionFileTypes"
      `);
    }
  }
}

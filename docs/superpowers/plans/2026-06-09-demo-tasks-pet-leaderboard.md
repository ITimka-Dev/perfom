# Demo Tasks Pet Leaderboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Seed five demo users and complete the assignment, pet stat, and leaderboard flows.

**Architecture:** Keep the existing NestJS modules and React pages. Extend current task entities with allowed submission file types, make seed data idempotent, and test backend behavior before implementation.

**Tech Stack:** NestJS, TypeORM, Jest, React, Vite, shadcn/ui.

---

### Task 1: Demo Seed Users

**Files:**
- Create: `backend/src/database/seeds/demo-users.seed.ts`
- Modify: `backend/src/database/seeds/index.ts`
- Test: `backend/src/database/seeds/demo-users.seed.spec.ts`

- [ ] Write a failing test proving five deterministic demo accounts are created, students share one school, two students share one grade, one student has a different grade, and each student receives biology level 1 progress plus seed inventory.
- [ ] Implement an idempotent `seedDemoUsers(dataSource)` helper using bcrypt-hashed known passwords.
- [ ] Print demo login/password pairs after seeding.

### Task 2: Assignment Flow

**Files:**
- Modify: `backend/src/modules/tasks/entities/task.entity.ts`
- Modify: `backend/src/modules/tasks/dto/create-task.dto.ts`
- Modify: `backend/src/modules/tasks/dto/update-task.dto.ts`
- Modify: `backend/src/modules/tasks/dto/create-submission.dto.ts`
- Modify: `backend/src/modules/tasks/dto/grade-submission.dto.ts`
- Modify: `backend/src/modules/tasks/tasks.service.ts`
- Create: `backend/src/migrations/1710000000000-AddTaskAllowedSubmissionFileTypes.ts`
- Modify: `src/pages/CreateTask.tsx`
- Modify: `src/pages/Tasks.tsx`
- Modify: `src/pages/ReviewSubmission.tsx`
- Modify: `src/lib/api-client.ts`
- Test: `backend/src/modules/tasks/tasks.service.spec.ts`

- [ ] Write failing tests for allowed file extension validation and `feedback`/`teacherFeedback` compatibility.
- [ ] Add `allowedSubmissionFileTypes` to tasks with defaults.
- [ ] Validate submitted attachment URL extensions against teacher-selected formats.
- [ ] Add a student submission dialog on the tasks page.
- [ ] Add teacher controls for allowed file formats during task creation.
- [ ] Keep XP award behavior on accepted submissions with grade >= 60.

### Task 3: Pet Stat Changes

**Files:**
- Modify: `backend/src/modules/pet/pet.service.ts`
- Test: `backend/src/modules/pet/pet.service.spec.ts`

- [ ] Write failing tests proving feed, water, and play increase exactly one stat by a random integer from 3 to 7 and cap at 100.
- [ ] Replace fixed increments with a small helper.
- [ ] Keep existing hourly decay behavior.

### Task 4: Leaderboard Filters

**Files:**
- Modify: `backend/src/modules/progress/progress.service.ts`
- Modify: `src/pages/Leaderboard.tsx`
- Test: `backend/src/modules/progress/progress.service.spec.ts`

- [ ] Write failing tests for `zoneId` filtering and `sortBy` ordering.
- [ ] Normalize raw numeric values before sorting to avoid string ordering bugs.
- [ ] Use `progressApi.getLeaderboard` from the frontend page.

### Task 5: Verification

**Files:**
- All touched files.

- [ ] Run focused backend tests.
- [ ] Run backend build.
- [ ] Run frontend build.
- [ ] Report demo credentials and verification output.

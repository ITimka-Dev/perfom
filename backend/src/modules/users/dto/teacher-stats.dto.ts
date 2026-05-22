export interface TeacherStatsDto {
  totalStudents: number;
  pendingReviews: number;
  reviewedToday: number;
  avgGrade: number;
}

export interface StudentStatsDto {
  id: string;
  name: string;
  level: number;
  tasksCompleted: number;
  avgGrade: number;
  lastActive: string;
}

export interface SubmissionsByTeacherDto {
  id: string;
  studentName: string;
  taskTitle: string;
  submittedAt: string;
  status: string;
  grade: number | null;
}

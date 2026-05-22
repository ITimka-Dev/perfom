export class AdminStatsDto {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalTasks: number;
  totalSubmissions: number;
  pendingSubmissions: number;
  avgGrade: number;
  activeToday: number;
  activeThisWeek: number;
  recentActivity: Array<{
    date: string;
    submissions: number;
    reviews: number;
  }>;
}

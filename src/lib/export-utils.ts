export const exportToCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Handle values that might contain commas
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value ?? '';
      }).join(',')
    )
  ].join('\n');

  // Create blob and download
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const formatStudentDataForExport = (students: any[]) => {
  return students.map(student => ({
    'Имя': student.name,
    'Email': student.email,
    'Уровень': student.level,
    'Заданий выполнено': student.tasksCompleted,
    'Средний балл': student.avgGrade,
    'Последняя активность': student.lastActive,
  }));
};

export const formatSubmissionsForExport = (submissions: any[]) => {
  return submissions.map(submission => ({
    'Задание': submission.taskTitle,
    'Ученик': submission.studentName,
    'Дата сдачи': submission.submittedAt,
    'Статус': submission.status === 'pending' ? 'На проверке' : 
              submission.status === 'reviewed' ? 'Проверено' : 'Отклонено',
    'Оценка': submission.grade ?? '—',
  }));
};

export const formatStatsForExport = (stats: any, students: any[], submissions: any[]) => {
  const generalStats = [
    { 'Показатель': 'Всего учеников', 'Значение': stats.totalStudents },
    { 'Показатель': 'На проверке', 'Значение': stats.pendingReviews },
    { 'Показатель': 'Проверено сегодня', 'Значение': stats.reviewedToday },
    { 'Показатель': 'Средний балл', 'Значение': stats.avgGrade },
    { 'Показатель': '', 'Значение': '' },
    { 'Показатель': 'УЧЕНИКИ', 'Значение': '' },
  ];

  const studentRows = students.map(student => ({
    'Показатель': student.name,
    'Значение': `Уровень: ${student.level}, Задания: ${student.tasksCompleted}, Балл: ${student.avgGrade}`,
  }));

  return [...generalStats, ...studentRows];
};

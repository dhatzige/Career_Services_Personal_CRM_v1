import { Student, ConsultationType } from '../types/student';

export interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  consultationsThisWeek: number;
  consultationsThisMonth: number;
  pendingFollowUps: number;
  totalNoShows: number;
  studentsWithNoShows: number;
  highNoShowStudents: Student[]; // Students with 3+ no-shows
  programDistribution: { name: string; value: number; color: string }[];
  yearDistribution: { name: string; value: number; color: string }[];
  consultationTypes: { name: string; value: number; color: string }[];
  weeklyActivity: { name: string; consultations: number; notes: number }[];
}

export const calculateDashboardStats = (students: Student[]): DashboardStats => {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Basic counts
  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.status === 'Active').length;

  // Consultations this week/month
  const consultationsThisWeek = students.reduce((count, student) => {
    return count + student.consultations.filter(c => 
      new Date(c.date) >= oneWeekAgo
    ).length;
  }, 0);

  const consultationsThisMonth = students.reduce((count, student) => {
    return count + student.consultations.filter(c => 
      new Date(c.date) >= oneMonthAgo
    ).length;
  }, 0);

  // Pending follow-ups
  const pendingFollowUps = students.reduce((count, student) => {
    return count + student.followUpReminders.filter(r => !r.completed).length;
  }, 0);

  // No-show statistics
  const totalNoShows = students.reduce((count, student) => {
    return count + (student.noShowCount || 0);
  }, 0);

  const studentsWithNoShows = students.filter(s => (s.noShowCount || 0) > 0).length;

  const highNoShowStudents = students
    .filter(s => (s.noShowCount || 0) >= 3)
    .sort((a, b) => (b.noShowCount || 0) - (a.noShowCount || 0));

  // Program distribution
  const programCounts: Record<string, number> = {};
  students.forEach(student => {
    programCounts[student.specificProgram] = (programCounts[student.specificProgram] || 0) + 1;
  });

  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];

  const programDistribution = Object.entries(programCounts)
    .map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length]
    }))
    .sort((a, b) => b.value - a.value);

  // Year distribution
  const yearCounts: Record<string, number> = {};
  students.forEach(student => {
    yearCounts[student.yearOfStudy] = (yearCounts[student.yearOfStudy] || 0) + 1;
  });

  const yearDistribution = Object.entries(yearCounts)
    .map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length]
    }));

  // Consultation types
  const consultationTypeCounts: Record<string, number> = {};
  students.forEach(student => {
    student.consultations.forEach(consultation => {
      consultationTypeCounts[consultation.type] = (consultationTypeCounts[consultation.type] || 0) + 1;
    });
  });

  const consultationTypes = Object.entries(consultationTypeCounts)
    .map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length]
    }))
    .sort((a, b) => b.value - a.value);

  // Weekly activity (last 7 days)
  const weeklyActivity = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    
    const consultations = students.reduce((count, student) => {
      return count + student.consultations.filter(c => {
        const consultationDate = new Date(c.date);
        return consultationDate.toDateString() === date.toDateString();
      }).length;
    }, 0);

    const notes = students.reduce((count, student) => {
      return count + student.notes.filter(n => {
        const noteDate = new Date(n.dateCreated);
        return noteDate.toDateString() === date.toDateString();
      }).length;
    }, 0);

    weeklyActivity.push({
      name: dayName,
      consultations,
      notes
    });
  }

  return {
    totalStudents,
    activeStudents,
    consultationsThisWeek,
    consultationsThisMonth,
    pendingFollowUps,
    totalNoShows,
    studentsWithNoShows,
    highNoShowStudents,
    programDistribution,
    yearDistribution,
    consultationTypes,
    weeklyActivity
  };
};

export const generateMonthlyReport = (students: Student[], month: number, year: number) => {
  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0);
  
  const monthlyStudents = students.filter(student => {
    const dateAdded = new Date(student.dateAdded);
    return dateAdded >= startOfMonth && dateAdded <= endOfMonth;
  });
  
  const monthlyConsultations = students.flatMap(s => s.consultations).filter(consultation => {
    const consultDate = new Date(consultation.date);
    return consultDate >= startOfMonth && consultDate <= endOfMonth;
  });
  
  // Calculate active students (those with consultations in the last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const activeStudents = students.filter(student => 
    student.consultations.some(c => new Date(c.date) >= thirtyDaysAgo)
  ).length;
  
  return {
    totalStudents: students.length,
    activeStudents,
    consultations: monthlyConsultations.length,
    newStudents: monthlyStudents.length,
    graduatedStudents: students.filter(s => s.status === 'Graduated').length
  };
};
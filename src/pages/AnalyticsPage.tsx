import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { TrendingUp, TrendingDown, Calendar, Download, Filter, Users, BookOpen, Clock, Target, AlertCircle, ChevronDown } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek } from 'date-fns';
import { api } from '../services/apiClient';
import { Student } from '../types/student';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EngagementMetrics from '../components/analytics/EngagementMetrics';
import AIInsights from '../components/analytics/AIInsights';
import { useTheme } from '../contexts/ThemeContext';

interface DateRange {
  start: Date;
  end: Date;
  label: string;
}

const PRESET_RANGES: DateRange[] = [
  { start: subDays(new Date(), 7), end: new Date(), label: 'Last 7 days' },
  { start: subDays(new Date(), 30), end: new Date(), label: 'Last 30 days' },
  { start: subDays(new Date(), 90), end: new Date(), label: 'Last 90 days' },
  { start: startOfMonth(new Date()), end: endOfMonth(new Date()), label: 'This month' },
  { start: startOfMonth(subDays(new Date(), 30)), end: endOfMonth(subDays(new Date(), 30)), label: 'Last month' },
  { start: new Date(2025, 7, 1), end: new Date(), label: 'August 2025' },
];

const COLORS = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
  pink: '#EC4899',
  cyan: '#06B6D4',
  gray: '#6B7280',
};

// Program name abbreviation logic for cleaner charts
const createAbbreviation = (name: string): { short: string; full: string } => {
  if (!name) return { short: 'N/A', full: 'Not Specified' };
  
  const isAlumni = name.includes('(Alumni)');
  const cleanName = name.replace(' (Alumni)', '');
  
  const abbreviations: Record<string, string> = {
    "Masters in Tourism Management": "MTM",
    "MS in Industrial Organizational Psychology": "MS I/O Psych",
    "Industrial Organizational Psychology": "I/O Psychology", 
    "Business Administration": "Bus. Admin",
    "Business - Hospitality": "B-H",
    "Computer Science": "CS",
    "Psychology": "Psychology",
    "MBA": "MBA",
    "Master's Program": "Master's",
    "Bachelor's Program": "Bachelor's"
  };

  let short = abbreviations[cleanName] || cleanName;
  
  if (isAlumni) {
    short = short + ' (Alum.)';
  }
  
  return { short, full: name };
};

const AnalyticsPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState<DateRange>(PRESET_RANGES[5]); // Default to August 2025
  const [showRangeDropdown, setShowRangeDropdown] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const { actualTheme } = useTheme();

  // Theme-aware tooltip styles
  const getTooltipStyle = () => ({
    backgroundColor: actualTheme === 'dark' ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    border: `1px solid ${actualTheme === 'dark' ? '#374151' : '#D1D5DB'}`,
    borderRadius: '0.5rem',
    color: actualTheme === 'dark' ? '#E5E7EB' : '#1F2937'
  });

  const getTooltipLabelStyle = () => ({
    color: actualTheme === 'dark' ? '#E5E7EB' : '#1F2937'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.students.list();
      // Handle both array response and object with data property
      const studentData = Array.isArray(response) ? response : (response.data || []);
      console.log('Analytics - Raw student data:', studentData);
      console.log('Analytics - First student consultations:', studentData[0]?.consultations);
      // Analytics data loaded successfully
      setStudents(studentData);
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter data based on selected filters
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const programMatch = selectedProgram === 'all' || student.specificProgram === selectedProgram;
      const yearMatch = selectedYear === 'all' || student.yearOfStudy === selectedYear;
      return programMatch && yearMatch;
    });
  }, [students, selectedProgram, selectedYear]);

  // Calculate advanced metrics
  const metrics = useMemo(() => {
    // Don't calculate metrics if students data isn't loaded yet
    if (!students.length || !filteredStudents.length) {
      console.log('Analytics - Skipping metrics calculation - no data yet');
      return {
        totalStudents: 0,
        activeStudents: 0,
        totalConsultations: 0,
        attendanceRate: 0,
        avgConsultationsPerStudent: 0,
        highEngagementStudents: 0,
        topProgram: 'N/A',
        noShowRate: 0,
      };
    }
    
    const totalStudents = filteredStudents.length;
    const activeStudents = totalStudents; // All students are considered active
    
    console.log('Analytics - Filtered students:', filteredStudents);
    console.log('Analytics - Date range:', selectedRange);
    
    // Consultations in date range
    const allConsultations = filteredStudents.flatMap(s => s.consultations || []);
    console.log('Analytics - All consultations:', allConsultations);
    
    const consultationsInRange = allConsultations.filter(c => {
        if (!c || !c.date) {
          console.log('Analytics - Skipping consultation with no date:', c);
          return false;
        }
        const consultationDate = new Date(c.date);
        
        // Extend end date to end of day to catch consultations scheduled for today
        const rangeEnd = new Date(selectedRange.end);
        rangeEnd.setHours(23, 59, 59, 999);
        
        const inRange = consultationDate >= selectedRange.start && consultationDate <= rangeEnd;
        console.log('Analytics - Consultation date check:', {
          consultationDate: c.date,
          parsedDate: consultationDate.toISOString(),
          rangeStart: selectedRange.start.toISOString(),
          rangeEnd: rangeEnd.toISOString(),
          inRange
        });
        return inRange;
      });
    
    console.log('Analytics - Consultations in range:', consultationsInRange);
    
    const totalConsultations = consultationsInRange.length;
    // Fix: Check both status and attended fields for compatibility
    const attendedConsultations = consultationsInRange.filter(c => 
      c.status === 'attended' || c.attended === true || c.attended === 1
    ).length;
    const noShowConsultations = consultationsInRange.filter(c => 
      c.status === 'no-show' || (c.attended === false || c.attended === 0)
    ).length;
    const attendanceRate = totalConsultations > 0 ? (attendedConsultations / totalConsultations) * 100 : 0;
    
    // Average consultations per student
    const avgConsultationsPerStudent = totalStudents > 0 ? totalConsultations / totalStudents : 0;
    
    // Students with high engagement (1+ consultations in period for now since we only have 2 consultations total)
    const highEngagementThreshold = 1; // Changed from 3 to 1 for testing
    const highEngagementStudents = filteredStudents.filter(s => {
      const studentConsultations = (s.consultations || []).filter(c => {
        if (!c || !c.date) return false;
        const date = new Date(c.date);
        return date >= selectedRange.start && date <= selectedRange.end;
      });
      return studentConsultations.length >= highEngagementThreshold;
    }).length;
    
    // Program with most consultations
    const programConsultations: Record<string, number> = {};
    filteredStudents.forEach(s => {
      const count = (s.consultations || []).filter(c => {
        if (!c || !c.date) return false;
        const date = new Date(c.date);
        return date >= selectedRange.start && date <= selectedRange.end;
      }).length;
      const program = s.specificProgram || s.major;
      if (program) {
        const { short } = createAbbreviation(program);
        programConsultations[short] = (programConsultations[short] || 0) + count;
      }
    });
    
    // Get the abbreviated program name for top performer
    const topProgramEntry = Object.entries(programConsultations)
      .sort(([,a], [,b]) => b - a)[0];
    const topProgram = topProgramEntry ? topProgramEntry[0] : 'N/A';
    
    return {
      totalStudents,
      activeStudents,
      totalConsultations,
      attendanceRate,
      avgConsultationsPerStudent,
      highEngagementStudents,
      topProgram,
      noShowRate: totalConsultations > 0 ? (noShowConsultations / totalConsultations) * 100 : 0,
    };
  }, [filteredStudents, selectedRange]);

  // Time series data for trend analysis
  const trendData = useMemo(() => {
    // Don't generate trend data if no students
    if (!students.length || !filteredStudents.length) {
      return [];
    }
    
    const days = eachDayOfInterval({ start: selectedRange.start, end: selectedRange.end });
    
    const result = days.map(day => {
      const dayConsultations = filteredStudents.flatMap(s => s.consultations || [])
        .filter(c => {
          if (!c || !c.date) return false;
          const date = new Date(c.date);
          return date.toDateString() === day.toDateString();
        });
      
      return {
        date: format(day, 'MMM dd'),
        consultations: dayConsultations.length,
        attended: dayConsultations.filter(c => 
          c.status === 'attended' || c.attended === true || c.attended === 1
        ).length,
        noShows: dayConsultations.filter(c => 
          c.status === 'no-show' || (c.attended === false || c.attended === 0)
        ).length,
      };
    });
    
    console.log('Analytics - Trend data:', result);
    return result;
  }, [filteredStudents, selectedRange]);

  // Consultation type analysis
  const consultationTypeData = useMemo(() => {
    // Don't calculate if no data
    if (!students.length || !filteredStudents.length) {
      return [];
    }
    
    const types: Record<string, { total: number; attended: number }> = {};
    
    // Use the already filtered consultations instead of re-filtering
    const typeConsultations = filteredStudents.flatMap(s => s.consultations || [])
      .filter(c => {
        if (!c || !c.date) return false;
        const consultationDate = new Date(c.date);
        const rangeEnd = new Date(selectedRange.end);
        rangeEnd.setHours(23, 59, 59, 999);
        return consultationDate >= selectedRange.start && consultationDate <= rangeEnd;
      });
    
    console.log('Analytics - Type consultations found:', typeConsultations);
    
    typeConsultations.forEach(c => {
      const type = c.type || 'General';
      if (!types[type]) {
        types[type] = { total: 0, attended: 0 };
      }
      types[type].total++;
      if (c.status === 'attended' || c.attended === true || c.attended === 1) {
        types[type].attended++;
      }
    });
    
    const result = Object.entries(types)
      .map(([type, data]) => ({
        type,
        total: data.total,
        attended: data.attended,
        attendanceRate: (data.attended / data.total) * 100,
      }))
      .sort((a, b) => b.total - a.total);
    
    console.log('Analytics - Consultation type data:', result);
    return result;
  }, [filteredStudents, selectedRange]);

  // Program performance radar chart data
  const programPerformanceData = useMemo(() => {
    // Don't calculate if no data
    if (!students.length || !filteredStudents.length) {
      return [];
    }
    
    const programs: Record<string, { students: number; consultations: number; attendance: number }> = {};
    
    filteredStudents.forEach(s => {
      const program = s.specificProgram || s.major;
      if (!program) return; // Skip students without programs
      
      const { short } = createAbbreviation(program);
      if (!programs[short]) {
        programs[short] = { students: 0, consultations: 0, attendance: 0 };
      }
      programs[short].students++;
      
      const programConsultations = (s.consultations || []).filter(c => {
        if (!c || !c.date) return false;
        const date = new Date(c.date);
        return date >= selectedRange.start && date <= selectedRange.end;
      });
      
      programs[short].consultations += programConsultations.length;
      programs[short].attendance += programConsultations.filter(c => 
        c.status === 'attended' || c.attended === true || c.attended === 1
      ).length;
    });
    
    const result = Object.entries(programs)
      .map(([program, data]) => ({
        program,
        students: data.students,
        avgConsultations: data.students > 0 ? data.consultations / data.students : 0,
        attendanceRate: data.consultations > 0 ? (data.attendance / data.consultations) * 100 : 0,
      }))
      .slice(0, 6); // Top 6 programs for radar chart
    
    console.log('Analytics - Program performance data:', result);
    return result;
  }, [filteredStudents, selectedRange]);

  const handleExport = async () => {
    try {
      // Create CSV content with analytics data
      let csvContent = 'Analytics Report\n';
      csvContent += `Date Range: ${selectedRange.label} (${format(selectedRange.start, 'MMM dd, yyyy')} - ${format(selectedRange.end, 'MMM dd, yyyy')})\n`;
      csvContent += `Generated: ${format(new Date(), 'PPP')}\n\n`;
      
      // Key Metrics Section
      csvContent += 'KEY METRICS\n';
      csvContent += 'Metric,Value\n';
      csvContent += `Total Students,${metrics.totalStudents}\n`;
      csvContent += `Active Students,${metrics.activeStudents}\n`;
      csvContent += `Total Consultations,${metrics.totalConsultations}\n`;
      csvContent += `Attendance Rate,${metrics.attendanceRate.toFixed(1)}%\n`;
      csvContent += `No-Show Rate,${metrics.noShowRate.toFixed(1)}%\n`;
      csvContent += `Avg Consultations per Student,${metrics.avgConsultationsPerStudent.toFixed(1)}\n\n`;
      
      // Consultation Trends
      csvContent += 'CONSULTATION TRENDS\n';
      csvContent += 'Date,Consultations,Attended,No-Shows\n';
      trendData.forEach(day => {
        csvContent += `${day.date},${day.consultations},${day.attended},${day.noShows}\n`;
      });
      csvContent += '\n';
      
      // Consultation Types
      csvContent += 'CONSULTATION TYPES\n';
      csvContent += 'Type,Total,Attended,Attendance Rate\n';
      consultationTypeData.forEach(type => {
        csvContent += `${type.type},${type.total},${type.attended},${type.attendanceRate.toFixed(1)}%\n`;
      });
      csvContent += '\n';
      
      // Program Performance
      csvContent += 'PROGRAM PERFORMANCE\n';
      csvContent += 'Program,Students,Avg Consultations,Attendance Rate\n';
      programPerformanceData.forEach(program => {
        csvContent += `"${program.program}",${program.students},${program.avgConsultations.toFixed(1)},${program.attendanceRate.toFixed(1)}%\n`;
      });
      csvContent += '\n';
      
      // Student List with Key Metrics
      csvContent += 'STUDENT DETAILS\n';
      csvContent += 'Name,Email,Program,Year,Consultations,No-Shows,Last Contact\n';
      filteredStudents.forEach(student => {
        const consultationCount = student.consultations?.length || 0;
        const noShowCount = student.noShowCount || 0;
        const lastContact = student.lastContactDate ? format(new Date(student.lastContactDate), 'MM/dd/yyyy') : 'Never';
        csvContent += `"${student.firstName} ${student.lastName}",${student.email},"${student.program || 'N/A'}",${student.yearOfStudy || 'N/A'},${consultationCount},${noShowCount},${lastContact}\n`;
      });

      // Create and download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export analytics:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">Loading analytics data...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <LoadingSkeleton key={i} type="card" className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LoadingSkeleton type="card" className="h-96" />
          <LoadingSkeleton type="card" className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Advanced insights and performance metrics</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {/* Date range selector */}
          <div className="relative">
            <button
              onClick={() => setShowRangeDropdown(!showRangeDropdown)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <Calendar className="h-4 w-4 mr-2" />
              {selectedRange.label}
              <ChevronDown className="h-4 w-4 ml-2" />
            </button>
            
            {showRangeDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                {PRESET_RANGES.map((range, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedRange(range);
                      setShowRangeDropdown(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg"
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Program filter */}
          <select
            value={selectedProgram}
            onChange={(e) => setSelectedProgram(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800"
          >
            <option value="all">All Programs</option>
            {[...new Set(students.map(s => s.specificProgram))].map(program => (
              <option key={program} value={program}>{program}</option>
            ))}
          </select>

          {/* Year filter */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800"
          >
            <option value="all">All Years</option>
            {[...new Set(students.map(s => s.yearOfStudy))].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>

          {/* Export button */}
          <button
            onClick={handleExport}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Students</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.totalStudents}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {metrics.activeStudents} active
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Attendance Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{isNaN(metrics.attendanceRate) ? '0.0' : metrics.attendanceRate.toFixed(1)}%</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {isNaN(metrics.noShowRate) ? '0.0' : metrics.noShowRate.toFixed(1)}% no-show
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-lg">
              <Target className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg per Student</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{isNaN(metrics.avgConsultationsPerStudent) ? '0.0' : metrics.avgConsultationsPerStudent.toFixed(1)}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                consultations
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
              <BookOpen className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">High Engagement</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.highEngagementStudents}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                students (1+ meetings)
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
              <TrendingUp className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Consultation Trends */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Consultation Trends</h3>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip 
                contentStyle={getTooltipStyle()}
                labelStyle={getTooltipLabelStyle()}
              />
              <Area 
                type="monotone" 
                dataKey="consultations" 
                stackId="1"
                stroke={COLORS.primary} 
                fill={COLORS.primary}
                fillOpacity={0.6}
                name="Total"
              />
              <Area 
                type="monotone" 
                dataKey="attended" 
                stackId="2"
                stroke={COLORS.success} 
                fill={COLORS.success}
                fillOpacity={0.6}
                name="Attended"
              />
              <Area 
                type="monotone" 
                dataKey="noShows" 
                stackId="3"
                stroke={COLORS.danger} 
                fill={COLORS.danger}
                fillOpacity={0.6}
                name="No-shows"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Consultation Types Performance */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Consultation Type Performance</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={consultationTypeData} margin={{ bottom: 100, left: 20, right: 20, top: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="type" 
                stroke="#6B7280"
                angle={-45}
                textAnchor="end"
                height={120}
                interval={0}
                tick={{ fontSize: 9, fill: '#6B7280' }}
              />
              <YAxis stroke="#6B7280" />
              <Tooltip 
                contentStyle={getTooltipStyle()}
                labelStyle={getTooltipLabelStyle()}
              />
              <Bar dataKey="total" fill={COLORS.primary} name="Total" />
              <Bar dataKey="attended" fill={COLORS.success} name="Attended" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Program Performance Radar */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Program Performance</h3>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={programPerformanceData} margin={{ top: 20, right: 80, bottom: 20, left: 80 }}>
              <PolarGrid stroke="#374151" />
              <PolarAngleAxis dataKey="program" stroke="#6B7280" tick={{ fontSize: 11, fill: '#6B7280' }} />
              <PolarRadiusAxis stroke="#6B7280" />
              <Radar 
                name="Students" 
                dataKey="students" 
                stroke={COLORS.primary} 
                fill={COLORS.primary} 
                fillOpacity={0.6} 
              />
              <Radar 
                name="Avg Consultations" 
                dataKey="avgConsultations" 
                stroke={COLORS.success} 
                fill={COLORS.success} 
                fillOpacity={0.6} 
              />
              <Radar 
                name="Attendance Rate" 
                dataKey="attendanceRate" 
                stroke={COLORS.purple} 
                fill={COLORS.purple} 
                fillOpacity={0.6} 
              />
              <Tooltip 
                contentStyle={getTooltipStyle()}
                labelStyle={getTooltipLabelStyle()}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Insights */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Key Insights</h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Top Performing Program</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {metrics.topProgram} has the highest consultation volume
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Student Engagement</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {metrics.totalStudents > 0 
                    ? `${((metrics.highEngagementStudents / metrics.totalStudents) * 100).toFixed(1)}% of students are highly engaged`
                    : '0.0% of students are highly engaged'}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
                <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Attendance Alert</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {metrics.noShowRate > 15 
                    ? `High no-show rate detected (${metrics.noShowRate.toFixed(1)}%)`
                    : `No-show rate is under control (${metrics.noShowRate.toFixed(1)}%)`
                  }
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Period Summary</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {metrics.totalConsultations} total consultations in {selectedRange.label.toLowerCase()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Student Engagement Metrics */}
      <EngagementMetrics students={filteredStudents} dateRange={selectedRange} />

      {/* AI-Powered Insights */}
      <AIInsights students={filteredStudents} dateRange={selectedRange} metrics={metrics} />
    </div>
  );
};

export default AnalyticsPage;
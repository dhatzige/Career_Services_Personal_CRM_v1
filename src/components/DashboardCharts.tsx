import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Student } from '../types/student';

interface DashboardChartsProps {
  students: Student[];
}

interface ChartDataItem {
  name: string;
  value: number;
  color?: string;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
  }>;
  label?: string;
}

const DashboardCharts: React.FC<DashboardChartsProps> = ({ students }) => {
  // Program distribution data - separate current students from alumni
  const programData: ChartDataItem[] = students.reduce((acc: ChartDataItem[], student) => {
    let programName = '';
    
    // Determine the most specific program name available
    if (student.programType === "Master's") {
      // For Master's, prioritize: major (MBA, MSc, etc.) > specificProgram > "Master's"
      programName = student.major || student.specificProgram || "Master's Program";
    } else if (student.programType === "Bachelor's") {
      // For Bachelor's, prioritize: specificProgram > major > "Bachelor's"
      programName = student.specificProgram || student.major || "Bachelor's Program";
    } else {
      // Fallback for any other cases
      programName = student.specificProgram || student.major || student.programType || 'Unknown';
    }
    
    // Add (Alumni) suffix if the student has graduated
    if (student.yearOfStudy === 'Alumni') {
      programName = `${programName} (Alumni)`;
    } else if (student.yearOfStudy && student.yearOfStudy !== 'Alumni') {
      // Optionally add year for current students
      // This helps distinguish between different years of the same program
      // Commented out for now - uncomment if desired
      // programName = `${programName} (${student.yearOfStudy})`;
    }
    
    const existing = acc.find(item => item.name === programName);
    if (existing) {
      existing.value++;
    } else {
      acc.push({ name: programName, value: 1 });
    }
    return acc;
  }, []);

  // Year distribution data - categorize by program type and year
  const yearData: ChartDataItem[] = students.reduce((acc: ChartDataItem[], student) => {
    // Create a label that includes program type for clarity
    let label = student.yearOfStudy || 'Unknown';
    
    // Add program context for better understanding
    if (student.yearOfStudy === 'Alumni') {
      label = 'Alumni';
    } else if (student.programType === "Bachelor's" && student.yearOfStudy) {
      label = `Bachelor's - ${student.yearOfStudy}`;
    } else if (student.programType === "Master's" && student.yearOfStudy) {
      label = `Master's - ${student.yearOfStudy}`;
    }
    
    const existing = acc.find(item => item.name === label);
    if (existing) {
      existing.value++;
    } else {
      acc.push({ name: label, value: 1 });
    }
    return acc;
  }, []);

  // Consultation distribution data
  const consultationData: ChartDataItem[] = students.reduce((acc: ChartDataItem[], student) => {
    if (student.consultations) {
      student.consultations.forEach(consultation => {
      const existing = acc.find(item => item.name === consultation.type);
      if (existing) {
        existing.value++;
      } else {
        acc.push({ name: consultation.type, value: 1 });
      }
    });
    }
    return acc;
  }, []);

  const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];

  const CustomTooltip: React.FC<TooltipProps> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-w-xs z-50">
          <p className="text-gray-900 dark:text-white font-medium text-sm break-words">{label}</p>
          <p className="text-blue-600 dark:text-blue-400 text-sm">
            Count: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Program Distribution */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Students by Program
        </h3>
        {programData.length > 5 && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Showing all {programData.length} programs
          </p>
        )}
        <div className="overflow-x-auto">
          <ResponsiveContainer width={Math.max(400, programData.length * 120)} height={400}>
            <BarChart data={programData} margin={{ top: 20, right: 30, left: 20, bottom: 120 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="name" 
                stroke="#6B7280"
                tick={{ fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={100}
                interval={0}
              />
              <YAxis stroke="#6B7280" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#3B82F6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Year Distribution */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Students by Year
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={yearData}
              cx="50%"
              cy="45%"
              innerRadius={60}
              outerRadius={100}
              dataKey="value"
              labelLine={false}
              label={(entry) => {
                const percent = ((entry.value / students.length) * 100).toFixed(0);
                return entry.value > 0 ? `${entry.name}: ${entry.value} (${percent}%)` : '';
              }}
            >
              {yearData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-4 space-y-2">
          {yearData.map((entry, index) => (
            <div key={entry.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <div 
                  className="w-3 h-3 rounded mr-2" 
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <span className="text-gray-700 dark:text-gray-300">{entry.name}</span>
              </div>
              <span className="text-gray-600 dark:text-gray-400">{entry.value} students</span>
            </div>
          ))}
        </div>
      </div>

      {/* Consultation Types */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 xl:col-span-2 overflow-hidden">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Consultation Types Distribution
        </h3>
        {consultationData.length > 8 && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Showing all {consultationData.length} consultation types
          </p>
        )}
        <div className="overflow-x-auto">
          <ResponsiveContainer width={Math.max(600, consultationData.length * 100)} height={400}>
            <BarChart data={consultationData} margin={{ top: 20, right: 30, left: 20, bottom: 120 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="name" 
                stroke="#6B7280"
                tick={{ fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={100}
                interval={0}
              />
              <YAxis stroke="#6B7280" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#10B981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts;
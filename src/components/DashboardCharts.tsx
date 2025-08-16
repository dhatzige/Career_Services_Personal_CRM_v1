import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Student } from '../types/student';
import { useTheme } from '../contexts/ThemeContext';

interface DashboardChartsProps {
  students: Student[];
}

interface ChartDataItem {
  name: string;
  value: number;
  color?: string;
}

const DashboardCharts: React.FC<DashboardChartsProps> = ({ students }) => {
  const { actualTheme } = useTheme();
  
  // Theme-aware tooltip styles
  const getTooltipStyle = () => ({
    backgroundColor: actualTheme === 'dark' ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    border: `1px solid ${actualTheme === 'dark' ? '#374151' : '#D1D5DB'}`,
    borderRadius: '0.5rem',
    color: actualTheme === 'dark' ? '#E5E7EB' : '#1F2937'
  });
  // Program distribution data - only include students with programs
  const programData: ChartDataItem[] = students.reduce((acc: ChartDataItem[], student) => {
    let programName = '';
    
    // Determine the most specific program name available
    if (student.programType === "Master's") {
      programName = student.major || student.specificProgram || "Master's Program";
    } else if (student.programType === "Bachelor's") {
      programName = student.specificProgram || student.major || "Bachelor's Program";
    } else {
      programName = student.specificProgram || student.major;
      if (!programName) return acc; // Skip students without programs
    }
    
    // Add (Alumni) suffix if the student has graduated
    if (student.yearOfStudy === 'Alumni') {
      programName = `${programName} (Alumni)`;
    }
    
    // Keep full program names for card layout - no abbreviations needed
    
    const existing = acc.find(item => item.name === programName);
    if (existing) {
      existing.value++;
    } else {
      acc.push({ name: programName, value: 1 });
    }
    return acc;
  }, []);

  // Year distribution - simplified labels
  const yearData: ChartDataItem[] = students.reduce((acc: ChartDataItem[], student) => {
    let label = student.yearOfStudy || 'Unknown';
    
    // Simplified labels
    if (student.yearOfStudy === 'Alumni') {
      label = 'Alumni';
    } else if (student.programType === "Bachelor's" && student.yearOfStudy) {
      label = `${student.programType} - ${student.yearOfStudy}`;
    } else if (student.programType === "Master's" && student.yearOfStudy) {
      label = `${student.programType} - ${student.yearOfStudy}`;
    }
    
    const existing = acc.find(item => item.name === label);
    if (existing) {
      existing.value++;
    } else {
      acc.push({ name: label, value: 1 });
    }
    return acc;
  }, []);

  // Consultation types
  const consultationData: ChartDataItem[] = students.reduce((acc: ChartDataItem[], student) => {
    if (student.consultations && Array.isArray(student.consultations)) {
      student.consultations.forEach(consultation => {
        if (consultation && consultation.type) {
          const existing = acc.find(item => item.name === consultation.type);
          if (existing) {
            existing.value++;
          } else {
            acc.push({ name: consultation.type, value: 1 });
          }
        }
      });
    }
    return acc;
  }, []);

  const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Program Distribution - Simple Cards */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Students by Program</h3>
        <div className="space-y-4">
          {programData.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center">
                <div 
                  className="w-4 h-4 rounded mr-3"
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <span className="text-gray-700 dark:text-gray-200 font-medium">{item.name}</span>
              </div>
              <div className="flex items-center">
                <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-3">
                  <div 
                    className="h-2 rounded-full"
                    style={{ 
                      backgroundColor: colors[index % colors.length],
                      width: `${(item.value / Math.max(...programData.map(d => d.value))) * 100}%`
                    }}
                  />
                </div>
                <span className="text-gray-600 dark:text-gray-300 text-sm font-medium min-w-[2rem]">
                  {item.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Year Distribution - Clean Pie Chart */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Students by Year</h3>
        <div className="flex items-center justify-center">
          <div className="w-64 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={yearData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={50}
                  dataKey="value"
                >
                  {yearData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={getTooltipStyle()}
                  labelStyle={{ color: actualTheme === 'dark' ? '#E5E7EB' : '#1F2937' }}
                  itemStyle={{ color: actualTheme === 'dark' ? '#E5E7EB' : '#1F2937' }}
                  cursor={false}
                  formatter={(value: number, name: string) => [
                    `${value} student${value !== 1 ? 's' : ''}`, 
                    name
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Clean Legend */}
        <div className="mt-6 grid grid-cols-1 gap-3">
          {yearData.map((entry, index) => (
            <div key={entry.name} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
              <div className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-3"
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <span className="text-gray-700 dark:text-gray-100 text-sm font-medium">{entry.name}</span>
              </div>
              <span className="text-gray-600 dark:text-gray-200 text-sm">
                {entry.value} ({((entry.value / students.length) * 100).toFixed(0)}%)
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Consultation Types - Clean Horizontal Bars */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 lg:col-span-2">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
          Consultation Types Distribution
        </h3>
        <div className="space-y-4">
          {consultationData.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center min-w-0 flex-1">
                <div 
                  className="w-4 h-4 rounded mr-4 flex-shrink-0"
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <span className="text-gray-700 dark:text-gray-300 font-medium truncate">{item.name}</span>
              </div>
              <div className="flex items-center ml-4">
                <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-3 mr-4">
                  <div 
                    className="h-3 rounded-full"
                    style={{ 
                      backgroundColor: colors[index % colors.length],
                      width: `${(item.value / Math.max(...consultationData.map(d => d.value))) * 100}%`
                    }}
                  />
                </div>
                <span className="text-gray-600 dark:text-gray-300 text-sm font-medium min-w-[2rem]">
                  {item.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts;
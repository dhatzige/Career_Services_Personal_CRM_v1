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
  // Program distribution data
  const programData: ChartDataItem[] = students.reduce((acc: ChartDataItem[], student) => {
    // Use specificProgram if available, otherwise fall back to programType
    const programName = student.specificProgram || student.programType || 'Unknown';
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
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="text-gray-900 dark:text-white font-medium">{label}</p>
          <p className="text-blue-600 dark:text-blue-400">
            Students: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Program Distribution */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Students by Program
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={programData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="name" 
              stroke="#6B7280"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis stroke="#6B7280" />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" fill="#3B82F6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Year Distribution */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Students by Year
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={yearData}
              cx="50%"
              cy="50%"
              outerRadius={80}
              dataKey="value"
              label={({ name, value }) => `${name}: ${value}`}
            >
              {yearData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Consultation Types */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 lg:col-span-2">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Consultation Types Distribution
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={consultationData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="name" 
              stroke="#6B7280"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis stroke="#6B7280" />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" fill="#10B981" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DashboardCharts;
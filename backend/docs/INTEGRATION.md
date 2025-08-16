# Frontend-Backend Integration Guide

This guide will help you integrate the new PostgreSQL backend with your existing React frontend.

## 🔄 Integration Steps

### 1. Update Frontend API Configuration

Create or update `src/utils/api.ts` in your frontend:

```typescript
// src/utils/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.loadToken();
  }

  private loadToken(): void {
    this.token = localStorage.getItem('authToken');
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Authentication methods
  async login(password: string, stayLoggedIn?: boolean): Promise<any> {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password, stayLoggedIn }),
    });
    
    if (response.data.token) {
      this.token = response.data.token;
      localStorage.setItem('authToken', this.token);
    }
    
    return response;
  }

  async setup(username: string, password: string, email?: string): Promise<any> {
    const response = await this.request('/auth/setup', {
      method: 'POST',
      body: JSON.stringify({ username, password, email }),
    });
    
    if (response.data.token) {
      this.token = response.data.token;
      localStorage.setItem('authToken', this.token);
    }
    
    return response;
  }

  logout(): void {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  // Student methods
  async getStudents(): Promise<any> {
    return this.request('/students');
  }

  async getStudent(id: string): Promise<any> {
    return this.request(`/students/${id}`);
  }

  async createStudent(studentData: any): Promise<any> {
    return this.request('/students', {
      method: 'POST',
      body: JSON.stringify(studentData),
    });
  }

  async updateStudent(id: string, studentData: any): Promise<any> {
    return this.request(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(studentData),
    });
  }

  async deleteStudent(id: string): Promise<any> {
    return this.request(`/students/${id}`, {
      method: 'DELETE',
    });
  }

  // Notes methods
  async getStudentNotes(studentId: string): Promise<any> {
    return this.request(`/notes/student/${studentId}`);
  }

  async createNote(studentId: string, noteData: any): Promise<any> {
    return this.request(`/notes/student/${studentId}`, {
      method: 'POST',
      body: JSON.stringify(noteData),
    });
  }

  // Consultations methods
  async getStudentConsultations(studentId: string): Promise<any> {
    return this.request(`/consultations/student/${studentId}`);
  }

  async createConsultation(studentId: string, consultationData: any): Promise<any> {
    return this.request(`/consultations/student/${studentId}`, {
      method: 'POST',
      body: JSON.stringify(consultationData),
    });
  }

  // Dashboard methods
  async getDashboardStats(): Promise<any> {
    return this.request('/dashboard/stats');
  }

  async getRecentActivity(): Promise<any> {
    return this.request('/dashboard/activity');
  }

  // AI methods
  async generateAIReport(): Promise<any> {
    return this.request('/ai/report', {
      method: 'POST',
    });
  }

  async getStudentInsights(studentId: string): Promise<any> {
    return this.request(`/ai/insights/student/${studentId}`);
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
```

### 2. Update Student Data Management

Replace `src/utils/studentData.ts` localStorage-based storage:

```typescript
// src/utils/studentDataApi.ts
import apiClient from './api';
import { Student, Note, Consultation } from '../types';

export const studentDataApi = {
  // Students
  async getAllStudents(): Promise<Student[]> {
    const response = await apiClient.getStudents();
    return response.data;
  },

  async getStudent(id: string): Promise<Student | null> {
    try {
      const response = await apiClient.getStudent(id);
      return response.data;
    } catch (error) {
      console.error('Error fetching student:', error);
      return null;
    }
  },

  async addStudent(student: Omit<Student, 'id' | 'dateAdded'>): Promise<Student> {
    const response = await apiClient.createStudent(student);
    return response.data;
  },

  async updateStudent(id: string, updates: Partial<Student>): Promise<Student> {
    const response = await apiClient.updateStudent(id, updates);
    return response.data;
  },

  async deleteStudent(id: string): Promise<void> {
    await apiClient.deleteStudent(id);
  },

  // Notes
  async addNote(studentId: string, note: Omit<Note, 'id' | 'dateCreated'>): Promise<Note> {
    const response = await apiClient.createNote(studentId, note);
    return response.data;
  },

  async getStudentNotes(studentId: string): Promise<Note[]> {
    const response = await apiClient.getStudentNotes(studentId);
    return response.data;
  },

  // Consultations
  async addConsultation(studentId: string, consultation: Omit<Consultation, 'id'>): Promise<Consultation> {
    const response = await apiClient.createConsultation(studentId, consultation);
    return response.data;
  },

  async getStudentConsultations(studentId: string): Promise<Consultation[]> {
    const response = await apiClient.getStudentConsultations(studentId);
    return response.data;
  },

  // Dashboard
  async getDashboardData(): Promise<any> {
    const response = await apiClient.getDashboardStats();
    return response.data;
  },

  // AI Reports
  async generateReport(): Promise<any> {
    const response = await apiClient.generateAIReport();
    return response.data;
  }
};
```

### 3. Environment Configuration

Create or update `.env` in your frontend root:

```bash
# Frontend .env file
VITE_API_URL=http://localhost:3001/api
```

### 4. Update Authentication Flow

Create `src/hooks/useAuth.ts`:

```typescript
import { useState, useEffect, createContext, useContext } from 'react';
import apiClient from '../utils/api';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  isConfigured: boolean;
  login: (password: string, stayLoggedIn?: boolean) => Promise<void>;
  setup: (username: string, password: string, email?: string) => Promise<void>;
  logout: () => void;
  checkSystemStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);

  const checkSystemStatus = async () => {
    try {
      const response = await apiClient.request('/auth/status');
      setIsConfigured(response.data.isConfigured);
    } catch (error) {
      console.error('Failed to check system status:', error);
      setIsConfigured(false);
    }
  };

  const login = async (password: string, stayLoggedIn?: boolean) => {
    await apiClient.login(password, stayLoggedIn);
    setIsAuthenticated(true);
  };

  const setup = async (username: string, password: string, email?: string) => {
    await apiClient.setup(username, password, email);
    setIsAuthenticated(true);
    setIsConfigured(true);
  };

  const logout = () => {
    apiClient.logout();
    setIsAuthenticated(false);
  };

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      await checkSystemStatus();
      
      // Check if user has valid token
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          await apiClient.request('/auth/me');
          setIsAuthenticated(true);
        } catch (error) {
          localStorage.removeItem('authToken');
          setIsAuthenticated(false);
        }
      }
      
      setIsLoading(false);
    };

    initAuth();
  }, []);

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      isLoading,
      isConfigured,
      login,
      setup,
      logout,
      checkSystemStatus
    }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### 5. Update Your React Components

Example of updating a student list component:

```typescript
// src/components/StudentList.tsx
import { useState, useEffect } from 'react';
import { studentDataApi } from '../utils/studentDataApi';
import { Student } from '../types';

export const StudentList = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const data = await studentDataApi.getAllStudents();
        setStudents(data);
      } catch (err) {
        setError('Failed to fetch students');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  if (loading) return <div>Loading students...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {students.map(student => (
        <div key={student.id}>
          {student.firstName} {student.lastName}
        </div>
      ))}
    </div>
  );
};
```

## 🔧 Migration Steps

### 1. Data Migration

If you have existing data in localStorage, create a migration script:

```typescript
// src/utils/dataMigration.ts
import { studentDataApi } from './studentDataApi';

export const migrateLocalStorageData = async () => {
  try {
    // Get existing data from localStorage
    const existingStudents = JSON.parse(localStorage.getItem('crm_students') || '[]');
    
    if (existingStudents.length > 0) {
      console.log('Migrating', existingStudents.length, 'students to backend...');
      
      for (const student of existingStudents) {
        try {
          await studentDataApi.addStudent(student);
        } catch (error) {
          console.error('Failed to migrate student:', student.firstName, student.lastName, error);
        }
      }
      
      console.log('Migration completed');
      
      // Optionally clear localStorage after successful migration
      // localStorage.removeItem('crm_students');
    }
  } catch (error) {
    console.error('Migration failed:', error);
  }
};
```

### 2. Update App.tsx

```typescript
// src/App.tsx
import { useAuth, AuthProvider } from './hooks/useAuth';
import { LoginComponent } from './components/Login';
import { SetupComponent } from './components/Setup';
import { MainApp } from './components/MainApp';

function AppContent() {
  const { isAuthenticated, isLoading, isConfigured } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isConfigured) {
    return <SetupComponent />;
  }

  if (!isAuthenticated) {
    return <LoginComponent />;
  }

  return <MainApp />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
```

## 🚀 Testing the Integration

1. **Start the backend server:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start the frontend:**
   ```bash
   cd .. # back to project root
   npm run dev
   ```

3. **Test the integration:**
   - Visit http://localhost:5173
   - Complete the setup if not configured
   - Login with your credentials
   - Test creating, editing, and deleting students
   - Verify data persists after page refresh

## 🐛 Troubleshooting

### Common Issues:

1. **CORS errors:** Make sure `FRONTEND_URL` is set correctly in backend `.env`
2. **API not found:** Verify backend is running on port 3001
3. **Authentication failures:** Check JWT_SECRET is set in backend `.env`
4. **Database connection:** Ensure PostgreSQL is running and configured correctly

### Debug Mode:

Add this to check API connectivity:

```typescript
// Add to your component
useEffect(() => {
  fetch('http://localhost:3001/health')
    .then(res => res.json())
    .then(data => console.log('Backend health:', data))
    .catch(err => console.error('Backend not reachable:', err));
}, []);
```

## 📈 Next Steps

After successful integration:

1. **Test all features thoroughly**
2. **Migrate any existing localStorage data**
3. **Set up production environment variables**
4. **Configure proper database backups**
5. **Set up monitoring and logging**

The backend provides many new features like AI reports, comprehensive dashboard statistics, and better search capabilities that weren't available with localStorage! 
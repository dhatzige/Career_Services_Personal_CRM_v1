import Fuse from 'fuse.js';
import { Student } from '../types/student';
import { debounce } from './performance';

export interface SearchFilters {
  programs: string[];
  years: string[];
  statuses: string[];
  consultationTypes: string[];
  dateRange: {
    start?: Date;
    end?: Date;
  };
  hasNotes: boolean | null;
  hasConsultations: boolean | null;
}

export interface SearchResult {
  students: Student[];
  totalCount: number;
  facets: {
    programs: { [key: string]: number };
    years: { [key: string]: number };
    statuses: { [key: string]: number };
  };
}

class AdvancedSearch {
  private fuse: Fuse<Student>;
  
  constructor(students: Student[]) {
    this.fuse = new Fuse(students, {
      keys: [
        { name: 'firstName', weight: 0.3 },
        { name: 'lastName', weight: 0.3 },
        { name: 'email', weight: 0.2 },
        { name: 'specificProgram', weight: 0.1 },
        { name: 'notes.content', weight: 0.1 }
      ],
      threshold: 0.3,
      includeScore: true,
      includeMatches: true
    });
  }
  
  search(query: string, filters: Partial<SearchFilters> = {}): SearchResult {
    let results: Student[];
    
    if (query.trim()) {
      const fuseResults = this.fuse.search(query);
      results = fuseResults.map(result => result.item);
    } else {
      results = this.fuse.getIndex().docs as Student[];
    }
    
    // Apply filters
    results = this.applyFilters(results, filters);
    
    // Generate facets
    const facets = this.generateFacets(results);
    
    return {
      students: results,
      totalCount: results.length,
      facets
    };
  }
  
  private applyFilters(students: Student[], filters: Partial<SearchFilters>): Student[] {
    return students.filter(student => {
      // Program filter
      if (filters.programs?.length && !filters.programs.includes(student.specificProgram)) {
        return false;
      }
      
      // Year filter
      if (filters.years?.length && !filters.years.includes(student.yearOfStudy)) {
        return false;
      }
      
      // Status filter
      if (filters.statuses?.length && !filters.statuses.includes(student.status)) {
        return false;
      }
      
      // Consultation type filter
      if (filters.consultationTypes?.length) {
        const hasConsultationType = student.consultations.some(c => 
          filters.consultationTypes!.includes(c.type)
        );
        if (!hasConsultationType) return false;
      }
      
      // Date range filter
      if (filters.dateRange?.start || filters.dateRange?.end) {
        const studentDate = new Date(student.dateAdded);
        if (filters.dateRange.start && studentDate < filters.dateRange.start) return false;
        if (filters.dateRange.end && studentDate > filters.dateRange.end) return false;
      }
      
      // Has notes filter
      if (filters.hasNotes !== null) {
        const hasNotes = student.notes.length > 0;
        if (filters.hasNotes !== hasNotes) return false;
      }
      
      // Has consultations filter
      if (filters.hasConsultations !== null) {
        const hasConsultations = student.consultations.length > 0;
        if (filters.hasConsultations !== hasConsultations) return false;
      }
      
      return true;
    });
  }
  
  private generateFacets(students: Student[]) {
    const facets = {
      programs: {} as { [key: string]: number },
      years: {} as { [key: string]: number },
      statuses: {} as { [key: string]: number }
    };
    
    students.forEach(student => {
      // Programs
      facets.programs[student.specificProgram] = 
        (facets.programs[student.specificProgram] || 0) + 1;
      
      // Years
      facets.years[student.yearOfStudy] = 
        (facets.years[student.yearOfStudy] || 0) + 1;
      
      // Statuses
      facets.statuses[student.status] = 
        (facets.statuses[student.status] || 0) + 1;
    });
    
    return facets;
  }
}

export const createAdvancedSearch = (students: Student[]) => {
  return new AdvancedSearch(students);
};

// Debounced search hook
export const useDebouncedSearch = (
  searchFunction: (query: string) => void,
  delay: number = 300
) => {
  return debounce(searchFunction, delay);
};
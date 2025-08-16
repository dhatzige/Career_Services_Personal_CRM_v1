# Import/Export Guide

This guide explains how to use the import and export features in the Career Services CRM to manage your data efficiently.

## Table of Contents
- [Overview](#overview)
- [Exporting Data](#exporting-data)
- [Importing Data](#importing-data)
- [Data Formats](#data-formats)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

The Career Services CRM provides comprehensive import/export functionality to help you:
- Backup your data regularly
- Transfer data between systems
- Bulk import student information
- Generate reports for external analysis
- Maintain data portability

All import/export features are available in **Settings > Data Management**.

## Exporting Data

### Available Export Types

1. **Students** - Export all student records with their details
2. **Consultations** - Export consultation history and attendance
3. **Notes** - Export all notes and documentation
4. **Full Backup** - Complete system backup in JSON format

### How to Export

1. Navigate to **Settings** from the main menu
2. Click on the **Data Management** tab
3. In the Export section, choose your desired export type:
   - Click "Export Students" for student data
   - Click "Export Consultations" for consultation records
   - Click "Export Notes" for all notes
   - Click "Export Full Backup" for complete system data

### Export Formats

#### CSV Format (Default)
- Human-readable spreadsheet format
- Opens in Excel, Google Sheets, or any spreadsheet application
- Ideal for reports and data analysis
- Each record type exports to a separate CSV file

#### JSON Format (Full Backup)
- Complete data structure preservation
- Includes all relationships and metadata
- Best for system backups and migrations
- Single file containing all data types

### Export File Naming

Files are automatically named with the format:
```
{dataType}_{YYYY-MM-DD}.csv
career-services-backup_{YYYY-MM-DD}.json
```

## Importing Data

### Currently Supported Imports

- **Students** - Bulk import student records via CSV

### Import Process

1. Navigate to **Settings > Data Management**
2. In the Import section:
   - Click "Download Template" to get the CSV template
   - Fill in the template with your data
   - Click "Import Students"
   - Select your CSV file
   - Review the import summary

### CSV Template Format

The student import template includes these fields:

| Field | Required | Description | Example |
|-------|----------|-------------|---------|
| First Name | Yes | Student's first name | John |
| Last Name | Yes | Student's last name | Doe |
| Email | Yes | University email (must be unique) | john.doe@university.edu |
| Phone | No | Contact phone number | +1 (555) 123-4567 |
| Status | Yes | Student status | Active, Inactive, Graduated |
| Current Year | Yes | Academic year | 1st year, 2nd year, etc. |
| Program Type | Yes | Degree level | Bachelor's, Master's, PhD |
| Degree Program | Yes | Field of study | Computer Science |
| Major/Specialization | No | Specific focus area | Machine Learning |

### Import Guidelines

1. **Email Uniqueness**: Each email must be unique
2. **Required Fields**: All required fields must have values
3. **Format Consistency**: Follow the exact format shown in the template
4. **Character Encoding**: Use UTF-8 encoding for special characters
5. **Date Formats**: Use YYYY-MM-DD for any date fields

### Import Validation

The system automatically:
- Validates all required fields
- Checks for duplicate emails
- Skips existing students (based on email)
- Reports success/error counts
- Provides detailed error messages

## Data Formats

### Student CSV Format

```csv
First Name,Last Name,Email,Phone,Status,Current Year,Program Type,Degree Program,Major/Specialization
John,Doe,john.doe@university.edu,+1 (555) 123-4567,Active,3rd year,Bachelor's,Computer Science,
Jane,Smith,jane.smith@university.edu,,Active,1st year,Master's,MBA,Finance
```

### Consultation CSV Format

```csv
Student Name,Student Email,Date,Time,Status,Type,Location,Advisor,Notes
John Doe,john.doe@university.edu,2025-08-04,10:00 AM,Completed,Career Planning,Office,Sarah Johnson,"Discussed internship opportunities"
```

### Full Backup JSON Structure

```json
{
  "version": "2.0",
  "exportDate": "2025-08-04T10:30:00Z",
  "data": {
    "students": [...],
    "consultations": [...],
    "notes": [...]
  },
  "metadata": {
    "studentCount": 150,
    "consultationCount": 450,
    "noteCount": 300
  }
}
```

## Best Practices

### Regular Backups

1. **Weekly Backups**: Export full backup weekly
2. **Before Major Changes**: Always backup before bulk operations
3. **Off-site Storage**: Store backups in cloud storage
4. **Version Control**: Keep multiple backup versions

### Data Preparation

1. **Clean Data**: Remove duplicates before importing
2. **Validate Emails**: Ensure all emails are valid
3. **Test First**: Import a small batch to test
4. **Use Templates**: Always start with the provided template

### Security

1. **Encrypt Backups**: Encrypt sensitive backup files
2. **Access Control**: Limit who can import/export data
3. **Audit Trail**: Document all import/export operations
4. **GDPR Compliance**: Follow data protection regulations

## Troubleshooting

### Common Export Issues

**Problem**: Export button not working
- **Solution**: Check browser popup blocker settings
- **Solution**: Ensure you're logged in with proper permissions

**Problem**: CSV file looks corrupted
- **Solution**: Open with UTF-8 encoding
- **Solution**: Use a proper spreadsheet application

### Common Import Issues

**Problem**: "Invalid CSV format" error
- **Solution**: Use the provided template
- **Solution**: Check for extra commas or quotes
- **Solution**: Ensure UTF-8 encoding

**Problem**: "Duplicate email" errors
- **Solution**: Remove duplicates from your CSV
- **Solution**: System skips existing students automatically

**Problem**: Import seems stuck
- **Solution**: Large files may take time
- **Solution**: Check browser console for errors
- **Solution**: Try smaller batches (500 records at a time)

### Getting Help

If you encounter issues:
1. Check the error message details
2. Review this guide
3. Contact your system administrator
4. Report bugs through the support channel

## Future Enhancements

Planned import features:
- Consultation import from calendar systems
- Note import with categorization
- Alumni data import
- Integration with SIS (Student Information Systems)

---

*Last updated: August 4, 2025 - Version 0.10.0*
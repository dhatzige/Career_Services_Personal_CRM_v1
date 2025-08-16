# Career Services CRM - Testing Checklist

## Pre-Deployment Testing Guide

### 🔐 1. Authentication & Access Control

#### Master Account
- [ ] Login with master credentials (dhatzige@act.edu)
- [ ] Access all admin features
- [ ] View security audit logs

#### Invite System
- [ ] Create invitation for new admin
- [ ] Create invitation for new user
- [ ] Create invitation for viewer
- [ ] Test invitation expiry
- [ ] Revoke invitation
- [ ] View invitation statistics

#### User Registration
- [ ] Register with valid invitation token
- [ ] Try to register without token (should fail)
- [ ] Try to register with expired token (should fail)
- [ ] Email confirmation flow

#### Role-Based Access
- [ ] Master can access everything
- [ ] Admin cannot modify master
- [ ] User has limited access
- [ ] Viewer is read-only

### 👥 2. Student Management

#### CRUD Operations
- [ ] Create new student
- [ ] View student list
- [ ] Search students by name
- [ ] Filter by year/program/status
- [ ] Edit student information
- [ ] Delete student (with confirmation)

#### Student Features
- [ ] Add/remove tags
- [ ] Upload profile picture
- [ ] Add career interests
- [ ] Update job search status
- [ ] Add LinkedIn URL

### 📝 3. Notes & Consultations

#### Notes
- [ ] Add general note
- [ ] Add academic note
- [ ] Add alert note
- [ ] Mark note as private
- [ ] Edit existing note
- [ ] Delete note

#### Consultations
- [ ] Schedule new consultation
- [ ] View calendar
- [ ] Edit consultation
- [ ] Mark attendance
- [ ] Add consultation notes
- [ ] Set follow-up reminder

### 💼 4. Career Services

#### Applications
- [ ] Track new application
- [ ] Update application status
- [ ] Add interview notes
- [ ] Set follow-up dates

#### Workshops
- [ ] Record workshop attendance
- [ ] Add feedback

#### Mock Interviews
- [ ] Schedule mock interview
- [ ] Record feedback
- [ ] Rate performance

#### Documents
- [ ] Upload resume
- [ ] Review resume
- [ ] Track versions

### 📊 5. Reporting & Analytics

#### Dashboard
- [ ] View statistics
- [ ] Recent activities
- [ ] Upcoming consultations
- [ ] Pending follow-ups

#### Reports
- [ ] Generate student report
- [ ] Export to CSV
- [ ] Export to Excel
- [ ] Print report

### 📁 6. File Management

#### Uploads
- [ ] Upload student resume
- [ ] Upload profile picture
- [ ] Upload other documents
- [ ] File size limits work
- [ ] File type restrictions work

#### Security
- [ ] Users can only see their students' files
- [ ] Download permissions work
- [ ] No unauthorized access

### 🔒 7. Security Features

#### Rate Limiting
- [ ] Login attempts limited
- [ ] API calls rate limited
- [ ] Bot protection active

#### Data Security
- [ ] RLS policies enforced
- [ ] No data leakage between users
- [ ] Audit logs recording

#### Error Handling
- [ ] Graceful error messages
- [ ] No sensitive data in errors
- [ ] Proper validation messages

### 📧 8. Communications

#### Email Notifications
- [ ] Invitation emails sent
- [ ] Password reset emails
- [ ] Consultation reminders
- [ ] Follow-up reminders

### 🚀 9. Performance

#### Load Times
- [ ] Dashboard loads quickly
- [ ] Search is responsive
- [ ] File uploads smooth
- [ ] No timeout errors

#### Concurrent Users
- [ ] Multiple users can work simultaneously
- [ ] No data conflicts
- [ ] Real-time updates work

### 📱 10. Responsive Design

#### Mobile Testing
- [ ] Login works on mobile
- [ ] Navigation is usable
- [ ] Forms are accessible
- [ ] Tables are scrollable

## Testing Procedure

1. Start both frontend and backend locally
2. Clear browser cache and cookies
3. Test each section systematically
4. Document any issues found
5. Fix issues before deployment

## Known Issues to Fix

- [ ] _Add issues as you find them_

## Sign-off

- [ ] All critical features tested
- [ ] No blocking issues
- [ ] Ready for deployment

Tested by: ________________
Date: ____________________
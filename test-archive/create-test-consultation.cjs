const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function createTestConsultation() {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Get a student first
  const { data: students, error: studentError } = await supabase
    .from('students')
    .select('id, first_name, last_name')
    .limit(1);

  if (studentError || !students || students.length === 0) {
    console.error('No students found:', studentError);
    return;
  }

  const student = students[0];
  console.log('Creating consultation for:', student.first_name, student.last_name);

  // Create a consultation for tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(14, 0, 0, 0); // 2 PM tomorrow

  const { data, error } = await supabase
    .from('consultations')
    .insert({
      student_id: student.id,
      type: 'Career Counseling',
      consultation_date: tomorrow.toISOString(),
      duration: 60,
      status: 'scheduled',
      location: 'Online - Zoom',
      meeting_link: 'https://zoom.us/j/123456789',
      notes: 'Discussion about internship opportunities and resume review',
      attended: false
    })
    .select();

  if (error) {
    console.error('Error creating consultation:', error);
  } else {
    console.log('Consultation created successfully:', data);
  }

  // Create another one for next week
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(10, 30, 0, 0); // 10:30 AM next week

  const { data: data2, error: error2 } = await supabase
    .from('consultations')
    .insert({
      student_id: student.id,
      type: 'Resume Review',
      consultation_date: nextWeek.toISOString(),
      duration: 30,
      status: 'scheduled',
      location: 'Career Services Office - Room 205',
      notes: 'Review updated resume for tech internships',
      attended: false
    })
    .select();

  if (error2) {
    console.error('Error creating second consultation:', error2);
  } else {
    console.log('Second consultation created successfully:', data2);
  }
}

createTestConsultation();
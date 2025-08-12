const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkMeetings() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);
  
  // Check today's meetings
  console.log('=== TODAY\'S MEETINGS ===');
  const { data: todayMeetings, error: todayError } = await supabase
    .from('consultations')
    .select('*, students(first_name, last_name, email)')
    .gte('consultation_date', today.toISOString())
    .lt('consultation_date', tomorrow.toISOString())
    .order('consultation_date');
    
  if (todayError) {
    console.error('Error:', todayError);
  } else {
    console.log(`Found ${todayMeetings.length} meetings for today`);
    todayMeetings.forEach(meeting => {
      const date = new Date(meeting.consultation_date);
      console.log(`- ${date.toLocaleTimeString()}: ${meeting.type || 'Consultation'} with ${meeting.students?.first_name || 'Unknown'} ${meeting.students?.last_name || ''}`);
      console.log(`  Status: ${meeting.status || 'scheduled'}`);
    });
  }
  
  // Check tomorrow's meetings
  console.log('\n=== TOMORROW\'S MEETINGS ===');
  const { data: tomorrowMeetings, error: tomorrowError } = await supabase
    .from('consultations')
    .select('*, students(first_name, last_name, email)')
    .gte('consultation_date', tomorrow.toISOString())
    .lt('consultation_date', dayAfter.toISOString())
    .order('consultation_date');
    
  if (tomorrowError) {
    console.error('Error:', tomorrowError);
  } else {
    console.log(`Found ${tomorrowMeetings.length} meetings for tomorrow`);
    tomorrowMeetings.forEach(meeting => {
      const date = new Date(meeting.consultation_date);
      console.log(`- ${date.toLocaleTimeString()}: ${meeting.type || 'Consultation'} with ${meeting.students?.first_name || 'Unknown'} ${meeting.students?.last_name || ''}`);
      console.log(`  Status: ${meeting.status || 'scheduled'}`);
    });
  }
  
  // Check all upcoming meetings
  console.log('\n=== ALL UPCOMING MEETINGS ===');
  const { data: upcomingMeetings, error: upcomingError } = await supabase
    .from('consultations')
    .select('*, students(first_name, last_name, email)')
    .gte('consultation_date', new Date().toISOString())
    .order('consultation_date')
    .limit(10);
    
  if (upcomingError) {
    console.error('Error:', upcomingError);
  } else {
    console.log(`Found ${upcomingMeetings.length} upcoming meetings`);
    upcomingMeetings.forEach(meeting => {
      const date = new Date(meeting.consultation_date);
      console.log(`- ${date.toLocaleDateString()} ${date.toLocaleTimeString()}: ${meeting.type || 'Consultation'} with ${meeting.students?.first_name || 'Unknown'} ${meeting.students?.last_name || ''}`);
    });
  }
}

checkMeetings();
const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase with service role for admin operations
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Delete a note
router.delete('/notes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete using service role (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from('notes')
      .delete()
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('Error deleting note:', error);
      return res.status(500).json({ error: error.message });
    }
    
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    res.json({ success: true, deleted: data[0] });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a consultation
router.delete('/consultations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete using service role (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from('consultations')
      .delete()
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('Error deleting consultation:', error);
      return res.status(500).json({ error: error.message });
    }
    
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Consultation not found' });
    }
    
    res.json({ success: true, deleted: data[0] });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all students with their notes and consultations
router.get('/', async (req, res) => {
  try {
    const { data: students, error } = await supabaseAdmin
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a note for a student
router.post('/notes', async (req, res) => {
  try {
    const { student_id, type, content } = req.body;
    
    if (!student_id || !content) {
      return res.status(400).json({ error: 'student_id and content are required' });
    }
    
    // Create note using service role (bypasses RLS and foreign key constraints)
    const { data, error } = await supabaseAdmin
      .from('notes')
      .insert({
        student_id,
        type: 'General', // Use 'General' to satisfy check constraint
        content,
        // Don't include created_by to avoid foreign key constraint
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select();
    
    if (error) {
      console.error('Error creating note:', error);
      return res.status(500).json({ error: error.message });
    }
    
    res.json({ success: true, data: data[0] });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Clear quick note tag for a student
router.delete('/:studentId/quick-note', async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Get the most recent note for this student
    const { data: notes, error: fetchError } = await supabaseAdmin
      .from('notes')
      .select('id')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (fetchError) {
      console.error('Error fetching note:', fetchError);
      return res.status(500).json({ error: fetchError.message });
    }
    
    if (notes && notes.length > 0) {
      // Delete the most recent note
      const { error: deleteError } = await supabaseAdmin
        .from('notes')
        .delete()
        .eq('id', notes[0].id);
      
      if (deleteError) {
        console.error('Error deleting note:', deleteError);
        return res.status(500).json({ error: deleteError.message });
      }
    }
    
    res.json({ success: true, message: 'Quick note tag cleared' });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
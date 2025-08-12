import { Request, Response } from 'express';
import { NoteModel } from '../models/Note';

export const getNotesForStudent = async (req: Request, res: Response) => {
  try {
    const notes = await NoteModel.findByStudentId(req.params.studentId);
    res.json(notes);
    return;
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notes' });
    return;
  }
};

export const getNoteById = async (req: Request, res: Response) => {
  try {
    const note = await NoteModel.findById(req.params.id);
    if (!note) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }
    res.json(note);
    return;
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch note' });
    return;
  }
};

export const createNoteForStudent = async (req: Request, res: Response) => {
  try {
    const note = await NoteModel.create(req.params.studentId, req.body);
    res.status(201).json(note);
    return;
  } catch (err) {
    console.error('Error creating note:', err);
    res.status(400).json({ 
      success: false,
      message: 'Failed to create note',
      error: {
        details: err instanceof Error ? err.message : 'Unknown error'
      }
    });
    return;
  }
};

export const updateNote = async (req: Request, res: Response) => {
  try {
    const updated = await NoteModel.update(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }
    res.json(updated);
    return;
  } catch (err) {
    res.status(400).json({ error: 'Failed to update note' });
    return;
  }
};

export const deleteNote = async (req: Request, res: Response) => {
  try {
    const deleted = await NoteModel.delete(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }
    res.json({ message: 'Note deleted' });
    return;
  } catch (err) {
    res.status(400).json({ error: 'Failed to delete note' });
    return;
  }
}; 
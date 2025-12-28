import { useState, useEffect, useCallback } from 'react';
import { noteService } from '../services/database';
import type { Note, EntityType } from '../types';

export const useNotes = (entityType?: EntityType, entityId?: string) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data: Note[];
      if (entityType && entityId) {
        data = await noteService.getByEntity(entityType, entityId);
      } else {
        data = await noteService.getAll();
      }
      setNotes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const createNote = async (
    content: string,
    noteEntityType: EntityType,
    noteEntityId?: string
  ): Promise<Note | null> => {
    try {
      const note = await noteService.create({
        entity_type: noteEntityType,
        entity_id: noteEntityId,
        content,
        is_pinned: false,
      });
      if (note) {
        setNotes(prev => [note, ...prev]);
      }
      return note;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create note');
      return null;
    }
  };

  const updateNote = async (id: string, content: string): Promise<boolean> => {
    try {
      const updated = await noteService.update(id, { content });
      if (updated) {
        setNotes(prev => prev.map(n => (n.id === id ? updated : n)));
        return true;
      }
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update note');
      return false;
    }
  };

  const togglePin = async (id: string): Promise<boolean> => {
    try {
      const note = notes.find(n => n.id === id);
      if (!note) return false;

      const updated = await noteService.update(id, { is_pinned: !note.is_pinned });
      if (updated) {
        setNotes(prev => prev.map(n => (n.id === id ? updated : n)));
        return true;
      }
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle pin');
      return false;
    }
  };

  const deleteNote = async (id: string): Promise<boolean> => {
    try {
      const success = await noteService.delete(id);
      if (success) {
        setNotes(prev => prev.filter(n => n.id !== id));
        return true;
      }
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete note');
      return false;
    }
  };

  return {
    notes,
    loading,
    error,
    createNote,
    updateNote,
    togglePin,
    deleteNote,
    refresh: loadNotes,
  };
};


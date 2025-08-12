import React, { useState, useEffect } from 'react';
import { Tag, Plus, X, Edit2, Trash2, Palette } from 'lucide-react';

export interface StudentTag {
  id: string;
  name: string;
  color: string;
  description?: string;
  createdAt: string;
  usageCount: number;
}

interface TagsManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onTagsUpdated: () => void;
}

const predefinedColors = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
];

const TagsManager: React.FC<TagsManagerProps> = ({ isOpen, onClose, onTagsUpdated }) => {
  const [tags, setTags] = useState<StudentTag[]>([]);
  const [newTag, setNewTag] = useState({ name: '', color: predefinedColors[0], description: '' });
  const [editingTag, setEditingTag] = useState<StudentTag | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadTags();
    }
  }, [isOpen]);

  const loadTags = () => {
    const stored = localStorage.getItem('student_tags');
    if (stored) {
      try {
        setTags(JSON.parse(stored));
      } catch {
        setTags([]);
      }
    }
  };

  const saveTags = (updatedTags: StudentTag[]) => {
    localStorage.setItem('student_tags', JSON.stringify(updatedTags));
    setTags(updatedTags);
    onTagsUpdated();
  };

  const addTag = () => {
    if (!newTag.name.trim()) return;

    const tag: StudentTag = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      name: newTag.name.trim(),
      color: newTag.color,
      description: newTag.description.trim(),
      createdAt: new Date().toISOString(),
      usageCount: 0
    };

    saveTags([...tags, tag]);
    setNewTag({ name: '', color: predefinedColors[0], description: '' });
  };

  const updateTag = () => {
    if (!editingTag || !editingTag.name.trim()) return;

    const updatedTags = tags.map(tag =>
      tag.id === editingTag.id ? editingTag : tag
    );

    saveTags(updatedTags);
    setEditingTag(null);
  };

  const deleteTag = (tagId: string) => {
    if (window.confirm('Are you sure you want to delete this tag?')) {
      const updatedTags = tags.filter(tag => tag.id !== tagId);
      saveTags(updatedTags);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <Tag className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Manage Tags
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6">
            {/* Add New Tag */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Add New Tag
              </h4>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Tag name"
                    value={newTag.name}
                    onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <div className="flex items-center space-x-2">
                    <Palette className="h-4 w-4 text-gray-500" />
                    <div className="flex space-x-1">
                      {predefinedColors.map(color => (
                        <button
                          key={color}
                          onClick={() => setNewTag({ ...newTag, color })}
                          className={`w-6 h-6 rounded-full border-2 ${
                            newTag.color === color ? 'border-gray-900 dark:border-white' : 'border-gray-300 dark:border-gray-600'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={newTag.description}
                  onChange={(e) => setNewTag({ ...newTag, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                <button
                  onClick={addTag}
                  disabled={!newTag.name.trim()}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tag
                </button>
              </div>
            </div>

            {/* Existing Tags */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                Existing Tags ({tags.length})
              </h4>
              
              {tags.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No tags created yet
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {tags.map(tag => (
                    <div
                      key={tag.id}
                      className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      {editingTag?.id === tag.id ? (
                        <div className="flex-1 grid grid-cols-3 gap-2">
                          <input
                            type="text"
                            value={editingTag.name}
                            onChange={(e) => setEditingTag({ ...editingTag, name: e.target.value })}
                            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                          <input
                            type="text"
                            value={editingTag.description || ''}
                            onChange={(e) => setEditingTag({ ...editingTag, description: e.target.value })}
                            placeholder="Description"
                            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                          <div className="flex items-center space-x-1">
                            {predefinedColors.map(color => (
                              <button
                                key={color}
                                onClick={() => setEditingTag({ ...editingTag, color })}
                                className={`w-4 h-4 rounded-full border ${
                                  editingTag.color === color ? 'border-gray-900 dark:border-white' : 'border-gray-300 dark:border-gray-600'
                                }`}
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-3 flex-1">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: tag.color }}
                          />
                          <div>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {tag.name}
                            </span>
                            {tag.description && (
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {tag.description}
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Used {tag.usageCount} times
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-2">
                        {editingTag?.id === tag.id ? (
                          <>
                            <button
                              onClick={updateTag}
                              className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setEditingTag(null)}
                              className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setEditingTag(tag)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteTag(tag.id)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TagsManager;
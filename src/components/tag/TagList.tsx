import { useState, useEffect, useCallback } from 'react';
import { Tag } from '@/lib/types';
import { TagService } from '@/lib/services/tagService';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface TagListProps {
  selectedTags: string[];
  onTagSelect: (tagId: string) => void;
}

export function TagList({ selectedTags, onTagSelect }: TagListProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const loadTags = useCallback(async () => {
    try {
      setLoading(true);
      const allTags = await TagService.getAllTags();
      setTags(allTags);
    } catch (err) {
      console.error('Failed to load tags:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tags');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTags();
  }, [loadTags]);

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    try {
      const newTag = await TagService.createTag(newTagName);
      setTags(prev => [...prev, newTag]);
      setNewTagName('');
      setIsCreating(false);
    } catch (error) {
      console.error('Failed to create tag:', error);
    }
  };

  const handleUpdateTag = async () => {
    if (!editingTag || !newTagName.trim()) return;

    try {
      const updatedTag = await TagService.updateTag(editingTag.id, { name: newTagName });
      setTags(prev => prev.map(t => t.id === updatedTag.id ? updatedTag : t));
      setEditingTag(null);
      setNewTagName('');
    } catch (error) {
      console.error('Failed to update tag:', error);
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    if (!confirm('Are you sure you want to delete this tag?')) return;

    try {
      await TagService.deleteTag(tagId);
      setTags(prev => prev.filter(t => t.id !== tagId));
    } catch (error) {
      console.error('Failed to delete tag:', error);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between px-2 py-1 mb-2">
        <h3 className="text-sm font-medium text-gray-900">Tags</h3>
        <button
          onClick={() => {
            setIsCreating(true);
            setNewTagName('');
          }}
          className="p-1 hover:bg-gray-200 rounded"
        >
          <PlusIcon className="w-4 h-4" />
        </button>
      </div>
      {loading ? (
        <div className="px-2 py-4 text-center">
          <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em]" />
          <p className="mt-2 text-sm text-gray-500">Loading tags...</p>
        </div>
      ) : error ? (
        <div className="px-2 py-4 text-center">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      ) : (
        <>
          {isCreating && (
            <div className="px-2 py-1">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
                placeholder="New tag name"
                className="w-full px-2 py-1 text-sm border rounded"
                autoFocus
              />
            </div>
          )}
          <div className="space-y-1">
            {tags.map(tag => (
              <div
                key={tag.id}
                className={`flex items-center gap-1 px-2 py-1 rounded-md cursor-pointer hover:bg-gray-100 ${
                  selectedTags.includes(tag.id) ? 'bg-gray-100' : ''
                }`}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: tag.color || '#6B7280' }}
                />
                {editingTag?.id === tag.id ? (
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdateTag()}
                    className="flex-1 px-2 py-1 text-sm border rounded"
                    autoFocus
                  />
                ) : (
                  <span
                    className="flex-1 text-sm"
                    onClick={() => onTagSelect(tag.id)}
                  >
                    {tag.name}
                  </span>
                )}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingTag(tag);
                      setNewTagName(tag.name);
                    }}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTag(tag.id)}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
} 
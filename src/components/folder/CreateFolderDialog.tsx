'use client';

import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Folder } from '@/lib/types';

interface CreateFolderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  parentId: string | null;
  onSubmit: (name: string, parentId: string | null) => Promise<Folder | void>;
}

export function CreateFolderDialog({
  isOpen,
  onClose,
  parentId,
  onSubmit,
}: CreateFolderDialogProps) {
  const [folderName, setFolderName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit(folderName.trim(), parentId);
      setFolderName('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create folder');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-50"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      {/* Full-screen container */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold text-gray-900">
              Create New Folder
            </Dialog.Title>
            <button
              onClick={onClose}
              className="rounded-md p-1 text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4">
            <div>
              <label
                htmlFor="folderName"
                className="block text-sm font-medium text-gray-700"
              >
                Folder Name
              </label>
              <input
                type="text"
                id="folderName"
                name="folderName"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Enter folder name"
                autoFocus
                disabled={isSubmitting}
              />
            </div>

            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}

            <div className="mt-4 flex justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 
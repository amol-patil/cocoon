'use client';

import { ReactNode, useState } from 'react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

interface DocumentLayoutProps {
  children: ReactNode;
}

export default function DocumentLayout({ children }: DocumentLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-full">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white transition duration-200 ease-in-out md:relative md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          <h2 className="text-lg font-semibold">Documents</h2>
          <button
            type="button"
            className="md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <nav className="mt-4 space-y-4 px-4">
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-gray-500">Folders</h3>
            {/* Folder tree will go here */}
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-gray-500">Tags</h3>
            {/* Tag list will go here */}
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1">
        <div className="sticky top-0 z-10 border-b bg-white md:hidden">
          <button
            type="button"
            className="px-4 py-5"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
        </div>
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
} 
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Fuse from 'fuse.js';

// --- Types ---
interface DocumentField { [key: string]: string | undefined }
interface Document {
  id: string;
  type: string;
  defaultField: string;
  fields: DocumentField;
  fileLink: string;
}

// --- Initial Data ---
// Removed - will be loaded via IPC
// const initialMockDocuments: Document[] = [ ... ];

// --- Fuse.js Setup ---
const fuseOptions = {
  includeScore: true,
  keys: [
    'type',
    'fields.number',
    'fields.expires',
    'fields.issued',
    'fields.state',
    'fields.country',
    'fields.provider',
    'fields.policyNumber',
    'fields.groupNumber'
  ]
};

// --- Helper Components ---

// ExpandedCard (from previous step - slightly modified for clarity)
interface ExpandedCardProps {
  doc: Document;
  onCollapse: () => void;
  onCopy: (text: string) => void;
  onOpenFile: (link: string) => void;
}
function ExpandedCard({ doc, onCollapse, onCopy, onOpenFile }: ExpandedCardProps) {
  return (
    <div className="p-4 bg-white/10 rounded-lg absolute inset-0 overflow-y-auto">
      <button
        onClick={onCollapse}
        className="absolute top-2 right-2 text-gray-400 hover:text-white focus:outline-none"
        aria-label="Close details"
      >
        ✕
      </button>
      <h3 className="text-lg font-semibold mb-3">{doc.type}</h3>
      <ul className="space-y-2">
        {Object.entries(doc.fields).map(([key, value]) => (
          value && (
            <li key={key} className="flex justify-between items-center group">
              <span className="text-sm font-medium text-gray-300 capitalize">{key}:</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-white truncate max-w-xs">{value}</span>
                <button
                  onClick={() => onCopy(value)}
                  className="text-gray-400 hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none"
                  aria-label={`Copy ${key}`}
                >
                  📋
                </button>
              </div>
            </li>
          )
        ))}
        {doc.fileLink && (
          <li className="pt-3 mt-3 border-t border-white/20">
             <button
                onClick={() => onOpenFile(doc.fileLink)}
                className="w-full text-left text-blue-400 hover:text-blue-300 focus:outline-none flex items-center"
             >
               <span className="mr-2">📁</span> Open Linked File
             </button>
          </li>
        )}
      </ul>
       <button
          onClick={onCollapse}
          className="mt-4 text-sm text-gray-400 hover:text-white focus:outline-none"
        >
          ← Back to results
        </button>
    </div>
  );
}

// Placeholder for Manage Documents View
interface ManageDocumentsViewProps {
  documents: Document[];
  onAdd: () => void;
  onEdit: (doc: Document) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}
function ManageDocumentsView({ documents, onAdd, onEdit, onDelete, onBack }: ManageDocumentsViewProps) {
  return (
    <div className="p-4 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Manage Documents</h2>
        <button onClick={onBack} className="text-sm text-blue-400 hover:text-blue-300 focus:outline-none">← Back to Search</button>
      </div>
      <div className="flex-grow overflow-y-auto mb-4">
        {documents.length === 0 ? (
          <p className="text-gray-500 text-center mt-4">No documents saved yet.</p>
        ) : (
          <ul className="space-y-2">
            {documents.map(doc => (
              <li key={doc.id} className="p-3 bg-white/5 rounded flex justify-between items-center">
                <span className="font-medium truncate mr-4">{doc.type}</span>
                <div className="space-x-2 flex-shrink-0">
                  <button onClick={() => onEdit(doc)} className="text-xs px-2 py-1 bg-blue-600/50 hover:bg-blue-600 rounded">Edit</button>
                  <button onClick={() => onDelete(doc.id)} className="text-xs px-2 py-1 bg-red-600/50 hover:bg-red-600 rounded">Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <button
        onClick={onAdd}
        className="w-full py-2 px-4 bg-green-600 hover:bg-green-500 rounded text-white font-semibold focus:outline-none focus:ring-2 focus:ring-green-400"
      >
        + Add New Document
      </button>
    </div>
  );
}

// Document Form Component
interface DocumentFormProps {
    documentToEdit: Document | null;
    onSave: (docData: Omit<Document, 'id'> & { id?: string }) => void;
    onCancel: () => void;
}

function DocumentForm({ documentToEdit, onSave, onCancel }: DocumentFormProps) {
    const [docType, setDocType] = useState(documentToEdit?.type || '');
    const [defaultFieldKey, setDefaultFieldKey] = useState(documentToEdit?.defaultField || '');
    const [fileLink, setFileLink] = useState(documentToEdit?.fileLink || '');
    const [fields, setFields] = useState<Array<{ key: string; value: string }>>(() =>
        documentToEdit
            ? Object.entries(documentToEdit.fields).filter(([, v]) => v).map(([k, v]) => ({ key: k, value: v! }))
            : [{ key: '', value: '' }]
    );

    const handleFieldChange = (index: number, type: 'key' | 'value', newValue: string) => {
        const updatedFields = fields.map((field, i) => i === index ? { ...field, [type]: newValue } : field);
        setFields(updatedFields);
        if (type === 'key' && fields[index].key === defaultFieldKey) { setDefaultFieldKey(newValue); }
    };
    const handleAddField = () => { setFields([...fields, { key: '', value: '' }]); };
    const handleRemoveField = (index: number) => {
        if (fields[index].key === defaultFieldKey) { setDefaultFieldKey(''); }
        setFields(fields.filter((_, i) => i !== index));
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (!docType.trim()) { alert('Document Type cannot be empty.'); return; }
        const finalFields: DocumentField = {};
        let defaultFieldExists = false;
        for (const field of fields) {
            const key = field.key.trim();
            const value = field.value.trim();
            if (key) {
                finalFields[key] = value;
                if (key === defaultFieldKey.trim()) { defaultFieldExists = true; }
            }
        }
        const finalDefaultField = defaultFieldKey.trim();
        if (finalDefaultField && !defaultFieldExists) {
             alert(`Default field '${finalDefaultField}' not found or invalid. Select a valid field.`);
             return;
        }
        const docDataToSave: Omit<Document, 'id'> & { id?: string } = {
            type: docType.trim(),
            defaultField: finalDefaultField,
            fields: finalFields,
            fileLink: fileLink.trim(),
        };
        if (documentToEdit) { docDataToSave.id = documentToEdit.id; }
        onSave(docDataToSave);
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 absolute inset-0 bg-gradient-to-b from-gray-800 via-gray-900 to-black overflow-y-auto flex flex-col text-sm">
            <div className="flex justify-between items-center mb-4">
                 <h2 className="text-xl font-semibold">
                     {documentToEdit ? 'Edit Document' : 'Add New Document'}
                 </h2>
                 <button type="button" onClick={onCancel} className="text-gray-400 hover:text-white" aria-label="Cancel">✕</button>
            </div>

            {/* --- Core Fields --- */}
            <div className="mb-4">
                <label htmlFor="docType" className="block text-gray-300 mb-1 font-medium">Document Type</label>
                <input id="docType" type="text" value={docType} onChange={(e) => setDocType(e.target.value)} placeholder="e.g., Driver's License, Passport" required className="w-full p-2 bg-white/10 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="mb-4">
                <label htmlFor="defaultFieldKey" className="block text-gray-300 mb-1 font-medium">Default Field Key (for Enter key)</label>
                <select id="defaultFieldKey" value={defaultFieldKey} onChange={(e) => setDefaultFieldKey(e.target.value)} className="w-full p-2 bg-white/10 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none" style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em` }} >
                    <option value="">-- Select Default Field --</option>
                    {fields.map((field, index) => ( field.key.trim() && <option key={`${field.key}-${index}`} value={field.key.trim()}>{field.key.trim()}</option> ))}
                </select>
                 <p className="text-xs text-gray-500 mt-1">Which field value should be copied when pressing Enter in search?</p>
            </div>

            <div className="mb-4">
                <label htmlFor="fileLink" className="block text-gray-300 mb-1 font-medium">File Link (Optional)</label>
                <input id="fileLink" type="url" value={fileLink} onChange={(e) => setFileLink(e.target.value)} placeholder="https://drive.google.com/file/d/..." className="w-full p-2 bg-white/10 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            {/* --- Dynamic Fields --- */}
            <div className="mb-4 flex-grow">
                <h3 className="text-gray-300 mb-2 font-medium">Fields</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {fields.map((field, index) => (
                        <div key={index} className="flex items-center space-x-2 bg-white/5 p-2 rounded">
                            <input type="text" value={field.key} onChange={(e) => handleFieldChange(index, 'key', e.target.value)} placeholder="Field Key (e.g., number)" className="flex-1 p-1 bg-white/10 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs" />
                            <span className="text-gray-500">:</span>
                            <input type="text" value={field.value} onChange={(e) => handleFieldChange(index, 'value', e.target.value)} placeholder="Field Value" className="flex-1 p-1 bg-white/10 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs" />
                            <button type="button" onClick={() => handleRemoveField(index)} className="p-1 text-red-500 hover:text-red-400 focus:outline-none rounded-full hover:bg-red-500/20" aria-label="Remove field" disabled={fields.length <= 1} >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </button>
                        </div>
                    ))}
                </div>
                <button type="button" onClick={handleAddField} className="mt-2 text-xs text-blue-400 hover:text-blue-300 focus:outline-none flex items-center" >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Add Field
                </button>
            </div>

            {/* --- Actions --- */}
            <div className="mt-auto pt-4 border-t border-white/10 flex justify-end space-x-3">
                <button type="button" onClick={onCancel} className="py-2 px-4 rounded bg-gray-600 hover:bg-gray-500 text-white text-sm">Cancel</button>
                <button type="submit" className="py-2 px-4 rounded bg-blue-600 hover:bg-blue-500 text-white text-sm">Save Document</button>
            </div>
        </form>
    );
}

// --- Main App Component ---

type ViewMode = 'search' | 'manage' | 'editForm';

function App() {
  // === State ===
  const [documents, setDocuments] = useState<Document[]>([]); // Initialize empty, load from IPC
  const [isLoading, setIsLoading] = useState(true); // Loading state
  const [error, setError] = useState<string | null>(null); // Error state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('search');
  const [docToEdit, setDocToEdit] = useState<Document | null>(null);

  // Re-initialize Fuse when documents change
  const fuse = useMemo(() => new Fuse(documents, fuseOptions), [documents]);

  // === Data Loading Effect ===
  useEffect(() => {
    console.log('Requesting documents from main process...');
    setIsLoading(true);
    window.ipc.invoke('load-documents') // Use invoke for handle
      .then((loadedDocs: Document[]) => {
        console.log(`Received ${loadedDocs.length} documents.`);
        setDocuments(loadedDocs);
        setError(null);
      })
      .catch((err: Error) => {
        console.error('Error loading documents via IPC:', err);
        setError('Failed to load documents. Please restart the application or check logs.');
        setDocuments([]); // Set empty on error
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []); // Run only once on mount

  // === Search Logic ===
  const searchResults = useMemo(() => {
    if (viewMode !== 'search' || !searchTerm) { return []; }
    return fuse.search<Document>(searchTerm);
  }, [searchTerm, fuse, viewMode]);

  const expandedDoc = useMemo(() => {
      if (!expandedDocId) return null;
      return documents.find(doc => doc.id === expandedDocId) || null;
  }, [expandedDocId, documents]);

  useEffect(() => {
    if (viewMode === 'search') { setSelectedIndex(0); setExpandedDocId(null); }
  }, [searchTerm, viewMode]);

  // === Document CRUD Handlers (Now use IPC) ===
  const handleAddDocument = () => {
    setDocToEdit(null);
    setViewMode('editForm');
  };
  const handleEditDocument = (doc: Document) => {
     setDocToEdit(doc);
     setViewMode('editForm');
  };

  // Helper function to save documents via IPC
  const saveDocumentsIPC = useCallback(async (updatedDocs: Document[]) => {
      try {
          console.log('Sending save-documents request via IPC...');
          const result = await window.ipc.invoke('save-documents', updatedDocs);
          if (!result?.success) {
              console.error('Failed to save documents via IPC:', result?.error);
              setError('Failed to save documents. Changes might not persist.');
              // Optionally revert state? Or just show error?
          } else {
              console.log('Documents saved successfully via IPC.');
              setError(null); // Clear error on success
          }
      } catch (ipcError) {
          console.error('Error sending save-documents IPC message:', ipcError);
          setError('An error occurred while trying to save documents.');
      }
  }, []);

  const handleDeleteDocument = useCallback(async (id: string) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
        const updatedDocs = documents.filter(doc => doc.id !== id);
        setDocuments(updatedDocs); // Optimistic update
        await saveDocumentsIPC(updatedDocs); // Persist change
    }
  }, [documents, saveDocumentsIPC]);

  const handleSaveDocument = useCallback(async (docData: Omit<Document, 'id'> & { id?: string }) => {
     console.log("Saving document (renderer):", docData);
     let updatedDocs: Document[];
     if (docData.id) { // Update existing
        updatedDocs = documents.map(doc => doc.id === docData.id ? { ...docData, id: docData.id! } as Document : doc);
     } else { // Add new
        const newDoc: Document = {
            ...docData,
            id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
        };
        updatedDocs = [...documents, newDoc];
     }
     setDocuments(updatedDocs); // Optimistic update
     setViewMode('manage');
     setDocToEdit(null);
     await saveDocumentsIPC(updatedDocs); // Persist change
  }, [documents, saveDocumentsIPC]);

  const handleCancelEdit = () => {
     setViewMode('manage');
     setDocToEdit(null);
  };

  // === Other Handlers ===
  const handleCopy = useCallback((text: string) => {
    try { window.electronClipboard.writeText(text); console.log(`Copied: ${text}`); } catch (error) { console.error("Failed to copy text:", error); }
  }, []);

  // Use IPC to open link
  const handleOpenFile = useCallback((link: string) => {
    console.log("Attempting to open file link via IPC:", link);
    window.ipc.send('open-external-link', link);
  }, []);

  // === Keyboard Handler ===
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    // Handle keys differently based on view mode
    if (viewMode === 'search') {
        // --- Search Mode Key Handling ---
        if (expandedDocId) {
            // Expanded View Active
            if (event.key === 'Escape' || event.key === 'ArrowLeft') {
                event.preventDefault();
                setExpandedDocId(null); // Collapse
            }
            // Add other keybinds for expanded view if needed (e.g., copy fields)
        } else {
            // List View Active
            if (searchResults.length === 0) return;
            switch (event.key) {
                case 'ArrowDown':
                    event.preventDefault();
                    setSelectedIndex(prev => Math.min(prev + 1, searchResults.length - 1));
                    break;
                case 'ArrowUp':
                    event.preventDefault();
                    setSelectedIndex(prev => Math.max(prev - 1, 0));
                    break;
                case 'ArrowRight':
                    event.preventDefault();
                    if (searchResults[selectedIndex]) {
                        setExpandedDocId(searchResults[selectedIndex].item.id); // Expand
                    }
                    break;
                case 'Enter':
                    event.preventDefault();
                    if (searchResults[selectedIndex]) {
                        const item = searchResults[selectedIndex].item;
                        const value = item.fields[item.defaultField];
                        if (value) handleCopy(value);
                        else console.log(`Default field '${item.defaultField}' not found.`);
                    }
                    break;
                // Add Shift+Number handlers here later if desired
            }
        }
    } else if (viewMode === 'manage') {
        // TODO: Add keyboard navigation for manage view? (e.g., focus buttons)
    } else if (viewMode === 'editForm') {
        // Prevent Enter from submitting forms accidentally if needed, or handle Escape key
        if (event.key === 'Escape') {
            handleCancelEdit();
        }
    }
  }, [viewMode, searchResults, selectedIndex, expandedDocId, handleCopy, handleCancelEdit]); // Dependencies

  // === Render Logic ===
  const renderContent = () => {
      // Display loading indicator
     if (isLoading) {
         return <div className="flex items-center justify-center h-full"><p className="text-gray-400">Loading documents...</p></div>;
     }
     // Display error message
     if (error) {
         return <div className="flex items-center justify-center h-full p-4"><p className="text-red-400 text-center"><strong className="block mb-2">Error:</strong> {error}</p></div>;
     }

     // Render based on viewMode
     switch (viewMode) {
        case 'manage':
            return (
                <ManageDocumentsView
                    documents={documents}
                    onAdd={handleAddDocument}
                    onEdit={handleEditDocument}
                    onDelete={handleDeleteDocument}
                    onBack={() => setViewMode('search')}
                />
            );
        case 'editForm':
            return (
                <DocumentForm
                    documentToEdit={docToEdit}
                    onSave={handleSaveDocument}
                    onCancel={handleCancelEdit}
                />
            );
        case 'search':
        default:
            if (expandedDoc) {
                return (
                    <ExpandedCard
                        doc={expandedDoc}
                        onCollapse={() => setExpandedDocId(null)}
                        onCopy={handleCopy}
                        onOpenFile={handleOpenFile}
                    />
                );
            } else {
                return (
                    <React.Fragment>
                        <div className="flex items-center mb-4">
                            <input
                                type="text"
                                placeholder="Search your documents..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="flex-grow w-full px-4 py-2 text-lg text-white bg-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                                autoFocus
                            />
                            <button
                                onClick={() => setViewMode('manage')}
                                className="ml-2 p-2 text-gray-400 hover:text-white bg-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                aria-label="Manage Documents"
                            >
                                ⚙️
                            </button>
                        </div>
                        <div className="flex-grow overflow-y-auto">
                            {!searchTerm && <p className="text-gray-500 text-center mt-4">Start typing to search...</p>}
                            {searchTerm && searchResults.length === 0 && <p className="text-gray-500 text-center mt-4">No results found for "{searchTerm}"</p>}
                            {searchTerm && searchResults.length > 0 && (
                                <ul>
                                    {searchResults.map(({ item }, index) => (
                                        <li
                                            key={item.id}
                                            className={`p-3 mb-1 rounded cursor-pointer transition-colors duration-100 ease-in-out ${
                                                index === selectedIndex
                                                    ? 'bg-blue-600/60 ring-1 ring-blue-400'
                                                    : 'hover:bg-white/10'
                                            }`}
                                            onClick={() => setExpandedDocId(item.id)}
                                            onMouseEnter={() => setSelectedIndex(index)}
                                        >
                                            <p className="font-semibold truncate">{item.type}</p>
                                            <p className="text-sm text-gray-300 truncate">
                                                {item.fields[item.defaultField] || 'No default value'}
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </React.Fragment>
                );
            }
     }
  };

  return (
    <div className="flex flex-col h-screen p-4 bg-gradient-to-r from-blue-950 via-purple-950 to-indigo-950 text-white rounded-lg shadow-xl overflow-hidden relative">
       {renderContent()}
    </div>
  );
}

export default App;

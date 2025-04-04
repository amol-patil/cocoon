import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Fuse from 'fuse.js';

// --- Types ---
interface DocumentField { [key: string]: string | undefined }
interface Document {
  id: string;
  type: string;
  owner?: string;
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
    <div className="p-4 bg-white/10 rounded-lg absolute inset-0 overflow-y-auto [-webkit-app-region:no-drag]">
      <button
        onClick={onCollapse}
        className="absolute top-2 right-2 text-gray-400 hover:text-white focus:outline-none [-webkit-app-region:no-drag]"
        aria-label="Close details"
      >
        ✕
      </button>
      <h3 className="text-lg font-semibold mb-1">
        {doc.type}
        {doc.owner && <span className="text-sm text-gray-400 ml-2">({doc.owner})</span>}
      </h3>
      <ul className="space-y-2 mt-3">
        {Object.entries(doc.fields).map(([key, value]) => (
          value && (
            <li key={key} className="flex justify-between items-center group">
              <span className="text-sm font-medium text-gray-300 capitalize">{key}:</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-white truncate max-w-xs">{value}</span>
                <button
                  onClick={() => onCopy(value)}
                  className="text-gray-400 hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none [-webkit-app-region:no-drag]"
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
                className="w-full text-left text-blue-400 hover:text-blue-300 focus:outline-none flex items-center [-webkit-app-region:no-drag]"
             >
               <span className="mr-2">📁</span> Open Linked File
             </button>
          </li>
        )}
      </ul>
       <button
          onClick={onCollapse}
          className="mt-4 text-sm text-gray-400 hover:text-white focus:outline-none [-webkit-app-region:no-drag]"
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
    <div className="p-4 flex flex-col h-full [-webkit-app-region:no-drag]">
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
                <span className="font-medium truncate mr-4">
                  {doc.type}
                  {doc.owner && <span className="text-xs text-gray-400 ml-2">({doc.owner})</span>}
                </span>
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
    documentToEdit: (Omit<Document, 'id'> & { id?: string }) | null;
    onSave: (docData: Omit<Document, 'id'> & { id?: string }) => void;
    onCancel: () => void;
}

function DocumentForm({ documentToEdit, onSave, onCancel }: DocumentFormProps) {
    const [type, setType] = useState('');
    const [owner, setOwner] = useState('');
    const [defaultField, setDefaultField] = useState('');
    const [fileLink, setFileLink] = useState('');
    const [fields, setFields] = useState<{ key: string; value: string }[]>([{ key: '', value: '' }]);

    useEffect(() => {
        if (documentToEdit) {
            setType(documentToEdit.type || '');
            setOwner(documentToEdit.owner || '');
            setDefaultField(documentToEdit.defaultField || '');
            setFileLink(documentToEdit.fileLink || '');
            setFields(Object.entries(documentToEdit.fields || {}).map(([key, value]) => ({ key, value: value || '' })));
        } else {
            setType('');
            setOwner('');
            setDefaultField('');
            setFileLink('');
            setFields([{ key: '', value: '' }]);
        }
    }, [documentToEdit]);

    const handleFieldChange = (index: number, field: 'key' | 'value', value: string) => {
        const newFields = [...fields];
        newFields[index][field] = value;
        setFields(newFields);
    };

    const addField = () => {
        setFields([...fields, { key: '', value: '' }]);
    };

    const removeField = (index: number) => {
        const newFields = fields.filter((_, i) => i !== index);
        setFields(newFields);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const fieldsObject = fields.reduce((acc, field) => {
            if (field.key) {
                acc[field.key] = field.value;
            }
            return acc;
        }, {} as DocumentField);

        const docData = {
            id: documentToEdit?.id,
            type,
            owner: owner.trim() || undefined,
            defaultField,
            fileLink,
            fields: fieldsObject,
        };
        onSave(docData);
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 space-y-4 flex flex-col h-full">
            <h2 className="text-xl font-semibold mb-4 flex-shrink-0">
                {documentToEdit ? 'Edit Document' : 'Add New Document'}
            </h2>

            <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-1">Type</label>
                        <input
                            id="type"
                            type="text"
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="w-full px-3 py-2 text-white bg-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="owner" className="block text-sm font-medium text-gray-300 mb-1">Owner (Optional)</label>
                        <input
                            id="owner"
                            type="text"
                            placeholder="e.g., Alice, Bob, Personal"
                            value={owner}
                            onChange={(e) => setOwner(e.target.value)}
                            className="w-full px-3 py-2 text-white bg-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="defaultField" className="block text-sm font-medium text-gray-300 mb-1">Default Field Key</label>
                    <select
                        id="defaultField"
                        value={defaultField}
                        onChange={(e) => setDefaultField(e.target.value)}
                        className="w-full px-3 py-2 text-white bg-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em` }}
                        required
                    >
                        <option value="">-- Select Default Field --</option>
                        {fields.map((field, index) => (
                            field.key.trim() && (
                                <option key={`${field.key}-${index}`} value={field.key.trim()}>
                                    {field.key.trim()}
                                </option>
                            )
                        ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Which field value should be copied when pressing Enter?</p>
                </div>

                <div>
                    <label htmlFor="fileLink" className="block text-sm font-medium text-gray-300 mb-1">Google Drive Link (Optional)</label>
                    <input
                        id="fileLink"
                        type="url"
                        placeholder="https://drive.google.com/file/d/..."
                        value={fileLink}
                        onChange={(e) => setFileLink(e.target.value)}
                        className="w-full px-3 py-2 text-white bg-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <h3 className="text-lg font-medium text-gray-200 pt-2">Fields</h3>
                {fields.map((field, index) => (
                    <div key={index} className="flex items-center space-x-2">
                        <input
                            type="text"
                            placeholder="Field Key (e.g., Expiration)"
                            value={field.key}
                            onChange={(e) => handleFieldChange(index, 'key', e.target.value)}
                            className="flex-1 px-3 py-2 text-white bg-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                            type="text"
                            placeholder="Field Value"
                            value={field.value}
                            onChange={(e) => handleFieldChange(index, 'value', e.target.value)}
                            className="flex-1 px-3 py-2 text-white bg-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            type="button"
                            onClick={() => removeField(index)}
                            className="p-2 text-red-400 hover:text-red-300 bg-white/10 rounded-md focus:outline-none"
                            aria-label="Remove field"
                        >
                            🗑️
                        </button>
                    </div>
                ))}
                <button
                    type="button"
                    onClick={addField}
                    className="text-sm text-blue-400 hover:text-blue-300 focus:outline-none"
                >
                    + Add Field
                </button>
            </div>

            <div className="flex justify-end space-x-3 pt-4 flex-shrink-0">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-gray-300 bg-white/10 rounded-md hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {documentToEdit ? 'Save Changes' : 'Add Document'}
                </button>
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
    window.ipc.invoke<Document[]>('load-documents')
      .then((loadedDocs) => {
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

    let finalSearchTerm = searchTerm;
    let targetOwner: string | null = null;
    const ownerMatch = searchTerm.match(/(\s|^)@(\w+)(\s|$)/);

    let documentsToSearch = documents;

    if (ownerMatch && ownerMatch[2]) {
      targetOwner = ownerMatch[2].toLowerCase();
      console.log(`Filtering by owner: ${targetOwner}`);
      // Remove the @owner part from the search term
      finalSearchTerm = searchTerm.replace(ownerMatch[0], ' ').trim();
      console.log(`Remaining search term: ${finalSearchTerm}`);

      // Pre-filter documents by owner (case-insensitive)
      documentsToSearch = documents.filter(doc =>
        doc.owner && doc.owner.toLowerCase() === targetOwner
      );
      console.log(`Found ${documentsToSearch.length} documents for owner ${targetOwner}`);
    }

    // If only @owner was typed, show all their docs without fuzzy search
    if (targetOwner && !finalSearchTerm && documentsToSearch.length > 0) {
        return documentsToSearch.map(doc => ({ item: doc, score: 0, refIndex: documents.indexOf(doc) }));
    }

    // If no remaining search term after extracting @owner, return empty results
    // (or maybe return the filtered list above? Decided empty for now)
    if (targetOwner && !finalSearchTerm) {
        return [];
    }

    // Re-initialize Fuse with the potentially filtered document list
    const currentFuse = new Fuse(documentsToSearch, fuseOptions);

    // Perform the search with the remaining search term
    console.log(`Performing Fuse search on ${documentsToSearch.length} docs with term: "${finalSearchTerm}"`);
    return currentFuse.search<Document>(finalSearchTerm);

  }, [searchTerm, documents, viewMode, fuseOptions]);

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
      interface SaveResult {
          success: boolean;
          error?: string;
      }
      try {
          console.log('Sending save-documents request via IPC...');
          const result = await window.ipc.invoke<SaveResult>('save-documents', updatedDocs);
          if (!result?.success) {
              console.error('Failed to save documents via IPC:', result?.error);
              setError('Failed to save documents. Changes might not persist.');
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
                    // Mark expanded card container as non-draggable
                    <div className="[-webkit-app-region:no-drag]">
                        <ExpandedCard
                            doc={expandedDoc}
                            onCollapse={() => setExpandedDocId(null)}
                            onCopy={handleCopy}
                            onOpenFile={handleOpenFile}
                        />
                    </div>
                );
            } else {
                return (
                    <>
                        {/* Remove drag region from here, mark container no-drag */}
                        <div className="flex items-center mb-4 flex-shrink-0 [-webkit-app-region:no-drag]">
                            {/* Keep no-drag on input */}
                            <input
                                type="text"
                                placeholder="Search your documents..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="flex-grow w-full px-4 py-2 text-lg text-white bg-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 [-webkit-app-region:no-drag]"
                                autoFocus
                            />
                            {/* Keep no-drag on button */}
                            <button
                                onClick={() => setViewMode('manage')}
                                className="ml-2 p-2 text-gray-400 hover:text-white bg-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 [-webkit-app-region:no-drag]"
                                aria-label="Manage Documents"
                            >
                                ⚙️
                            </button>
                        </div>
                        {/* Mark results area container no-drag */}
                        <div className="flex-grow overflow-y-auto [-webkit-app-region:no-drag]">
                            {!searchTerm && <p className="text-gray-500 text-center mt-4">Start typing to search...</p>}
                            {searchTerm && searchResults.length === 0 && <p className="text-gray-500 text-center mt-4">No results found for "{searchTerm}"</p>}
                            {searchTerm && searchResults.length > 0 && (
                                <ul className="space-y-2 overflow-y-auto flex-grow" style={{ maxHeight: 'calc(100% - 60px)' }}>
                                    {searchResults.map((result, index) => (
                                        <li
                                            key={result.item.id}
                                            className={`p-3 mb-1 rounded cursor-pointer transition-colors duration-100 ease-in-out ${
                                                index === selectedIndex
                                                    ? 'bg-blue-600/60 ring-1 ring-blue-400'
                                                    : 'hover:bg-white/10'
                                            }`}
                                            onClick={() => setExpandedDocId(result.item.id)}
                                            onMouseEnter={() => setSelectedIndex(index)}
                                        >
                                            <p className="font-semibold truncate">
                                                {result.item.type}
                                                {result.item.owner && <span className="text-xs text-gray-400 ml-2">({result.item.owner})</span>}
                                            </p>
                                            <p className="text-sm text-gray-300 truncate">
                                                {result.item.fields[result.item.defaultField] || 'No default value'}
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </>
                );
            }
     }
  };

  return (
    // Apply drag region to the main app container
    <div className="flex flex-col h-screen p-4 bg-gradient-to-r from-blue-950 via-purple-950 to-indigo-950 text-white rounded-lg shadow-xl overflow-hidden relative [-webkit-app-region:drag]">
       {renderContent()}
    </div>
  );
}

export default App;

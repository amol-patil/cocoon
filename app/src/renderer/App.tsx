import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Fuse from 'fuse.js';

// Mock data based on PRD schema
const mockDocuments = [
  {
    id: 'doc1',
    type: "Driver's License",
    defaultField: "number",
    fields: {
      number: "A1234-56789-01234",
      expires: "2027-05-14",
      issued: "2021-05-14",
      state: "CA",
    },
    fileLink: "https://drive.google.com/file/d/abc123/view"
  },
  {
    id: 'doc2',
    type: "Passport",
    defaultField: "number",
    fields: {
      number: "X98765432",
      expires: "2030-12-01",
      country: "USA",
    },
    fileLink: "https://drive.google.com/file/d/def456/view"
  },
  {
    id: 'doc3',
    type: "Insurance Card",
    defaultField: "policyNumber",
    fields: {
      provider: "Health Co",
      policyNumber: "HC-1234567",
      groupNumber: "G-98765",
    },
    fileLink: "https://drive.google.com/file/d/ghi789/view"
  }
];

// Fuse.js options
const fuseOptions = {
  includeScore: true,
  // Search in `type` and all values within `fields`
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

// Initialize Fuse
const fuse = new Fuse(mockDocuments, fuseOptions);

// Define the type for our document items more explicitly
// Allow fields to be potentially undefined strings
interface DocumentField { [key: string]: string | undefined }
interface Document {
  id: string;
  type: string;
  defaultField: string;
  fields: DocumentField;
  fileLink: string;
}

// --- Helper Component for Expanded Card ---
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
           // Only render if value is defined
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
// --- End Helper Component ---

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);

  const searchResults = useMemo(() => {
    if (!searchTerm) {
      return [];
    }
    return fuse.search<Document>(searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    setSelectedIndex(0);
    setExpandedDocId(null);
  }, [searchTerm]);

  const expandedDoc = useMemo(() => {
      if (!expandedDocId) return null;
      return mockDocuments.find(doc => doc.id === expandedDocId) || null;
  }, [expandedDocId]);

  const handleCopy = useCallback((text: string) => {
    try {
      window.electronClipboard.writeText(text);
      console.log(`Copied: ${text}`);
    } catch (error) {
       console.error("Failed to copy text:", error);
    }
  }, []);

  const handleOpenFile = useCallback((link: string) => {
    console.log("Attempting to open file link:", link);
    // TODO: Implement using IPC to ask main process to open external link
    // window.ipc.send('open-external-link', link);
  }, []);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (expandedDocId) {
      if (event.key === 'Escape' || event.key === 'ArrowLeft') {
        event.preventDefault();
        setExpandedDocId(null);
      }
      return;
    }

    if (searchResults.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex((prevIndex) =>
          prevIndex < searchResults.length - 1 ? prevIndex + 1 : prevIndex
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex((prevIndex) =>
          prevIndex > 0 ? prevIndex - 1 : 0
        );
        break;
       case 'ArrowRight':
        event.preventDefault();
        if (searchResults[selectedIndex]) {
          setExpandedDocId(searchResults[selectedIndex].item.id);
        }
        break;
      case 'Enter':
        event.preventDefault();
        if (searchResults[selectedIndex]) {
          const selectedDoc = searchResults[selectedIndex].item;
             const defaultFieldName = selectedDoc.defaultField;
             const valueToCopy = selectedDoc.fields[defaultFieldName];
             if (valueToCopy) {
               handleCopy(valueToCopy);
             } else {
               console.log(`Default field '${defaultFieldName}' not found or empty.`);
             }
        }
        break;
      default:
        break;
    }
  }, [searchResults, selectedIndex, expandedDocId, handleCopy]);

  return (
    <div className="flex flex-col h-screen p-4 bg-gradient-to-r from-blue-950 via-purple-950 to-indigo-950 text-white rounded-lg shadow-xl overflow-hidden relative">
      {expandedDoc ? (
        <ExpandedCard
          doc={expandedDoc}
          onCollapse={() => setExpandedDocId(null)}
          onCopy={handleCopy}
          onOpenFile={handleOpenFile}
        />
      ) : (
        <>
          <input
            type="text"
            placeholder="Search your documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-4 py-2 mb-4 text-lg text-white bg-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
            autoFocus
          />
          <div className="flex-grow overflow-y-auto">
            {!searchTerm && (
              <p className="text-gray-500 text-center mt-4">Start typing to search...</p>
            )}
            {searchTerm && searchResults.length === 0 && (
              <p className="text-gray-500 text-center mt-4">No results found for "{searchTerm}"</p>
            )}
            {searchTerm && searchResults.length > 0 && (
              <ul>
                {searchResults.map(({ item, score }, index) => (
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
        </>
      )}
    </div>
  );
}

export default App;

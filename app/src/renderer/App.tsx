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

// Initialize Fuse (outside the component for efficiency, if data doesn't change often)
const fuse = new Fuse(mockDocuments, fuseOptions);

// Define the type for our document items more explicitly
interface DocumentField { [key: string]: string }
interface Document {
  id: string;
  type: string;
  defaultField: string;
  fields: DocumentField;
  fileLink: string;
}

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Perform search using useMemo to avoid re-calculating on every render
  const searchResults = useMemo(() => {
    if (!searchTerm) {
      return []; // No search term, no results
    }
    return fuse.search<Document>(searchTerm);
  }, [searchTerm]);

  // Reset selected index when search term changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchTerm]);

  // Handle keydown events for navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (searchResults.length === 0) return; // No results to navigate

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault(); // Prevent cursor moving in input
        setSelectedIndex((prevIndex) =>
          prevIndex < searchResults.length - 1 ? prevIndex + 1 : prevIndex
        );
        break;
      case 'ArrowUp':
        event.preventDefault(); // Prevent cursor moving in input
        setSelectedIndex((prevIndex) =>
          prevIndex > 0 ? prevIndex - 1 : 0
        );
        break;
      case 'Enter':
        event.preventDefault();
        if (searchResults[selectedIndex]) {
          const selectedDoc = searchResults[selectedIndex].item;
          const defaultFieldName = selectedDoc.defaultField;
          const valueToCopy = selectedDoc.fields[defaultFieldName];

          if (valueToCopy) {
            window.electronClipboard.writeText(valueToCopy);
            console.log(`Copied: ${defaultFieldName} - ${valueToCopy}`);
            // Optional: Add feedback to user (e.g., briefly change UI)
            // Optional: Hide window after copy?
          } else {
            console.log(`Default field '${defaultFieldName}' not found or empty.`);
          }
        }
        break;
      default:
        break;
    }
  }, [searchResults, selectedIndex]);

  return (
    <div className="flex flex-col h-screen p-4 bg-gradient-to-r from-blue-950 via-purple-950 to-indigo-950 text-white rounded-lg shadow-xl overflow-hidden">
      {/* Search Input */}
      <input
        type="text"
        placeholder="Search your documents..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyDown={handleKeyDown} // Attach keydown handler
        className="w-full px-4 py-2 mb-4 text-lg text-white bg-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
        autoFocus // Focus input on appear
      />

      {/* Search Results Area */}
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
                className={`p-2 mb-1 rounded cursor-pointer ${ // Add cursor-pointer
                  index === selectedIndex ? 'bg-blue-600/50' : 'bg-white/5' // Highlight selected
                }`}
                // Optional: Allow clicking to select
                onClick={() => setSelectedIndex(index)}
              >
                <p className="font-semibold">{item.type}</p>
                {/* Display raw results for now */}
                <pre className="text-xs text-gray-400 mt-1 overflow-x-auto">
                  {JSON.stringify(item.fields, null, 2)}
                  (Score: {score?.toFixed(4)})
                </pre>
              </li>
            ))}
          </ul>
        )}
      </div>

    </div>
  );
}

export default App; 
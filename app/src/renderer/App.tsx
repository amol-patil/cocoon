import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import Fuse from "fuse.js";
import SettingsView from "./Settings";

// --- Types ---
interface DocumentField {
  [key: string]: string | undefined;
}
interface Document {
  id: string;
  type: string;
  owner?: string;
  category?: string;
  defaultField: string;
  fields: DocumentField;
  fileLink: string;
  isTemporary: boolean;
}

// Design system category color palette (from cocoon-designs.pen variables)
const CAT_COLOR_PALETTE = [
  "#4A90D9", // blue
  "#D4A847", // amber
  "#6E9E6E", // green
  "#D94A4A", // red
  "#9B6ED9", // purple
  "#4AABAA", // teal
];

const hashString = (s: string): number =>
  s.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);

// Returns a consistent color for any category/type string
const getCategoryColorHex = (category: string): string => {
  if (!category) return "#6E6E70";
  return CAT_COLOR_PALETTE[hashString(category) % CAT_COLOR_PALETTE.length];
};

const getDocTypeColor = (doc: Document): string =>
  getCategoryColorHex(doc.category || doc.type || "");

// Owner color mapping (used in ExpandedCard)
const getOwnerColor = (owner: string): { bg: string; text: string } => {
  const colors = [
    { bg: "bg-emerald-600", text: "text-emerald-100" },
    { bg: "bg-blue-600", text: "text-blue-100" },
    { bg: "bg-purple-600", text: "text-purple-100" },
    { bg: "bg-rose-600", text: "text-rose-100" },
    { bg: "bg-amber-600", text: "text-amber-100" },
    { bg: "bg-cyan-600", text: "text-cyan-100" },
  ];
  const hash = owner
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

// getCategoryColor kept for ExpandedCard
const getCategoryColor = (category: string): { bg: string; text: string } => {
  const colors = [
    { bg: "bg-indigo-600", text: "text-indigo-100" },
    { bg: "bg-teal-600", text: "text-teal-100" },
    { bg: "bg-orange-600", text: "text-orange-100" },
    { bg: "bg-pink-600", text: "text-pink-100" },
    { bg: "bg-lime-600", text: "text-lime-100" },
    { bg: "bg-sky-600", text: "text-sky-100" },
  ];
  const hash = category
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

// --- Initial Data ---
// Removed - will be loaded via IPC
// const initialMockDocuments: Document[] = [ ... ];

// --- Fuse.js Setup ---
const fuseOptions = {
  includeScore: true,
  keys: [
    "type",
    "fields.number",
    "fields.expires",
    "fields.issued",
    "fields.state",
    "fields.country",
    "fields.provider",
    "fields.policyNumber",
    "fields.groupNumber",
  ],
};

// --- Helper Components ---

// ExpandedCard (from previous step - slightly modified for clarity)
interface ExpandedCardProps {
  doc: Document;
  onCollapse: () => void;
  onCopy: (text: string) => void;
  onOpenFile: (link: string) => void;
}
function ExpandedCard({
  doc,
  onCollapse,
  onCopy,
  onOpenFile,
}: ExpandedCardProps) {
  return (
    <div className="p-4 bg-white/10 rounded-lg h-full overflow-y-auto [-webkit-app-region:no-drag] relative">
      <button
        onClick={onCollapse}
        className="absolute top-2 right-2 text-gray-400 hover:text-white focus:outline-none [-webkit-app-region:no-drag]"
        aria-label="Close details"
      >
        ✕
      </button>
      <h3 className="text-lg font-semibold mb-4 pr-8">
        {doc.type}
        {doc.owner && (
          <span
            className={`ml-2 px-2 py-0.5 rounded-full text-sm ${getOwnerColor(doc.owner).bg} ${getOwnerColor(doc.owner).text}`}
          >
            {doc.owner}
          </span>
        )}
        {doc.category && (
          <span
            className={`ml-2 px-2 py-0.5 rounded-full text-sm ${getCategoryColor(doc.category).bg} ${getCategoryColor(doc.category).text}`}
          >
            {doc.category}
          </span>
        )}
      </h3>
      <ul className="space-y-2 mt-3">
        {Object.entries(doc.fields).map(
          ([key, value]) =>
            value &&
            key !== "owner" && (
              <li key={key} className="flex justify-between items-center group">
                <span className="text-sm font-medium text-gray-300 capitalize">
                  {key}:
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-white truncate max-w-xs">
                    {value}
                  </span>
                  <button
                    onClick={() => onCopy(value)}
                    className="text-gray-400 hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none [-webkit-app-region:no-drag]"
                    aria-label={`Copy ${key}`}
                  >
                    📋
                  </button>
                </div>
              </li>
            ),
        )}
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

// Document Form Component
interface DocumentFormProps {
  documentToEdit:
    | (Omit<Document, "id" | "isTemporary"> & { id?: string; isTemporary?: boolean })
    | null;
  onSave: (docData: Omit<Document, "id"> & { id?: string }) => void;
  onCancel: () => void;
  onDelete?: (id: string) => void;
  onEscape: () => void;
  availableCategories: string[];
  availableOwners: string[];
  onRenameCategory: (oldName: string, newName: string) => void;
  onDeleteCategory: (name: string) => void;
  onCreateCategory: (name: string) => void;
}

function DocumentForm({
  documentToEdit,
  onSave,
  onCancel,
  onDelete,
  onEscape,
  availableCategories,
  onRenameCategory,
  onDeleteCategory,
  onCreateCategory,
}: DocumentFormProps) {
  const [type, setType] = useState("");
  const [owner, setOwner] = useState("");
  const [category, setCategory] = useState("");
  const [defaultField, setDefaultField] = useState("");
  const [fileLink, setFileLink] = useState("");
  const [fields, setFields] = useState<{ key: string; value: string }[]>([{ key: "", value: "" }]);
  const [isTemporary, setIsTemporary] = useState(false);
  const [isCatOpen, setIsCatOpen] = useState(false);
  const [catSearch, setCatSearch] = useState("");
  const [isDefaultOpen, setIsDefaultOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editingCatValue, setEditingCatValue] = useState("");
  const catRef = useRef<HTMLDivElement>(null);
  const defaultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (documentToEdit) {
      setType(documentToEdit.type || "");
      setOwner(documentToEdit.owner || "");
      setCategory(documentToEdit.category || "");
      setDefaultField(documentToEdit.defaultField || "");
      setFileLink(documentToEdit.fileLink || "");
      setFields(
        Object.entries(documentToEdit.fields || {}).map(([key, value]) => ({ key, value: value || "" }))
      );
      setIsTemporary(documentToEdit.isTemporary || false);
    } else {
      setType(""); setOwner(""); setCategory(""); setDefaultField("");
      setFileLink(""); setFields([{ key: "", value: "" }]); setIsTemporary(false);
    }
  }, [documentToEdit]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (catRef.current && !catRef.current.contains(e.target as Node)) setIsCatOpen(false);
      if (defaultRef.current && !defaultRef.current.contains(e.target as Node)) setIsDefaultOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleFieldChange = (index: number, field: "key" | "value", value: string) => {
    const next = [...fields];
    next[index][field] = value;
    setFields(next);
    // Auto-set defaultField to first key if not set
    if (field === "key" && !defaultField && value.trim()) setDefaultField(value.trim());
  };

  const removeField = (index: number) => {
    const next = fields.filter((_, i) => i !== index);
    setFields(next.length ? next : [{ key: "", value: "" }]);
    if (defaultField === fields[index].key) setDefaultField(next[0]?.key || "");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!type.trim()) { alert("Document type is required"); return; }
    const fieldsObject: DocumentField = {};
    fields.forEach((f) => { if (f.key.trim()) fieldsObject[f.key.trim()] = f.value.trim() || undefined; });
    const resolvedDefault = defaultField.trim() || fields.find(f => f.key.trim())?.key.trim() || "";
    if (!resolvedDefault) { alert("At least one field with a key is required"); return; }
    onSave({
      id: documentToEdit?.id,
      type: type.trim(),
      owner: owner.trim() || undefined,
      category: category.trim() || undefined,
      defaultField: resolvedDefault,
      fileLink: fileLink.trim(),
      fields: fieldsObject,
      isTemporary,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { e.preventDefault(); onEscape(); }
  };

  const filteredCats = availableCategories.filter(c =>
    c.toLowerCase().includes(catSearch.toLowerCase())
  );
  const trimmedSearch = catSearch.trim();
  const showCreate = trimmedSearch && !availableCategories.some(c => c.toLowerCase() === trimmedSearch.toLowerCase());

  const selectOrCreateCategory = (name: string) => {
    const isNew = !availableCategories.some(c => c.toLowerCase() === name.toLowerCase());
    setCategory(name);
    if (isNew) onCreateCategory(name);
    setIsCatOpen(false);
    setCatSearch("");
  };
  const namedFields = fields.filter(f => f.key.trim());

  const inputStyle: React.CSSProperties = {
    background: "#242426", border: "1px solid #3A3A3C", borderRadius: 10,
    color: "#F5F5F0", fontFamily: "'Inter', sans-serif", fontSize: 13,
    height: 40, padding: "0 14px", width: "100%", outline: "none",
  };
  const labelStyle: React.CSSProperties = {
    color: "#6E6E70", fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 500,
  };
  const sectionLabelStyle: React.CSSProperties = {
    color: "#4A4A4C", fontFamily: "'Inter', sans-serif", fontSize: 11,
    fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const,
  };

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
      className="flex flex-col h-full [-webkit-app-region:no-drag]"
      style={{ background: "#1A1A1C", color: "#F5F5F0" }}
    >
      {/* Header */}
      <div
        className="flex justify-between items-center px-6 py-5 flex-shrink-0"
        style={{ borderBottom: "1px solid #3A3A3C" }}
      >
        <div className="flex flex-col gap-0.5">
          <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 600 }}>
            {documentToEdit?.id ? "Edit Document" : "Add Document"}
          </span>
          {documentToEdit?.type && (
            <span style={{ color: "#6E6E70", fontFamily: "'Inter', sans-serif", fontSize: 12 }}>
              {documentToEdit.type}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {documentToEdit?.id && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(documentToEdit.id!)}
              className="flex items-center gap-1.5 h-8 px-3 rounded-[8px] focus:outline-none transition-colors hover:bg-[#D94A4A22]"
              style={{ border: "1px solid #D94A4A44", color: "#D94A4A", fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 500 }}
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M2 3h9M5 3V2h3v1M4 3l.5 8h4L9 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Delete
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#6E6E70] hover:text-[#F5F5F0] focus:outline-none transition-colors"
            style={{ border: "1px solid #3A3A3C" }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2l10 10M12 2 2 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Body — two columns */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left column — Document Info */}
        <div
          className="flex flex-col gap-5 overflow-y-auto p-6"
          style={{ width: 280, borderRight: "1px solid #3A3A3C", flexShrink: 0 }}
        >
          <span style={sectionLabelStyle}>Document Info</span>

          {/* Type */}
          <div className="flex flex-col gap-1.5">
            <label style={labelStyle}>Type</label>
            <input
              style={inputStyle}
              value={type}
              onChange={e => setType(e.target.value)}
              placeholder="e.g. Passport - India"
              autoFocus
            />
          </div>

          {/* Owner */}
          <div className="flex flex-col gap-1.5">
            <label style={labelStyle}>Owner</label>
            <input
              style={inputStyle}
              value={owner}
              onChange={e => setOwner(e.target.value)}
              placeholder="e.g. Jayanti"
            />
          </div>

          {/* Category — custom dropdown */}
          <div className="flex flex-col gap-1.5 relative" ref={catRef}>
            <label style={labelStyle}>Category</label>
            <button
              type="button"
              onClick={() => { setIsCatOpen(o => !o); setCatSearch(""); }}
              className="flex items-center justify-between h-10 px-[14px] rounded-[10px] text-left focus:outline-none"
              style={{
                background: "#242426",
                border: `1px solid ${isCatOpen ? "#C9A962" : "#3A3A3C"}`,
                color: category ? "#F5F5F0" : "#4A4A4C",
                fontFamily: "'Inter', sans-serif", fontSize: 13,
              }}
            >
              <span className="flex items-center gap-2">
                {category && (
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: getCategoryColorHex(category) }} />
                )}
                {category || "Select or create…"}
              </span>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: "#6E6E70" }}>
                <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {isCatOpen && (
              <div
                className="absolute left-0 right-0 z-50 overflow-hidden"
                style={{ top: "calc(100% + 4px)", background: "#2A2A2C", border: "1px solid #3A3A3C", borderRadius: 10 }}
              >
                {/* Search */}
                <div className="px-3 py-2" style={{ borderBottom: "1px solid #3A3A3C" }}>
                  <input
                    style={{ ...inputStyle, height: 32, background: "transparent", border: "none", fontSize: 12, padding: "0 4px" }}
                    placeholder="Search or create…"
                    value={catSearch}
                    onChange={e => setCatSearch(e.target.value)}
                    onClick={e => e.stopPropagation()}
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (showCreate) selectOrCreateCategory(trimmedSearch);
                        else if (filteredCats.length === 1) selectOrCreateCategory(filteredCats[0]);
                      } else if (e.key === "Escape") {
                        e.preventDefault();
                        setIsCatOpen(false);
                      }
                    }}
                    autoFocus
                  />
                </div>
                {filteredCats.map(cat => (
                  <div
                    key={cat}
                    className="group flex items-center justify-between w-full h-9 px-3.5"
                    style={{ background: cat === category ? "#C9A96214" : "transparent" }}
                  >
                    {/* Left: dot + name (or rename input) */}
                    {editingCat === cat ? (
                      <input
                        className="flex-1 focus:outline-none bg-transparent"
                        style={{ color: "#F5F5F0", fontFamily: "'Inter', sans-serif", fontSize: 13 }}
                        value={editingCatValue}
                        autoFocus
                        onChange={e => setEditingCatValue(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const trimmed = editingCatValue.trim();
                            if (trimmed && trimmed !== cat) {
                              onRenameCategory(cat, trimmed);
                              if (category === cat) setCategory(trimmed);
                            }
                            setEditingCat(null);
                          } else if (e.key === "Escape") {
                            e.preventDefault();
                            setEditingCat(null);
                          }
                        }}
                        onBlur={() => {
                          const trimmed = editingCatValue.trim();
                          if (trimmed && trimmed !== cat) {
                            onRenameCategory(cat, trimmed);
                            if (category === cat) setCategory(trimmed);
                          }
                          setEditingCat(null);
                        }}
                        onClick={e => e.stopPropagation()}
                      />
                    ) : (
                      <button
                        type="button"
                        className="flex items-center gap-2.5 flex-1 text-left focus:outline-none overflow-hidden min-w-0"
                        style={{ color: "#F5F5F0", fontFamily: "'Inter', sans-serif", fontSize: 13 }}
                        onClick={() => selectOrCreateCategory(cat)}
                      >
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: getCategoryColorHex(cat) }} />
                        <span className="truncate">{cat}</span>
                      </button>
                    )}

                    {/* Right: pencil + trash — hidden until hover */}
                    {editingCat !== cat && (
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                        <button
                          type="button"
                          className="focus:outline-none"
                          style={{ color: "#6E6E70", lineHeight: 0 }}
                          onClick={e => { e.stopPropagation(); setEditingCat(cat); setEditingCatValue(cat); }}
                          title="Rename"
                        >
                          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                            <path d="M7.5 1.5a1 1 0 0 1 1.414 1.414L3.5 8.328 1.5 9l.672-2L7.5 1.5z" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="focus:outline-none"
                          style={{ color: "#D94A4A", lineHeight: 0 }}
                          onClick={e => { e.stopPropagation(); onDeleteCategory(cat); if (category === cat) setCategory(""); }}
                          title="Delete"
                        >
                          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                            <path d="M2 3h7M4.5 3V2h2v1M3.5 3l.4 6h3.2l.4-6" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {showCreate && (
                  <button
                    type="button"
                    className="flex items-center gap-2 w-full h-9 px-3.5 text-left focus:outline-none"
                    style={{ borderTop: "1px solid #3A3A3C", color: "#C9A962", fontFamily: "'Inter', sans-serif", fontSize: 13 }}
                    onClick={() => selectOrCreateCategory(trimmedSearch)}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                    </svg>
                    Create "{catSearch.trim()}"
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Google Drive Link */}
          <div className="flex flex-col gap-1.5">
            <label style={labelStyle}>Google Drive Link</label>
            <div
              className="flex items-center gap-2 h-10 px-[14px] rounded-[10px]"
              style={{ background: "#242426", border: "1px solid #3A3A3C" }}
            >
              <input
                style={{ ...inputStyle, height: "100%", border: "none", background: "transparent", padding: 0, flex: 1 }}
                value={fileLink}
                onChange={e => setFileLink(e.target.value)}
                placeholder="https://drive.google.com/file/d/…"
                type="url"
              />
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: "#4A4A4C", flexShrink: 0 }}>
                <path d="M5 2H2a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                <path d="M7.5 1H11v3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M11 1 6 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </div>
          </div>

          {/* Temporary */}
          <button
            type="button"
            className="flex items-center gap-2.5 focus:outline-none"
            onClick={() => setIsTemporary(t => !t)}
          >
            <div
              className="flex items-center justify-center rounded"
              style={{ width: 18, height: 18, background: "#242426", border: `1px solid ${isTemporary ? "#C9A962" : "#3A3A3C"}`, flexShrink: 0 }}
            >
              {isTemporary && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="#C9A962" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <div className="flex flex-col gap-0.5 text-left">
              <span style={{ color: "#F5F5F0", fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500 }}>Temporary Item</span>
              <span style={{ color: "#4A4A4C", fontFamily: "'Inter', sans-serif", fontSize: 11 }}>Auto-removes after 24 hours</span>
            </div>
          </button>
        </div>

        {/* Right column — Fields */}
        <div className="flex flex-col gap-4 flex-1 overflow-y-auto p-6">
          {/* Fields header */}
          <div className="flex items-center justify-between">
            <span style={sectionLabelStyle}>Fields</span>
            {/* Copy on Enter chip */}
            <div className="flex items-center gap-1.5 relative" ref={defaultRef}>
              <span style={{ color: "#4A4A4C", fontFamily: "'Inter', sans-serif", fontSize: 11 }}>Copy on Enter:</span>
              <button
                type="button"
                onClick={() => setIsDefaultOpen(o => !o)}
                className="flex items-center gap-1 h-[22px] px-2 rounded-[6px] focus:outline-none"
                style={{ background: "#2A2A2C", border: "1px solid #3A3A3C", color: "#F5F5F0", fontFamily: "'Inter', sans-serif", fontSize: 11 }}
              >
                {defaultField || (namedFields[0]?.key) || "—"}
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ color: "#6E6E70" }}>
                  <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {isDefaultOpen && namedFields.length > 0 && (
                <div
                  className="absolute right-0 z-50 overflow-hidden"
                  style={{ top: "calc(100% + 4px)", background: "#2A2A2C", border: "1px solid #3A3A3C", borderRadius: 8, minWidth: 120 }}
                >
                  {namedFields.map(f => (
                    <button
                      key={f.key}
                      type="button"
                      className="flex w-full h-8 px-3 items-center text-left focus:outline-none"
                      style={{
                        background: f.key === defaultField ? "#C9A96214" : "transparent",
                        color: "#F5F5F0", fontFamily: "'Inter', sans-serif", fontSize: 12,
                      }}
                      onClick={() => { setDefaultField(f.key); setIsDefaultOpen(false); }}
                    >
                      {f.key}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Field rows */}
          <div className="flex flex-col gap-2">
            {fields.map((field, index) => (
              <div
                key={index}
                className="flex items-center gap-2 h-11 px-[14px] rounded-[10px]"
                style={{ background: "#242426", border: "1px solid #3A3A3C" }}
              >
                <input
                  style={{ width: 100, background: "transparent", border: "none", outline: "none", color: "#6E6E70", fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 500, flexShrink: 0 }}
                  placeholder="key"
                  value={field.key}
                  onChange={e => handleFieldChange(index, "key", e.target.value)}
                />
                <div style={{ width: 1, height: 20, background: "#3A3A3C", flexShrink: 0 }} />
                <input
                  style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#F5F5F0", fontFamily: "'Inter', sans-serif", fontSize: 13 }}
                  placeholder="value"
                  value={field.value}
                  onChange={e => handleFieldChange(index, "value", e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => removeField(index)}
                  className="focus:outline-none transition-colors hover:opacity-80 shrink-0"
                  style={{ color: "#4A4A4C" }}
                  aria-label="Remove field"
                >
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M2 3h9M5 3V2h3v1M4 3l.5 8h4L9 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Add Field button */}
          <button
            type="button"
            onClick={() => setFields(f => [...f, { key: "", value: "" }])}
            className="flex items-center justify-center gap-2 h-9 rounded-[10px] focus:outline-none transition-colors hover:border-[#6E6E70]"
            style={{ border: "1px solid #3A3A3C", color: "#6E6E70", fontFamily: "'Inter', sans-serif", fontSize: 13 }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            Add Field
          </button>
        </div>
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-end gap-2 px-6 py-3 flex-shrink-0"
        style={{ borderTop: "1px solid #3A3A3C" }}
      >
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center justify-center h-9 px-5 rounded-[10px] focus:outline-none transition-colors hover:border-[#6E6E70]"
          style={{ border: "1px solid #3A3A3C", color: "#6E6E70", fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500 }}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex items-center justify-center h-9 px-5 rounded-[10px] focus:outline-none transition-colors hover:opacity-90"
          style={{ background: "#C9A962", color: "#1A1A1C", fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600 }}
        >
          {documentToEdit?.id ? "Save Changes" : "Add Document"}
        </button>
      </div>
    </form>
  );
}

// Define AppViewMode type
type AppViewMode = "search" | "editForm" | "settings";

// --- Main App Component ---
export default function App() {
  // === State ===
  const [allDocuments, setAllDocuments] = useState<Document[]>([]);
  const [appSettings, setAppSettings] = useState<{ owners: string[]; categories: string[]; clipboardAutoClearSeconds: number }>({ owners: [], categories: [], clipboardAutoClearSeconds: 30 });
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Loading state
  const [error, setError] = useState<string | null>(null); // Error state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<AppViewMode>("search");
  const [docToEdit, setDocToEdit] = useState<Document | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [editReturnView, setEditReturnView] = useState<AppViewMode>("search");

  // Re-initialize Fuse when documents change (use all documents)
  const fuse = useMemo(() => {
    console.log(`Rebuilding Fuse index with ${allDocuments.length} documents.`);
    return new Fuse(allDocuments, fuseOptions);
  }, [allDocuments]);

  // === Data Loading Effect ===
  useEffect(() => {
    console.log("Requesting documents from main process...");
    setIsLoading(true);
    window.ipc
      .invoke<Document[]>("load-documents")
      .then((loadedDocs) => {
        console.log(`Received ${loadedDocs.length} documents.`);
        setAllDocuments(loadedDocs);
        setError(null);
      })
      .catch((err: Error) => {
        console.error("Error loading documents via IPC:", err);
        setError(
          "Failed to load documents. Please restart the application or check logs.",
        );
        setAllDocuments([]); // Set empty on error
      })
      .finally(() => {
        setIsLoading(false);
      });
    // Also load settings for owners/categories
    window.ipc.invoke("get-settings").then((settings: any) => {
      setAppSettings({ owners: settings.owners || [], categories: settings.categories || [], clipboardAutoClearSeconds: settings.clipboardAutoClearSeconds ?? 30 });
    }).catch((err: Error) => {
      console.error("Error loading settings:", err);
    });
  }, []); // Run only once on mount

  // === Search Logic ===
  const searchResults = useMemo(() => {
    if (viewMode !== "search" || !searchTerm) {
      // If not searching, return all documents for initial display
      return allDocuments.map((doc) => ({ item: doc, score: 0, refIndex: 0 })); // Use allDocuments
    }

    let finalSearchTerm = searchTerm;
    let targetOwner: string | null = null;
    let targetCategory: string | null = null;
    const ownerMatch = searchTerm.match(/(\s|^)@(\w+)(\s|$)/);
    const categoryMatch = searchTerm.match(/(\s|^)#(\w+)(\s|$)/);

    let documentsToSearch = allDocuments;

    if (ownerMatch && ownerMatch[2]) {
      targetOwner = ownerMatch[2].toLowerCase();
      console.log(`Filtering by owner: ${targetOwner}`);
      // Remove the @owner part from the search term
      finalSearchTerm = searchTerm.replace(ownerMatch[0], " ").trim();
      console.log(`Remaining search term: ${finalSearchTerm}`);

      // Pre-filter documents by owner (case-insensitive)
      documentsToSearch = allDocuments.filter(
        (doc) => doc.owner && doc.owner.toLowerCase() === targetOwner,
      );
      console.log(
        `Found ${documentsToSearch.length} documents for owner ${targetOwner}`,
      );
    }

    if (categoryMatch && categoryMatch[2]) {
      targetCategory = categoryMatch[2].toLowerCase();
      console.log(`Filtering by category: ${targetCategory}`);
      // Remove the #category part from the final search term
      finalSearchTerm = finalSearchTerm.replace(/#\w+/g, " ").trim();
      console.log(`Remaining search term: ${finalSearchTerm}`);

      // Pre-filter documents by category (case-insensitive)
      documentsToSearch = documentsToSearch.filter(
        (doc) => doc.category && doc.category.toLowerCase() === targetCategory,
      );
      console.log(
        `Found ${documentsToSearch.length} documents for category ${targetCategory}`,
      );
    }

    // If only @owner and/or #category was typed, show all matching docs without fuzzy search
    if ((targetOwner || targetCategory) && !finalSearchTerm && documentsToSearch.length > 0) {
      return documentsToSearch.map((doc) => ({
        item: doc,
        score: 0,
        refIndex: allDocuments.indexOf(doc),
      }));
    }

    // If no remaining search term after extracting @owner/#category, return empty results
    if ((targetOwner || targetCategory) && !finalSearchTerm) {
      return [];
    }

    // Re-initialize Fuse with the potentially filtered document list
    const currentFuse = new Fuse(documentsToSearch, fuseOptions);

    // Perform the search with the remaining search term
    console.log(
      `Performing Fuse search on ${documentsToSearch.length} docs with term: "${finalSearchTerm}"`,
    );
    return currentFuse.search<Document>(finalSearchTerm);
  }, [searchTerm, viewMode, fuse, allDocuments, fuseOptions]);

  const uniqueCategories = useMemo(() => {
    return [...new Set(allDocuments.map((d) => d.category).filter(Boolean) as string[])];
  }, [allDocuments]);

  const filteredResults = useMemo(() => {
    if (!selectedCategory) return searchResults;
    return searchResults.filter((r) =>
      (r.item.category || "").toLowerCase() === selectedCategory.toLowerCase()
    );
  }, [searchResults, selectedCategory]);

  useEffect(() => {
    if (viewMode === "search") {
      setSelectedIndex(0);
      setExpandedDocId(null);
    }
  }, [searchTerm, viewMode]);

  // === Document CRUD Handlers (Now use IPC) ===
  const handleAddDocument = () => {
    setDocToEdit(null);
    setEditReturnView(viewMode);
    setViewMode("editForm");
  };
  const handleEditDocument = (doc: Document) => {
    setDocToEdit(doc);
    setEditReturnView(viewMode);
    setViewMode("editForm");
  };

  // Helper function to save documents via IPC
  const saveDocumentsIPC = useCallback(async (updatedDocs: Document[]) => {
    interface SaveResult {
      success: boolean;
      error?: string;
    }
    try {
      console.log("Sending save-documents request via IPC...");
      const result = await window.ipc.invoke<SaveResult>(
        "save-documents",
        updatedDocs,
      );
      if (!result?.success) {
        console.error("Failed to save documents via IPC:", result?.error);
        setError("Failed to save documents. Changes might not persist.");
      } else {
        console.log("Documents saved successfully via IPC.");
        setError(null); // Clear error on success
      }
      return result;
    } catch (ipcError) {
      console.error("Error sending save-documents IPC message:", ipcError);
      setError("An error occurred while trying to save documents.");
      return {
        success: false,
        error: "An error occurred while trying to save documents.",
      };
    }
  }, []);

  const handleDeleteDocument = useCallback(
    async (id: string) => {
      if (window.confirm("Are you sure you want to delete this document?")) {
        const updatedDocs = allDocuments.filter((doc) => doc.id !== id);
        setAllDocuments(updatedDocs); // Optimistic update
        await saveDocumentsIPC(updatedDocs); // Persist change
      }
    },
    [allDocuments, saveDocumentsIPC],
  );

  const handleRenameCategory = useCallback(
    async (oldName: string, newName: string) => {
      // Update all documents that use this category
      const updatedDocs = allDocuments.map(doc =>
        doc.category === oldName ? { ...doc, category: newName } : doc
      );
      setAllDocuments(updatedDocs);
      await saveDocumentsIPC(updatedDocs);
      // Update settings categories list
      const updatedSettings = {
        ...appSettings,
        categories: appSettings.categories.map(c => c === oldName ? newName : c),
      };
      setAppSettings(updatedSettings);
      await window.ipc.invoke("save-settings", updatedSettings);
    },
    [allDocuments, appSettings, saveDocumentsIPC],
  );

  const handleCreateCategory = useCallback(
    async (name: string) => {
      if (appSettings.categories.includes(name)) return;
      const updatedSettings = {
        ...appSettings,
        categories: [...appSettings.categories, name],
      };
      setAppSettings(updatedSettings);
      await window.ipc.invoke("save-settings", updatedSettings);
    },
    [appSettings],
  );

  const handleDeleteCategory = useCallback(
    async (name: string) => {
      // Remove category from all documents that use it
      const updatedDocs = allDocuments.map(doc =>
        doc.category === name ? { ...doc, category: undefined } : doc
      );
      setAllDocuments(updatedDocs);
      await saveDocumentsIPC(updatedDocs);
      // Remove from settings categories list
      const updatedSettings = {
        ...appSettings,
        categories: appSettings.categories.filter(c => c !== name),
      };
      setAppSettings(updatedSettings);
      await window.ipc.invoke("save-settings", updatedSettings);
    },
    [allDocuments, appSettings, saveDocumentsIPC],
  );

  const handleSaveDocument = useCallback(
    async (docData: Omit<Document, "id"> & { id?: string }) => {
      console.log("Saving document (renderer), received:", docData);
      try {
        setIsLoading(true);
        setError(null);

        interface SaveResult {
          success: boolean;
          error?: string;
        }
        let updatedDocs: Document[];

        // Directly use docData received from the form
        if (docData.id) {
          // Editing existing
          // Assume docData has all necessary fields, including isTemporary
          updatedDocs = allDocuments.map((doc) =>
            doc.id === docData.id ? ({ ...doc, ...docData } as Document) : doc,
          );
        } else {
          // Adding new
          // Create the new document structure, ensuring default values for non-provided fields
          const newDoc: Document = {
            id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
            type: docData.type,
            defaultField: docData.defaultField,
            fields: docData.fields || {},
            owner: docData.owner || undefined,
            fileLink: docData.fileLink || "",
            // Use isTemporary directly from docData, which form defaults to false if needed
            isTemporary: docData.isTemporary || false,
          };
          updatedDocs = [...allDocuments, newDoc];
        }

        // Persist changes via IPC
        console.log("Sending updated docs to save:", updatedDocs);
        const result: SaveResult = await saveDocumentsIPC(updatedDocs);

        if (result.success) {
          setAllDocuments(updatedDocs); // Update local state
          setViewMode(editReturnView); // Return to where we came from
          setDocToEdit(null);
        } else {
          setError(result.error || "Failed to save document");
          // Stay in form view on error
        }
      } catch (err: any) {
        console.error("Error saving document:", err);
        const message = err instanceof Error ? err.message : 'An unknown error occurred';
        setError('An unexpected error occurred while saving: ' + message);
      } finally {
        setIsLoading(false);
      }
    },
    [allDocuments, saveDocumentsIPC, setViewMode],
  );

  const handleCancelEdit = useCallback(() => {
    setViewMode(editReturnView);
    setDocToEdit(null);
  }, [editReturnView]);

  // === Other Handlers ===
  const handleCopy = useCallback((text: string) => {
    try {
      window.electronClipboard.writeText(text);
      console.log("Copied field to clipboard.");

      // Schedule clipboard auto-clear
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      if (appSettings.clipboardAutoClearSeconds > 0) {
        clearTimerRef.current = setTimeout(() => {
          window.ipc.send("clear-clipboard", null);
          console.log("Clipboard auto-cleared.");
        }, appSettings.clipboardAutoClearSeconds * 1000);
      }
    } catch (error) {
      console.error("Failed to copy text:", error);
    }
  }, [appSettings.clipboardAutoClearSeconds]);

  // Use IPC to open link
  const handleOpenFile = useCallback((link: string) => {
    console.log("Attempting to open file link via IPC:", link);
    window.ipc.send("open-external-link", link);
  }, []);

  // Hide window function
  const hideWindow = useCallback(() => {
    console.log("Hiding window via IPC");
    window.ipc.send("hide-window");
  }, []);

  // Add a global document-level event listener for Escape key
  useEffect(() => {
    const handleGlobalEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        console.log("Global Escape key pressed");

        // For expanded card view, just collapse
        if (viewMode === "search" && expandedDocId) {
          setExpandedDocId(null);
        }
        // For edit form, just cancel edit
        else if (viewMode === "editForm") {
          handleCancelEdit();
        }
        // In all other cases, hide the window
        else {
          hideWindow();
        }
      }
    };

    // Add the event listener
    document.addEventListener("keydown", handleGlobalEscape);

    // Clean up the event listener on component unmount
    return () => {
      document.removeEventListener("keydown", handleGlobalEscape);
    };
  }, [viewMode, expandedDocId, handleCancelEdit, hideWindow]);

  // === Keyboard Handler ===
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement> | KeyboardEvent) => {
      // First handle Escape key globally to dismiss window regardless of view
      if (event.key === "Escape") {
        event.preventDefault();
        // For expanded card view, just collapse instead of hiding window
        if (viewMode === "search" && expandedDocId) {
          setExpandedDocId(null);
        } else if (viewMode === "editForm") {
          // For edit form, just cancel the edit
          handleCancelEdit();
        } else {
          // In all other cases, hide the window
          hideWindow();
        }
        return;
      }

      // Handle other keys based on view mode
      if (viewMode === "search") {
        // --- Search Mode Key Handling ---
        if (expandedDocId) {
          // Expanded View Active
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            setExpandedDocId(null); // Collapse
          }
        } else {
          // List View Active
          if (filteredResults.length === 0) return;
          switch (event.key) {
            case "ArrowDown":
              event.preventDefault();
              setSelectedIndex((prev) =>
                Math.min(prev + 1, filteredResults.length - 1),
              );
              break;
            case "ArrowUp":
              event.preventDefault();
              setSelectedIndex((prev) => Math.max(prev - 1, 0));
              break;
            case "ArrowRight":
              event.preventDefault();
              if (filteredResults[selectedIndex]) {
                setExpandedDocId(filteredResults[selectedIndex].item.id);
              }
              break;
            case "Enter":
              event.preventDefault();
              if (filteredResults[selectedIndex]) {
                const item = filteredResults[selectedIndex].item;
                const value = item.fields[item.defaultField];
                if (value) handleCopy(value);
                else
                  console.log(
                    `Default field '${item.defaultField}' not found.`,
                  );
              }
              break;
          }
        }
      }
    },
    [
      viewMode,
      filteredResults,
      selectedIndex,
      expandedDocId,
      handleCopy,
      handleCancelEdit,
      hideWindow,
    ],
  );

  // Resize window based on view mode
  useEffect(() => {
    if (viewMode === "editForm") {
      window.ipc.send("resize-window", { width: 700, height: 560 });
    } else {
      window.ipc.send("resize-window", { width: 680, height: 480 });
    }
  }, [viewMode]);

  // Add listener for open-settings IPC message
  useEffect(() => {
    const handleOpenSettings = () => {
      console.log("Received open-settings message");
      setViewMode("settings");
    };

    // Add the event listener
    window.ipc.on("open-settings", handleOpenSettings);

    // Clean up the event listener on component unmount
    return () => {
      window.ipc.removeListener("open-settings", handleOpenSettings);
    };
  }, []);

  // === Render Logic ===
  const renderContent = () => {
    if (isLoading)
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-xl text-gray-400">Loading...</div>
        </div>
      );
    if (error)
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-red-400">{error}</div>
        </div>
      );

    // Render based on viewMode
    switch (viewMode) {
      case "editForm": {
        return (
          <DocumentForm
            documentToEdit={docToEdit}
            onSave={handleSaveDocument}
            onCancel={handleCancelEdit}
            onDelete={handleDeleteDocument}
            onEscape={hideWindow}
            availableCategories={[...new Set([...appSettings.categories, ...allDocuments.map(d => d.category).filter(Boolean) as string[]])]}
            availableOwners={[...new Set([...appSettings.owners, ...allDocuments.map(d => d.owner).filter(Boolean) as string[]])]}
            onRenameCategory={handleRenameCategory}
            onDeleteCategory={handleDeleteCategory}
            onCreateCategory={handleCreateCategory}
          />
        );
      }
      case "settings": {
        return <SettingsView onBack={() => setViewMode("search")} />;
      }
      case "search":
      default: {
        const currentExpandedDoc = expandedDocId
          ? allDocuments.find((d) => d.id === expandedDocId)
          : null;

        return (
          <div className="flex flex-col h-full">
            {/* Expanded card overlay */}
            {currentExpandedDoc ? (
              <div className="[-webkit-app-region:no-drag] absolute inset-4">
                <ExpandedCard
                  doc={currentExpandedDoc}
                  onCollapse={() => setExpandedDocId(null)}
                  onCopy={handleCopy}
                  onOpenFile={handleOpenFile}
                />
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-5 flex-shrink-0">
                  <span
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                    className="text-[28px] font-medium text-[#F5F5F0] leading-none"
                  >
                    Cocoon
                  </span>
                  <div className="flex gap-2 items-center [-webkit-app-region:no-drag]">
                    <button
                      onClick={handleAddDocument}
                      className="flex items-center gap-1.5 px-4 h-[34px] rounded-full bg-[#C9A962] text-[#1A1A1C] text-xs font-semibold hover:bg-[#D4B472] focus:outline-none transition-colors"
                      aria-label="Add Document"
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                      Add
                    </button>
                    <button
                      onClick={() => setViewMode("settings")}
                      className="w-[34px] h-[34px] rounded-full border border-[#3A3A3C] flex items-center justify-center text-[#6E6E70] hover:text-[#F5F5F0] hover:border-[#6E6E70] focus:outline-none transition-colors"
                      aria-label="Settings"
                    >
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                        <path d="M7.5 9.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" stroke="currentColor" strokeWidth="1.2"/>
                        <path d="M12.7 9.1a1 1 0 0 0 .2 1.1l.04.04a1.2 1.2 0 0 1-1.7 1.7l-.04-.04a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.92V12.75a1.2 1.2 0 0 1-2.4 0v-.12A1 1 0 0 0 6.5 11.6a1 1 0 0 0-1.1.2l-.04.04a1.2 1.2 0 0 1-1.7-1.7l.04-.04a1 1 0 0 0 .2-1.1 1 1 0 0 0-.92-.6H2.75a1.2 1.2 0 0 1 0-2.4h.12A1 1 0 0 0 3.9 5.5a1 1 0 0 0-.2-1.1l-.04-.04a1.2 1.2 0 0 1 1.7-1.7l.04.04a1 1 0 0 0 1.1.2h.04A1 1 0 0 0 7.14 2H7.5a1.2 1.2 0 0 1 1.2 1.2v.16a1 1 0 0 0 .6.92h.04a1 1 0 0 0 1.1-.2l.04-.04a1.2 1.2 0 0 1 1.7 1.7l-.04.04a1 1 0 0 0-.2 1.1v.04a1 1 0 0 0 .92.6H13a1.2 1.2 0 0 1 0 2.4h-.16a1 1 0 0 0-.92.6h-.02Z" stroke="currentColor" strokeWidth="1.2"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Search bar */}
                <div className="px-6 flex-shrink-0 [-webkit-app-region:no-drag]">
                  <div className="flex items-center gap-3 h-11 px-[18px] rounded-full border border-[#3A3A3C] bg-transparent">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
                      <circle cx="7" cy="7" r="5" stroke="#6E6E70" strokeWidth="1.3"/>
                      <path d="m11 11 3 3" stroke="#6E6E70" strokeWidth="1.3" strokeLinecap="round"/>
                    </svg>
                    <input
                      type="text"
                      placeholder="Search documents... (@owner, #category)"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1 bg-transparent text-[#F5F5F0] text-[13px] outline-none placeholder:text-[#4A4A4C] [-webkit-app-region:no-drag]"
                      style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}
                      autoFocus
                    />
                  </div>
                </div>

                {/* Category filter chips */}
                {uniqueCategories.length > 0 && (
                  <div className="px-6 pt-3 flex gap-2 overflow-x-auto flex-shrink-0 [-webkit-app-region:no-drag] scrollbar-none">
                    <button
                      onClick={() => { setSelectedCategory(null); setSelectedIndex(0); }}
                      className="flex items-center h-7 px-3 rounded-full text-[11px] font-medium shrink-0 focus:outline-none transition-colors"
                      style={
                        selectedCategory === null
                          ? { background: "#C9A962", color: "#1A1A1C" }
                          : { border: "1px solid #3A3A3C", color: "#6E6E70" }
                      }
                    >
                      All
                    </button>
                    {uniqueCategories.map((cat) => {
                      const isActive = selectedCategory === cat;
                      const color = getCategoryColorHex(cat);
                      return (
                        <button
                          key={cat}
                          onClick={() => { setSelectedCategory(cat); setSelectedIndex(0); }}
                          className="flex items-center gap-1.5 h-7 px-3 rounded-full text-[11px] shrink-0 focus:outline-none transition-colors"
                          style={
                            isActive
                              ? { background: "#C9A962", color: "#1A1A1C" }
                              : { border: "1px solid #3A3A3C", color: "#6E6E70" }
                          }
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ background: isActive ? "#1A1A1C" : color }}
                          />
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Document list */}
                <div className="flex-1 overflow-y-auto px-6 py-3 flex flex-col gap-2 [-webkit-app-region:no-drag]">
                  {filteredResults.length === 0 && (
                    <p
                      className="text-center mt-6 text-[13px]"
                      style={{ color: "#4A4A4C", fontFamily: "'Inter', sans-serif" }}
                    >
                      {searchTerm ? "No documents found" : "No documents yet — click + Add to get started"}
                    </p>
                  )}

                  {filteredResults.map((result, index) => {
                    const doc = result.item;
                    const barColor = getDocTypeColor(doc);
                    const isSelected = selectedIndex === index;
                    const expiry = doc.fields.expires || doc.fields.expiry || doc.fields["expiration"] || null;

                    return (
                      <div
                        key={doc.id}
                        className="flex items-center gap-3.5 px-[18px] py-[14px] rounded-[14px] cursor-pointer focus:outline-none transition-colors"
                        style={{
                          background: isSelected ? "#2A2A2C" : "#242426",
                          boxShadow: isSelected ? `inset 0 0 0 1px ${barColor}40` : undefined,
                        }}
                        onClick={() => setSelectedIndex(index)}
                      >
                        {/* Colored left bar */}
                        <div
                          className="w-[3px] rounded-sm shrink-0"
                          style={{ height: 40, background: barColor }}
                        />

                        {/* Document info */}
                        <div className="flex-1 min-w-0 flex flex-col gap-[3px]">
                          <span
                            className="text-[18px] font-medium text-[#F5F5F0] leading-tight truncate"
                            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                          >
                            {doc.type}
                          </span>
                          <div
                            className="flex items-center gap-2 flex-wrap"
                            style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}
                          >
                            {doc.category && (
                              <span
                                className="flex items-center gap-1 text-[11px] font-medium"
                                style={{ color: barColor }}
                              >
                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: barColor }} />
                                {doc.category}
                              </span>
                            )}
                            {doc.owner && (
                              <span className="text-[11px]" style={{ color: "#6E6E70" }}>
                                {doc.owner}
                              </span>
                            )}
                            {expiry && (
                              <span className="text-[11px]" style={{ color: "#6E6E70" }}>
                                Exp: {expiry}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action buttons: copy → open → edit */}
                        <div className="flex gap-1.5 shrink-0">
                          {/* Copy — gold icon per design */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const value = doc.fields[doc.defaultField];
                              if (value) handleCopy(value);
                            }}
                            className="w-[30px] h-[30px] rounded-full flex items-center justify-center focus:outline-none transition-colors hover:border-[#6E6E70]"
                            style={{ border: "1px solid #3A3A3C", color: "#C9A962" }}
                            aria-label="Copy"
                            title="Copy default field"
                          >
                            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                              <rect x="4.5" y="4.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                              <path d="M3 8.5H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5a1 1 0 0 1 1 1v1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                            </svg>
                          </button>
                          {/* Open — gray icon, only when fileLink exists */}
                          {doc.fileLink && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenFile(doc.fileLink);
                              }}
                              className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[#6E6E70] hover:text-[#F5F5F0] hover:border-[#6E6E70] focus:outline-none transition-colors"
                              style={{ border: "1px solid #3A3A3C" }}
                              aria-label="Open file"
                              title="Open linked file"
                            >
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path d="M5 2H2a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                                <path d="M7.5 1H11v3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M11 1 6 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                              </svg>
                            </button>
                          )}
                          {/* Edit — gray pencil icon */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditDocument(doc);
                            }}
                            className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[#6E6E70] hover:text-[#F5F5F0] hover:border-[#6E6E70] focus:outline-none transition-colors"
                            style={{ border: "1px solid #3A3A3C" }}
                            aria-label="Edit"
                            title="Edit document"
                          >
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                              <path d="M8.5 1.5a1.414 1.414 0 0 1 2 2L4 10 1 11l1-3 6.5-6.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer */}
                <div
                  className="flex justify-between items-center px-6 py-3 flex-shrink-0"
                  style={{ borderTop: "1px solid #2A2A2C" }}
                >
                  <span
                    className="text-[11px]"
                    style={{ color: "#4A4A4C", fontFamily: "'Inter', sans-serif" }}
                  >
                    {allDocuments.length} {allDocuments.length === 1 ? "document" : "documents"}
                  </span>
                  <div className="flex gap-3 items-center">
                    {[
                      { key: "Esc", label: "close" },
                      { key: "↵", label: "copy" },
                      { key: "↑↓", label: "navigate" },
                    ].map(({ key, label }) => (
                      <span key={key} className="flex items-center gap-1">
                        <kbd
                          className="inline-flex items-center justify-center h-5 px-1.5 rounded text-[10px]"
                          style={{
                            background: "#2A2A2C",
                            color: "#6E6E70",
                            fontFamily: "'Inter', sans-serif",
                          }}
                        >
                          {key}
                        </kbd>
                        <span
                          className="text-[10px]"
                          style={{ color: "#4A4A4C", fontFamily: "'Inter', sans-serif" }}
                        >
                          {label}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        );
      }
    }
  };

  return (
    // Apply drag region to the main app container and add keyDown handler
    <div
      className="flex flex-col h-screen overflow-hidden relative [-webkit-app-region:drag]"
      style={{
        background: "#1A1A1C",
        color: "#F5F5F0",
        borderRadius: 16,
        border: "1px solid #3A3A3C",
      }}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {renderContent()}
    </div>
  );
}

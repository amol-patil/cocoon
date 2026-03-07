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

// View Document Modal (matches cocoon-designs.pen "View Document Modal")
interface ViewDocumentModalProps {
  doc: Document;
  onClose: () => void;
  onEdit: (doc: Document) => void;
  onCopy: (text: string, label?: string) => void;
  onOpenFile: (link: string) => void;
}
function ViewDocumentModal({
  doc,
  onClose,
  onEdit,
  onCopy,
  onOpenFile,
}: ViewDocumentModalProps) {
  const catColor = getCategoryColorHex(doc.category || doc.type || "");
  const fieldEntries = Object.entries(doc.fields).filter(([, v]) => v);

  const handleCopyAll = () => {
    const allText = fieldEntries.map(([k, v]) => `${k}: ${v}`).join("\n");
    onCopy(allText, "All Fields");
  };

  return (
    <div className="flex flex-col h-full [-webkit-app-region:no-drag]" style={{ background: "#1A1A1C", borderRadius: 20 }}>
      {/* Header */}
      <div
        className="flex items-center justify-between shrink-0"
        style={{ padding: "20px 24px", borderBottom: "1px solid #3A3A3C" }}
      >
        <div className="flex flex-col gap-0.5">
          <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 600, color: "#F5F5F0" }}>
            {doc.type}
          </span>
          <div className="flex items-center gap-2" style={{ fontFamily: "'Inter', sans-serif" }}>
            {doc.category && (
              <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: catColor }}>
                <span className="w-2 h-2 rounded-full" style={{ background: catColor }} />
                {doc.category}
              </span>
            )}
            {doc.category && doc.owner && (
              <span className="text-xs" style={{ color: "#6E6E70" }}>·</span>
            )}
            {doc.owner && (
              <span className="text-xs" style={{ color: "#9A9A9E" }}>{doc.owner}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(doc)}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg focus:outline-none transition-colors hover:border-[#6E6E70]"
            style={{ border: "1px solid #3A3A3C" }}
          >
            <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
              <path d="M8.5 1.5a1.414 1.414 0 0 1 2 2L4 10 1 11l1-3 6.5-6.5Z" stroke="#9A9A9E" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 500, color: "#9A9A9E" }}>Edit</span>
          </button>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center focus:outline-none transition-colors hover:border-[#6E6E70]"
            style={{ border: "1px solid #3A3A3C" }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2l10 10M12 2L2 12" stroke="#9A9A9E" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Body: two columns */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left column: Document Info */}
        <div
          className="flex flex-col gap-6 overflow-y-auto shrink-0"
          style={{ width: 320, padding: 24, borderRight: "1px solid #3A3A3C" }}
        >
          <span style={{ color: "#6E6E70", fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: 1 }}>
            DOCUMENT INFO
          </span>

          {/* Type */}
          <div className="flex flex-col gap-1">
            <span style={{ color: "#9A9A9E", fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 500 }}>Type</span>
            <span style={{ color: "#F5F5F0", fontFamily: "'Inter', sans-serif", fontSize: 14 }}>{doc.type}</span>
          </div>

          {/* Owner */}
          {doc.owner && (
            <div className="flex flex-col gap-1">
              <span style={{ color: "#9A9A9E", fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 500 }}>Owner</span>
              <span style={{ color: "#F5F5F0", fontFamily: "'Inter', sans-serif", fontSize: 14 }}>{doc.owner}</span>
            </div>
          )}

          {/* Category */}
          {doc.category && (
            <div className="flex flex-col gap-1">
              <span style={{ color: "#9A9A9E", fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 500 }}>Category</span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: catColor }} />
                <span style={{ color: "#F5F5F0", fontFamily: "'Inter', sans-serif", fontSize: 14 }}>{doc.category}</span>
              </div>
            </div>
          )}

          {/* File Link */}
          {doc.fileLink && (
            <div className="flex flex-col gap-1">
              <span style={{ color: "#9A9A9E", fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 500 }}>Google Drive Link</span>
              <button
                onClick={() => onOpenFile(doc.fileLink)}
                className="flex items-center gap-2 focus:outline-none group"
              >
                <span
                  className="text-xs truncate"
                  style={{ color: "#C9A962", fontFamily: "'Inter', sans-serif", maxWidth: 240 }}
                >
                  {doc.fileLink}
                </span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
                  <path d="M5 2H2a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V7" stroke="#C9A962" strokeWidth="1.2" strokeLinecap="round"/>
                  <path d="M7.5 1H11v3.5" stroke="#C9A962" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M11 1 6 6" stroke="#C9A962" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          )}

          {/* Divider + Temporary indicator */}
          {doc.isTemporary && (
            <>
              <div style={{ height: 1, background: "#3A3A3C" }} />
              <div
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
                style={{ background: "#242426" }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="5.5" stroke="#6E6E70" strokeWidth="1.1"/>
                  <path d="M7 4.2v3.1l1.8 1.8" stroke="#6E6E70" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span style={{ color: "#6E6E70", fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 500 }}>
                  Temporary Item
                </span>
              </div>
            </>
          )}
        </div>

        {/* Right column: Fields */}
        <div className="flex flex-col gap-4 flex-1 overflow-y-auto" style={{ padding: 24 }}>
          <div className="flex items-center justify-between">
            <span style={{ color: "#6E6E70", fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: 1 }}>
              FIELDS
            </span>
            {fieldEntries.length > 0 && (
              <button
                onClick={handleCopyAll}
                className="flex items-center gap-1.5 h-7 px-2.5 rounded-md focus:outline-none transition-colors hover:border-[#6E6E70]"
                style={{ border: "1px solid #3A3A3C" }}
              >
                <svg width="12" height="12" viewBox="0 0 13 13" fill="none">
                  <rect x="4.5" y="4.5" width="7" height="7" rx="1.5" stroke="#6E6E70" strokeWidth="1.2"/>
                  <path d="M3 8.5H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5a1 1 0 0 1 1 1v1" stroke="#6E6E70" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                <span style={{ color: "#6E6E70", fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 500 }}>Copy All</span>
              </button>
            )}
          </div>

          {fieldEntries.length > 0 ? (
            <div style={{ borderRadius: 14, border: "1px solid #3A3A3C", background: "#242426", overflow: "hidden" }}>
              {fieldEntries.map(([key, value], idx) => (
                <div key={key}>
                  {idx > 0 && <div style={{ height: 1, background: "#3A3A3C" }} />}
                  <div className="flex items-center justify-between" style={{ padding: "14px 18px" }}>
                    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                      <span style={{ color: "#9A9A9E", fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 500 }}>{key}</span>
                      <span style={{ color: "#F5F5F0", fontFamily: "'Inter', sans-serif", fontSize: 14 }}>{value}</span>
                    </div>
                    <button
                      onClick={() => value && onCopy(value, key)}
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 focus:outline-none transition-colors hover:border-[#6E6E70]"
                      style={{ border: "1px solid #3A3A3C" }}
                      aria-label={`Copy ${key}`}
                    >
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <rect x="4.5" y="4.5" width="7" height="7" rx="1.5" stroke="#C9A962" strokeWidth="1.2"/>
                        <path d="M3 8.5H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5a1 1 0 0 1 1 1v1" stroke="#C9A962" strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              className="flex items-center justify-center flex-1"
              style={{ color: "#4A4A4C", fontFamily: "'Inter', sans-serif", fontSize: 13 }}
            >
              No fields
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-end gap-2 shrink-0"
        style={{ padding: "14px 24px", borderTop: "1px solid #3A3A3C" }}
      >
        <button
          onClick={onClose}
          className="flex items-center justify-center h-9 px-5 rounded-[10px] focus:outline-none transition-colors hover:border-[#6E6E70]"
          style={{ border: "1px solid #3A3A3C", color: "#9A9A9E", fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500 }}
        >
          Close
        </button>
        <button
          onClick={() => onEdit(doc)}
          className="flex items-center gap-1.5 h-9 px-5 rounded-[10px] focus:outline-none transition-colors hover:opacity-90"
          style={{ background: "#C9A962", fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, color: "#1A1A1C" }}
        >
          <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
            <path d="M8.5 1.5a1.414 1.414 0 0 1 2 2L4 10 1 11l1-3 6.5-6.5Z" stroke="#1A1A1C" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Edit Document
        </button>
      </div>
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
  availableOwners: string[];
  availableCategories: string[];
  onRenameOwner: (oldName: string, newName: string) => void;
  onDeleteOwner: (name: string) => void;
  onCreateOwner: (name: string) => void;
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
  availableOwners,
  availableCategories,
  onRenameOwner,
  onDeleteOwner,
  onCreateOwner,
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
  const [isDefaultOpen, setIsDefaultOpen] = useState(false);
  const [isOwnerOpen, setIsOwnerOpen] = useState(false);
  const [ownerSearch, setOwnerSearch] = useState("");
  const [editingOwner, setEditingOwner] = useState<string | null>(null);
  const [editingOwnerValue, setEditingOwnerValue] = useState("");
  const [isCatOpen, setIsCatOpen] = useState(false);
  const [catSearch, setCatSearch] = useState("");
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editingCatValue, setEditingCatValue] = useState("");
  const defaultRef = useRef<HTMLDivElement>(null);
  const ownerRef = useRef<HTMLDivElement>(null);
  const catRef = useRef<HTMLDivElement>(null);

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
      if (defaultRef.current && !defaultRef.current.contains(e.target as Node)) setIsDefaultOpen(false);
      if (ownerRef.current && !ownerRef.current.contains(e.target as Node)) setIsOwnerOpen(false);
      if (catRef.current && !catRef.current.contains(e.target as Node)) setIsCatOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredOwners = availableOwners.filter(o =>
    o.toLowerCase().includes(ownerSearch.toLowerCase())
  );
  const trimmedOwnerSearch = ownerSearch.trim();
  const showCreateOwner = trimmedOwnerSearch && !availableOwners.some(o => o.toLowerCase() === trimmedOwnerSearch.toLowerCase());

  const selectOrCreateOwner = (name: string) => {
    const isNew = !availableOwners.some(o => o.toLowerCase() === name.toLowerCase());
    setOwner(name);
    if (isNew) onCreateOwner(name);
    setIsOwnerOpen(false);
    setOwnerSearch("");
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

          {/* Owner — custom dropdown */}
          <div className="flex flex-col gap-1.5 relative" ref={ownerRef}>
            <label style={labelStyle}>Owner</label>
            <button
              type="button"
              onClick={() => { setIsOwnerOpen(o => !o); setOwnerSearch(""); }}
              className="flex items-center justify-between h-10 px-[14px] rounded-[10px] text-left focus:outline-none"
              style={{
                background: "#242426",
                border: `1px solid ${isOwnerOpen ? "#C9A962" : "#3A3A3C"}`,
                color: owner ? "#F5F5F0" : "#4A4A4C",
                fontFamily: "'Inter', sans-serif", fontSize: 13,
              }}
            >
              <span className="flex items-center gap-2">
                {owner && (
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: getCategoryColorHex(owner) }} />
                )}
                {owner || "Select or create…"}
              </span>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: "#6E6E70" }}>
                <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {isOwnerOpen && (
              <div
                className="absolute left-0 right-0 z-50 overflow-hidden"
                style={{ top: "calc(100% + 4px)", background: "#2A2A2C", border: "1px solid #3A3A3C", borderRadius: 10 }}
              >
                <div className="px-3 py-2" style={{ borderBottom: "1px solid #3A3A3C" }}>
                  <input
                    style={{ ...inputStyle, height: 32, background: "transparent", border: "none", fontSize: 12, padding: "0 4px" }}
                    placeholder="Search or create…"
                    value={ownerSearch}
                    onChange={e => setOwnerSearch(e.target.value)}
                    onClick={e => e.stopPropagation()}
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (showCreateOwner) selectOrCreateOwner(trimmedOwnerSearch);
                        else if (filteredOwners.length === 1) selectOrCreateOwner(filteredOwners[0]);
                      } else if (e.key === "Escape") {
                        e.preventDefault();
                        setIsOwnerOpen(false);
                      }
                    }}
                    autoFocus
                  />
                </div>
                {filteredOwners.map(o => (
                  <div
                    key={o}
                    className="group flex items-center justify-between w-full h-9 px-3.5"
                    style={{ background: o === owner ? "#C9A96214" : "transparent" }}
                  >
                    {editingOwner === o ? (
                      <input
                        className="flex-1 focus:outline-none bg-transparent"
                        style={{ color: "#F5F5F0", fontFamily: "'Inter', sans-serif", fontSize: 13 }}
                        value={editingOwnerValue}
                        autoFocus
                        onChange={e => setEditingOwnerValue(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const trimmed = editingOwnerValue.trim();
                            if (trimmed && trimmed !== o) {
                              onRenameOwner(o, trimmed);
                              if (owner === o) setOwner(trimmed);
                            }
                            setEditingOwner(null);
                          } else if (e.key === "Escape") {
                            e.preventDefault();
                            setEditingOwner(null);
                          }
                        }}
                        onBlur={() => {
                          const trimmed = editingOwnerValue.trim();
                          if (trimmed && trimmed !== o) {
                            onRenameOwner(o, trimmed);
                            if (owner === o) setOwner(trimmed);
                          }
                          setEditingOwner(null);
                        }}
                        onClick={e => e.stopPropagation()}
                      />
                    ) : (
                      <button
                        type="button"
                        className="flex items-center gap-2.5 flex-1 text-left focus:outline-none overflow-hidden min-w-0"
                        style={{ color: "#F5F5F0", fontFamily: "'Inter', sans-serif", fontSize: 13 }}
                        onClick={() => selectOrCreateOwner(o)}
                      >
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: getCategoryColorHex(o) }} />
                        <span className="truncate">{o}</span>
                      </button>
                    )}
                    {editingOwner !== o && (
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                        <button
                          type="button"
                          className="focus:outline-none"
                          style={{ color: "#6E6E70", lineHeight: 0 }}
                          onClick={e => { e.stopPropagation(); setEditingOwner(o); setEditingOwnerValue(o); }}
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
                          onClick={e => { e.stopPropagation(); onDeleteOwner(o); if (owner === o) setOwner(""); }}
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
                {showCreateOwner && (
                  <button
                    type="button"
                    className="flex items-center gap-2 w-full h-9 px-3.5 text-left focus:outline-none"
                    style={{ borderTop: "1px solid #3A3A3C", color: "#C9A962", fontFamily: "'Inter', sans-serif", fontSize: 13 }}
                    onClick={() => selectOrCreateOwner(trimmedOwnerSearch)}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                    </svg>
                    Create "{ownerSearch.trim()}"
                  </button>
                )}
              </div>
            )}
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
type AppViewMode = "search" | "editForm" | "settings" | "viewDocument";

// --- Main App Component ---
export default function App() {
  // === State ===
  const [allDocuments, setAllDocuments] = useState<Document[]>([]);
  const [appSettings, setAppSettings] = useState<{ clipboardAutoClearSeconds: number }>({ clipboardAutoClearSeconds: 30 });
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Loading state
  const [error, setError] = useState<string | null>(null); // Error state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<AppViewMode>("search");
  const [docToEdit, setDocToEdit] = useState<Document | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [editReturnView, setEditReturnView] = useState<AppViewMode>("search");
  const [showClearConfirm, setShowClearConfirm] = useState(false);

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
    // Also load settings
    window.ipc.invoke("get-settings").then((settings: any) => {
      setAppSettings({ clipboardAutoClearSeconds: settings.clipboardAutoClearSeconds ?? 30 });
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
      const updatedDocs = allDocuments.map(doc =>
        doc.category === oldName ? { ...doc, category: newName } : doc
      );
      setAllDocuments(updatedDocs);
      await saveDocumentsIPC(updatedDocs);
    },
    [allDocuments, saveDocumentsIPC],
  );

  const handleCreateCategory = useCallback((_name: string) => {
    // Categories are created inline on documents; nothing extra to persist here
  }, []);

  const handleDeleteCategory = useCallback(
    async (name: string) => {
      const updatedDocs = allDocuments.map(doc =>
        doc.category === name ? { ...doc, category: undefined } : doc
      );
      setAllDocuments(updatedDocs);
      await saveDocumentsIPC(updatedDocs);
    },
    [allDocuments, saveDocumentsIPC],
  );

  const handleRenameOwner = useCallback(
    async (oldName: string, newName: string) => {
      const updatedDocs = allDocuments.map(doc =>
        doc.owner === oldName ? { ...doc, owner: newName } : doc
      );
      setAllDocuments(updatedDocs);
      await saveDocumentsIPC(updatedDocs);
    },
    [allDocuments, saveDocumentsIPC],
  );

  const handleCreateOwner = useCallback((_name: string) => {
    // Owners are created inline on documents; nothing extra to persist here
  }, []);

  const handleDeleteOwner = useCallback(
    async (name: string) => {
      const updatedDocs = allDocuments.map(doc =>
        doc.owner === name ? { ...doc, owner: undefined } : doc
      );
      setAllDocuments(updatedDocs);
      await saveDocumentsIPC(updatedDocs);
    },
    [allDocuments, saveDocumentsIPC],
  );

  const handleClearTemporary = useCallback(async () => {
    const updatedDocs = allDocuments.filter(doc => !doc.isTemporary);
    setAllDocuments(updatedDocs);
    setShowClearConfirm(false);
    await saveDocumentsIPC(updatedDocs);
  }, [allDocuments, saveDocumentsIPC]);

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
            category: docData.category || undefined,
            fileLink: docData.fileLink || "",
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
  const handleCopy = useCallback((text: string, label?: string) => {
    try {
      window.electronClipboard.writeText(text);

      // Show toast
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      setToastMessage(label ? `${label} Copied` : "Copied");
      toastTimerRef.current = setTimeout(() => setToastMessage(null), 2000);

      // Schedule clipboard auto-clear
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      if (appSettings.clipboardAutoClearSeconds > 0) {
        clearTimerRef.current = setTimeout(() => {
          window.ipc.send("clear-clipboard", null);
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

        // Close confirmation dialog first
        if (showClearConfirm) {
          setShowClearConfirm(false);
        }
        // For expanded card view, just collapse
        else if (viewMode === "search" && expandedDocId) {
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
  }, [viewMode, expandedDocId, handleCancelEdit, hideWindow, showClearConfirm]);

  // === Keyboard Handler ===
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement> | KeyboardEvent) => {
      // First handle Escape key globally to dismiss window regardless of view
      if (event.key === "Escape") {
        event.preventDefault();
        // For view document modal, go back to search
        if (viewMode === "viewDocument") {
          setExpandedDocId(null);
          setViewMode("search");
        } else if (viewMode === "search" && expandedDocId) {
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
      if (viewMode === "viewDocument") {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          setExpandedDocId(null);
          setViewMode("search");
        }
        return;
      }
      if (viewMode === "search") {
        // --- Search Mode Key Handling ---
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
                setViewMode("viewDocument");
              }
              break;
            case "Enter":
              event.preventDefault();
              if (filteredResults[selectedIndex]) {
                const item = filteredResults[selectedIndex].item;
                const value = item.fields[item.defaultField];
                if (value) handleCopy(value, item.defaultField);
              }
              break;
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
      window.ipc.send("resize-window", { width: 760, height: 560 });
    } else if (viewMode === "settings") {
      window.ipc.send("resize-window", { width: 760, height: 620 });
    } else if (viewMode === "viewDocument") {
      window.ipc.send("resize-window", { width: 760, height: 680 });
    } else {
      window.ipc.send("resize-window", { width: 760, height: 480 });
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
            availableOwners={[...new Set(allDocuments.map(d => d.owner).filter(Boolean) as string[])]}
            availableCategories={uniqueCategories}
            onRenameOwner={handleRenameOwner}
            onDeleteOwner={handleDeleteOwner}
            onCreateOwner={handleCreateOwner}
            onRenameCategory={handleRenameCategory}
            onDeleteCategory={handleDeleteCategory}
            onCreateCategory={handleCreateCategory}
          />
        );
      }
      case "settings": {
        return <SettingsView onBack={() => setViewMode("search")} onDataChanged={() => {
          window.ipc.invoke<Document[]>("load-documents").then((docs) => {
            setAllDocuments(docs);
          }).catch(() => {});
        }} />;
      }
      case "viewDocument": {
        const viewDoc = expandedDocId ? allDocuments.find((d) => d.id === expandedDocId) : null;
        if (!viewDoc) { setViewMode("search"); return null; }
        return (
          <ViewDocumentModal
            doc={viewDoc}
            onClose={() => { setExpandedDocId(null); setViewMode("search"); }}
            onEdit={(d) => { handleEditDocument(d); }}
            onCopy={handleCopy}
            onOpenFile={handleOpenFile}
          />
        );
      }
      case "search":
      default: {
        return (
          <div className="flex flex-col h-full">
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
                {(() => {
                  const permanentResultsWithIdx = filteredResults
                    .map((r, i) => ({ result: r, globalIndex: i }))
                    .filter(({ result }) => !result.item.isTemporary);
                  const temporaryResultsWithIdx = filteredResults
                    .map((r, i) => ({ result: r, globalIndex: i }))
                    .filter(({ result }) => result.item.isTemporary);

                  const renderDocCard = (doc: Document, globalIndex: number, isTemp: boolean) => {
                    const barColor = getDocTypeColor(doc);
                    const isSelected = selectedIndex === globalIndex;
                    const expiry = doc.fields.expires || doc.fields.expiry || doc.fields["expiration"] || null;

                    return (
                      <div
                        key={doc.id}
                        className="flex items-center gap-3.5 px-[18px] py-[14px] rounded-[14px] cursor-pointer focus:outline-none transition-colors"
                        style={{
                          background: isSelected ? "#2A2A2C" : "#242426",
                          boxShadow: isSelected
                            ? `inset 0 0 0 1px ${barColor}40`
                            : isTemp ? "inset 0 0 0 1px #3A3A3C" : undefined,
                        }}
                        onClick={() => setSelectedIndex(globalIndex)}
                        onDoubleClick={() => { setExpandedDocId(doc.id); setViewMode("viewDocument"); }}
                      >
                        {/* Left bar: solid for permanent, dashed for temporary */}
                        {isTemp ? (
                          <div className="flex flex-col shrink-0" style={{ width: 3, gap: 4 }}>
                            {[0, 1, 2, 3].map(i => (
                              <div
                                key={i}
                                style={{
                                  width: 3,
                                  height: 8,
                                  borderRadius: 2,
                                  background: i % 2 === 0 ? "#6E6E70" : "transparent",
                                }}
                              />
                            ))}
                          </div>
                        ) : (
                          <div
                            className="w-[3px] rounded-sm shrink-0"
                            style={{ height: 40, background: barColor }}
                          />
                        )}

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
                            {isTemp && (
                              <span
                                className="flex items-center gap-1 text-[11px] font-medium"
                                style={{ color: "#6E6E70" }}
                              >
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0 }}>
                                  <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.1"/>
                                  <path d="M5 3v2.2l1.3 1.3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Temporary
                              </span>
                            )}
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
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const value = doc.fields[doc.defaultField];
                              if (value) handleCopy(value, doc.defaultField);
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
                  };

                  return (
                    <div className="flex-1 overflow-y-auto px-6 py-3 flex flex-col gap-2 [-webkit-app-region:no-drag]">
                      {filteredResults.length === 0 && (
                        <p
                          className="text-center mt-6 text-[13px]"
                          style={{ color: "#4A4A4C", fontFamily: "'Inter', sans-serif" }}
                        >
                          {searchTerm ? "No documents found" : "No documents yet — click + Add to get started"}
                        </p>
                      )}

                      {/* Permanent documents */}
                      {permanentResultsWithIdx.map(({ result, globalIndex }) =>
                        renderDocCard(result.item, globalIndex, false)
                      )}

                      {/* Temporary section header */}
                      {temporaryResultsWithIdx.length > 0 && (
                        <div className="flex items-center justify-between pt-1 pb-0.5 [-webkit-app-region:no-drag]">
                          <div className="flex items-center gap-1.5">
                            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                              <circle cx="5.5" cy="5.5" r="4.5" stroke="#6E6E70" strokeWidth="1.1"/>
                              <path d="M5.5 3.2v2.5l1.5 1.5" stroke="#6E6E70" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span
                              style={{
                                color: "#6E6E70",
                                fontFamily: "'Inter', sans-serif",
                                fontSize: 10,
                                fontWeight: 600,
                                letterSpacing: "0.08em",
                              }}
                            >
                              TEMPORARY ITEMS
                            </span>
                          </div>
                          <button
                            onClick={() => setShowClearConfirm(true)}
                            className="focus:outline-none transition-colors hover:opacity-80"
                            style={{
                              color: "#D94A4A",
                              fontFamily: "'Inter', sans-serif",
                              fontSize: 11,
                              fontWeight: 500,
                            }}
                          >
                            Clear all
                          </button>
                        </div>
                      )}

                      {/* Temporary documents */}
                      {temporaryResultsWithIdx.map(({ result, globalIndex }) =>
                        renderDocCard(result.item, globalIndex, true)
                      )}
                    </div>
                  );
                })()}

                {/* Footer */}
                <div
                  className="flex justify-between items-center px-6 py-3 flex-shrink-0 [-webkit-app-region:no-drag]"
                  style={{ borderTop: "1px solid #2A2A2C" }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="text-[11px]"
                      style={{ color: "#4A4A4C", fontFamily: "'Inter', sans-serif" }}
                    >
                      {allDocuments.length} {allDocuments.length === 1 ? "document" : "documents"}
                    </span>
                    {allDocuments.some(d => d.isTemporary) && (
                      <button
                        onClick={() => setShowClearConfirm(true)}
                        className="flex items-center gap-1 focus:outline-none transition-colors hover:opacity-80"
                        style={{ color: "#D94A4A", fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 500 }}
                      >
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.1"/>
                          <path d="M5 3v2.2l1.3 1.3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Clear temporary
                      </button>
                    )}
                  </div>
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

                {/* Clear Temporary Confirmation Popover */}
                {showClearConfirm && (() => {
                  const tempDocs = allDocuments.filter(d => d.isTemporary);
                  return (
                    <div
                      className="absolute inset-0 flex items-end justify-center [-webkit-app-region:no-drag]"
                      style={{ paddingBottom: 56, paddingLeft: 24, paddingRight: 24, zIndex: 50 }}
                      onClick={() => setShowClearConfirm(false)}
                    >
                      <div
                        className="w-[260px] overflow-hidden"
                        style={{
                          background: "#2A2A2C",
                          border: "1px solid #C9A962",
                          borderRadius: 14,
                          boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
                          position: "relative",
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Gold triangle arrow pointing down toward footer */}
                        <div
                          style={{
                            position: "absolute",
                            bottom: -7,
                            left: "50%",
                            transform: "translateX(-50%)",
                            width: 0,
                            height: 0,
                            borderLeft: "7px solid transparent",
                            borderRight: "7px solid transparent",
                            borderTop: "7px solid #C9A962",
                          }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            bottom: -5,
                            left: "50%",
                            transform: "translateX(-50%)",
                            width: 0,
                            height: 0,
                            borderLeft: "6px solid transparent",
                            borderRight: "6px solid transparent",
                            borderTop: "6px solid #2A2A2C",
                          }}
                        />

                        {/* Header */}
                        <div className="flex flex-col gap-2 px-4 pt-4 pb-3">
                          <div className="flex items-start gap-2.5">
                            <div
                              className="flex items-center justify-center shrink-0 mt-0.5"
                              style={{ width: 28, height: 28, borderRadius: "50%", background: "#D94A4A20" }}
                            >
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path d="M2 3.5h10M5 3.5V2.5h4v1M4 3.5l.5 8h5l.5-8" stroke="#D94A4A" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span style={{ color: "#F5F5F0", fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600 }}>
                                Remove temporary items?
                              </span>
                              <span style={{ color: "#6E6E70", fontFamily: "'Inter', sans-serif", fontSize: 11, lineHeight: 1.4 }}>
                                {tempDocs.length === 1
                                  ? `"${tempDocs[0].type}" will be removed.`
                                  : tempDocs.map(d => `"${d.type}"`).join(", ") + " will be removed."}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Footer */}
                        <div
                          className="flex items-center justify-end gap-2 px-4 py-3"
                          style={{ borderTop: "1px solid #3A3A3C" }}
                        >
                          <button
                            onClick={() => setShowClearConfirm(false)}
                            className="flex items-center justify-center h-8 px-4 rounded-[8px] focus:outline-none transition-colors hover:border-[#6E6E70]"
                            style={{ border: "1px solid #3A3A3C", color: "#6E6E70", fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 500 }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleClearTemporary}
                            className="flex items-center justify-center h-8 px-4 rounded-[8px] focus:outline-none transition-colors hover:opacity-90"
                            style={{ background: "#D94A4A", color: "#FFFFFF", fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600 }}
                          >
                            Remove all
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
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

      {/* Copy Toast */}
      {toastMessage && (
        <div
          className="absolute flex items-center justify-center pointer-events-none"
          style={{ bottom: 20, left: 0, right: 0, zIndex: 100 }}
        >
          <div
            className="flex items-center gap-2.5 pointer-events-auto"
            style={{
              height: 44,
              paddingLeft: 16,
              paddingRight: 20,
              borderRadius: 22,
              background: "#242426",
              border: "1px solid #C9A962",
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            <div
              className="flex items-center justify-center"
              style={{ width: 22, height: 22, borderRadius: 11, background: "#C9A96222" }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2.5 6.5L5 9l4.5-6" stroke="#C9A962" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={{ fontSize: 13, fontWeight: 500, color: "#F5F5F0" }}>
              {toastMessage}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useMemo, useState, useEffect } from "react";
import { 
  saveDocument, 
  updateDocument, 
  loadDocument, 
  getAllDocuments, 
  deleteDocument,
  generateShareableLink 
} from './database';

function parseTextToJSON(raw) {
  const lines = raw.split(/\r?\n/).map((l) => l.trim());
  const sections = [];
  let current = null;
  const isDashLine = (s) => /^-+$/.test(s);

  for (const line of lines) {
    if (!line) continue;
    if (isDashLine(line)) {
      current = null;
      continue;
    }
    const colonIdx = line.indexOf(":");
    const looksLikeItem = colonIdx > 0 && colonIdx < line.length - 1;

    if (!looksLikeItem) {
      current = { name: line, items: [] };
      sections.push(current);
      continue;
    }
    if (!current) {
      current = { name: "Untitled", items: [] };
      sections.push(current);
    }
    const name = line.slice(0, colonIdx).trim();
    const valueRaw = line.slice(colonIdx + 1).trim();
    
    // Check if item is marked as excluded
    const isExcluded = name.startsWith('[X] ');
    const cleanName = isExcluded ? name.substring(4) : name;
    
    const normalizeDigits = (s) =>
      s
        .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d))
        .replace(/،/g, ".");
    const normalized = normalizeDigits(valueRaw);
    const asNum = Number(normalized);
    const value = !Number.isNaN(asNum) && normalized !== "" ? asNum : valueRaw;
    current.items.push({ name: cleanName, value, excluded: isExcluded });
  }

  let grandTotal = 0;
  for (const sec of sections) {
    const total = sec.items.reduce((sum, it) => {
      const v = typeof it.value === "number" && !it.excluded ? it.value : 0;
      return sum + v;
    }, 0);
    sec.total = total;
    grandTotal += total;
  }

  return { sections, grandTotal };
}

export default function App() {
  const [text, setText] = useState(`المبطخ\nالهيكل:17\nتلاجه: 30\nغساله: 25\nسخان غاز: 7\nمكواة: 2.5\nمكنسة:6\nكاتل:1.5\nكيتشن ماشين: 10\nطقم قهوة: 1\nطقم شاي: 0.5\nمجات: 1\nاطقم عصير: 5\nطقم ضيوف:1\nصواني ضيوف:2\nطقم طاسه:3\nطقمين حلل:15\nطقمين اطباق:3\nشوك وملاعق:3.2\nحافظات:2\n مغارف:1\n---\nالمجلس\nركنة: 50\nسفرة:15\nتلفزيون مع طرابيزة: 20\n 5 ستائر: 6\n\n\n---`);

  const data = useMemo(() => parseTextToJSON(text), [text]);
  const [copied, setCopied] = useState(false);
  const [editableData, setEditableData] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Initialize editable data when main data changes
  useEffect(() => {
    if (!isEditMode) {
      setEditableData(JSON.parse(JSON.stringify(data))); // Deep clone
    }
  }, [data, isEditMode]);

  // Database-related state
  const [documentId, setDocumentId] = useState(null);
  const [documentTitle, setDocumentTitle] = useState('');
  const [savedDocuments, setSavedDocuments] = useState([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Toast notification function
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  // Load document from URL parameter on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const docId = urlParams.get('doc');
    if (docId) {
      loadDocumentById(docId);
    }
  }, []);

  const loadDocumentById = async (id) => {
    try {
      setLoading(true);
      setError('');
      const doc = await loadDocument(id);
      setText(doc.text);
      setDocumentTitle(doc.title);
      setDocumentId(id);
      // Update URL without page reload
      window.history.replaceState({}, '', `?doc=${id}`);
    } catch (err) {
      setError('Failed to load document: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!documentTitle.trim()) {
      setError('Please enter a title for your document');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      let id;
      if (documentId) {
        // Update existing document
        id = await updateDocument(documentId, documentTitle, text, data);
      } else {
        // Create new document
        id = await saveDocument(documentTitle, text, data);
        setDocumentId(id);
        // Update URL
        window.history.replaceState({}, '', `?doc=${id}`);
      }
      
      setShowSaveDialog(false);
    } catch (err) {
      setError('Failed to save document: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadDocuments = async () => {
    try {
      setLoading(true);
      setError('');
      const docs = await getAllDocuments();
      setSavedDocuments(docs);
      setShowLoadDialog(true);
    } catch (err) {
      setError('Failed to load documents: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setShowDeleteConfirm(id);
  };

  const confirmDelete = async (id) => {
    try {
      setLoading(true);
      await deleteDocument(id);
      setSavedDocuments(docs => docs.filter(doc => doc.id !== id));
      
      // If we're deleting the current document, clear it
      if (id === documentId) {
        setDocumentId(null);
        setDocumentTitle('');
        window.history.replaceState({}, '', window.location.pathname);
      }
      
      showToast('Document deleted successfully! 🗑️', 'success');
      setShowDeleteConfirm(null);
    } catch (err) {
      setError('Failed to delete document: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    if (!documentId) {
      showToast('Please save the document first to share it', 'warning');
      return;
    }
    
    const shareUrl = generateShareableLink(documentId);
    navigator.clipboard.writeText(shareUrl).then(() => {
      showToast('Share link copied to clipboard! 🔗', 'success');
    }).catch(() => {
      showToast('Could not copy to clipboard. URL: ' + shareUrl, 'info');
    });
  };

  const handleNewDocument = () => {
    setDocumentId(null);
    setDocumentTitle('');
    setText('');
    setIsEditMode(false);
    window.history.replaceState({}, '', window.location.pathname);
  };

  // Edit mode functions
  const toggleEditMode = async () => {
    if (isEditMode) {
      // Save changes back to text format
      const newText = convertDataToText(editableData);
      setText(newText);
      
      // Auto-save to Firebase if document exists
      if (documentId && documentTitle.trim()) {
        try {
          setLoading(true);
          setError('');
          await updateDocument(documentId, documentTitle, newText, editableData);
          // Show success message briefly
          showToast('Document updated successfully! ✅', 'success');
        } catch (err) {
          setError('Failed to save document: ' + err.message);
        } finally {
          setLoading(false);
        }
      }
    }
    setIsEditMode(!isEditMode);
  };

  const convertDataToText = (data) => {
    let textLines = [];
    data.sections.forEach((section, sectionIdx) => {
      if (sectionIdx > 0) {
        textLines.push('---');
      }
      textLines.push(section.name);
      section.items.forEach(item => {
        const prefix = item.excluded ? '[X] ' : '';
        textLines.push(`${prefix}${item.name}: ${item.value}`);
      });
    });
    return textLines.join('\n');
  };

  const updateSectionName = (sectionIdx, newName) => {
    const newData = { ...editableData };
    newData.sections[sectionIdx].name = newName;
    recalculateTotals(newData);
    setEditableData(newData);
  };

  const updateItemName = (sectionIdx, itemIdx, newName) => {
    const newData = { ...editableData };
    newData.sections[sectionIdx].items[itemIdx].name = newName;
    setEditableData(newData);
  };

  const updateItemValue = (sectionIdx, itemIdx, newValue) => {
    const newData = { ...editableData };
    const numValue = Number(newValue);
    newData.sections[sectionIdx].items[itemIdx].value = 
      !isNaN(numValue) && newValue.trim() !== '' ? numValue : newValue;
    recalculateTotals(newData);
    setEditableData(newData);
  };

  const toggleItemExclusion = (sectionIdx, itemIdx) => {
    const newData = { ...editableData };
    newData.sections[sectionIdx].items[itemIdx].excluded = 
      !newData.sections[sectionIdx].items[itemIdx].excluded;
    recalculateTotals(newData);
    setEditableData(newData);
  };

  const addNewItem = (sectionIdx) => {
    const newData = { ...editableData };
    newData.sections[sectionIdx].items.push({ name: 'New Item', value: 0, excluded: false });
    recalculateTotals(newData);
    setEditableData(newData);
  };

  const removeItem = (sectionIdx, itemIdx) => {
    const newData = { ...editableData };
    newData.sections[sectionIdx].items.splice(itemIdx, 1);
    recalculateTotals(newData);
    setEditableData(newData);
  };

  const addNewSection = () => {
    const newData = { ...editableData };
    newData.sections.push({
      name: 'New Section',
      items: [{ name: 'New Item', value: 0, excluded: false }],
      total: 0
    });
    recalculateTotals(newData);
    setEditableData(newData);
  };

  const removeSection = (sectionIdx) => {
    const newData = { ...editableData };
    newData.sections.splice(sectionIdx, 1);
    recalculateTotals(newData);
    setEditableData(newData);
  };

  const recalculateTotals = (data) => {
    let grandTotal = 0;
    data.sections.forEach(section => {
      const total = section.items.reduce((sum, item) => {
        const v = typeof item.value === 'number' && !item.excluded ? item.value : 0;
        return sum + v;
      }, 0);
      section.total = total;
      grandTotal += total;
    });
    data.grandTotal = grandTotal;
  };

  const jsonStr = useMemo(() => JSON.stringify(data, null, 2), [data]);

  const copyJSON = async () => {
    try {
      await navigator.clipboard.writeText(jsonStr);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
      showToast('JSON copied to clipboard! 📋', 'success');
    } catch (e) {
      showToast("Clipboard not available. Please copy manually.", 'warning');
    }
  };

  const downloadJSON = () => {
    const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "parsed-data.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadCSV = () => {
    let rows = [];
    data.sections.forEach((sec) => {
      rows.push([`Section: ${sec.name}`]);
      rows.push(["Item", "Value"]);
      sec.items.forEach((it) => {
        rows.push([it.name, typeof it.value === "number" ? it.value * 1000 + " جنية" : it.value]);
      });
      rows.push(["Subtotal", sec.total * 1000 + " جنية"]);
      rows.push([]);
    });
    rows.push(["Grand Total", data.grandTotal * 1000 + " جنية"]);
    const csvContent = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "parsed-data.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatVal = (v) =>
    typeof v === "number" ? `${(v * 1000).toLocaleString()} جنية` : v;

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="auto">
      <div className="max-w-6xl mx-auto grid gap-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">What I need in My Home</h1>
            {documentTitle && (
              <div className="text-sm text-gray-600">
                📄 {documentTitle}
              </div>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={toggleEditMode}
              className={`px-4 py-2 rounded-xl font-semibold text-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                isEditMode 
                  ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700' 
                  : 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600'
              }`}
              disabled={loading}
            >
              {isEditMode ? (loading ? '💾 Saving...' : '💾 Save Changes') : '✏️ Edit Tables'}
            </button>
            <button
              onClick={handleNewDocument}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              ✨ New
            </button>
            <button
              onClick={() => setShowSaveDialog(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              disabled={loading}
            >
              {documentId ? '🔄 Update' : '💾 Save'}
            </button>
            <button
              onClick={handleLoadDocuments}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              disabled={loading}
            >
              📂 Load
            </button>
            {documentId && (
              <button
                onClick={handleShare}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                🔗 Share
              </button>
            )}
            <button
              onClick={downloadCSV}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-gray-600 to-gray-700 text-white font-semibold hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              📊 Download CSV
            </button>
          </div>
        </header>

        {error && (
          <div className={`border-l-4 px-6 py-4 rounded-lg shadow-md ${
            error.includes('✅') 
              ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-400 text-green-700'
              : 'bg-gradient-to-r from-red-50 to-red-100 border-red-400 text-red-700'
          }`}>
            <div className="flex items-center">
              <span className="text-xl mr-2">{error.includes('✅') ? '✅' : '⚠️'}</span>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {loading && (
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-400 text-blue-700 px-6 py-4 rounded-lg shadow-md">
            <div className="flex items-center">
              <span className="text-xl mr-2 animate-spin">⏳</span>
              <span className="font-medium">Loading...</span>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toast.show && (
          <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg transform transition-all duration-300 ${
            toast.type === 'success' 
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
              : toast.type === 'warning'
              ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
              : toast.type === 'info'
              ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
              : 'bg-gradient-to-r from-red-500 to-red-600 text-white'
          }`}>
            <div className="flex items-center gap-2">
              <span className="text-lg">
                {toast.type === 'success' ? '✅' : 
                 toast.type === 'warning' ? '⚠️' : 
                 toast.type === 'info' ? 'ℹ️' : '❌'}
              </span>
              <span className="font-medium">{toast.message}</span>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-96 shadow-2xl">
              <div className="text-center">
                <div className="text-6xl mb-4">🗑️</div>
                <h3 className="text-xl font-bold mb-2 text-gray-900">Delete Document</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete this document? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => confirmDelete(showDeleteConfirm)}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                    disabled={loading}
                  >
                    {loading ? '🗑️ Deleting...' : '🗑️ Delete'}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-lg font-semibold hover:from-gray-500 hover:to-gray-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                    disabled={loading}
                  >
                    ❌ Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Save Dialog */}
        {showSaveDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96">
              <h3 className="text-lg font-bold mb-4">
                {documentId ? 'Update Document' : 'Save Document'}
              </h3>
              <input
                type="text"
                placeholder="Enter document title..."
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                className="w-full p-3 border rounded-lg mb-4"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  disabled={loading}
                >
                  {loading ? '💾 Saving...' : '💾 Save'}
                </button>
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-lg font-semibold hover:from-gray-500 hover:to-gray-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  ❌ Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Load Dialog */}
        {showLoadDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-[600px] max-h-[500px] overflow-y-auto">
              <h3 className="text-lg font-bold mb-4">Load Document</h3>
              {savedDocuments.length === 0 ? (
                <p className="text-gray-500">No saved documents found.</p>
              ) : (
                <div className="space-y-2">
                  {savedDocuments.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                      <div className="flex-1">
                        <div className="font-medium">{doc.title}</div>
                        <div className="text-sm text-gray-500">
                          Updated: {doc.updatedAt?.toDate().toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            loadDocumentById(doc.id);
                            setShowLoadDialog(false);
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                        >
                          📂 Load
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-6">
                <button
                  onClick={() => setShowLoadDialog(false)}
                  className="w-full px-6 py-3 bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-lg font-semibold hover:from-gray-500 hover:to-gray-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  ❌ Close
                </button>
              </div>
            </div>
          </div>
        )}

        <section className="grid lg:grid-cols-2 gap-6">
          <div className="grid gap-2">
            <label className="font-semibold">Input Text</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full h-96 p-3 rounded-xl border bg-white"
              disabled={isEditMode}
              placeholder={isEditMode ? "Switch to text mode to edit raw text" : "Enter your structured text here..."}
            />
            {isEditMode && (
              <p className="text-sm text-gray-500">
                Text editing is disabled in table edit mode. Click "Save Changes" to update the text from your table edits.
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <label className="font-semibold">JSON Output</label>
            <pre className="w-full h-96 p-3 rounded-xl border bg-white overflow-auto text-sm">
              {JSON.stringify(isEditMode ? editableData : data, null, 2)}
            </pre>
          </div>
        </section>

        <section className="grid gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {isEditMode ? 'Editable Tables' : 'Tables'}
            </h2>
            <div className="flex items-center gap-4">
              {isEditMode && (
                <button
                  onClick={addNewSection}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  ➕ Add Section
                </button>
              )}
              <div className="text-sm text-gray-600">
                Grand Total: <strong>{formatVal((isEditMode ? editableData : data).grandTotal)}</strong>
              </div>
            </div>
          </div>

          {(isEditMode ? editableData : data).sections.length === 0 ? (
            <div className="text-gray-500">No sections found.</div>
          ) : (
            <div className="grid gap-6">
              {(isEditMode ? editableData : data).sections.map((sec, idx) => (
                <div key={idx} className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                  <div className="px-4 py-3 border-b flex items-center justify-between">
                    {isEditMode ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={sec.name}
                          onChange={(e) => updateSectionName(idx, e.target.value)}
                          className="font-bold text-lg bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none flex-1"
                        />
                        <button
                          onClick={() => removeSection(idx)}
                          className="px-3 py-1 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                        >
                          🗑️ Remove
                        </button>
                      </div>
                    ) : (
                      <div className="font-bold text-lg">{sec.name}</div>
                    )}
                    <div className="text-sm text-gray-600">
                      Total: <strong>{formatVal(sec.total)}</strong>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-separate" style={{ borderSpacing: 0 }}>
                      <thead>
                        <tr className="bg-gray-100 text-left">
                          <th className="p-3 border-b w-12">
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 text-blue-600 rounded" 
                              title="Exclude from total"
                            />
                          </th>
                          <th className="p-3 border-b">Item</th>
                          <th className="p-3 border-b">Value</th>
                          <th className="p-3 border-b">% of Section</th>
                          {isEditMode && <th className="p-3 border-b">Actions</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {sec.items.map((it, i) => {
                          const actualValue = typeof it.value === "number" ? it.value : 0;
                          const includedValue = actualValue && !it.excluded ? actualValue : 0;
                          const pct = sec.total > 0 && actualValue > 0 && !it.excluded 
                            ? ((actualValue / sec.total) * 100).toFixed(1) + "%" 
                            : it.excluded && actualValue > 0 
                            ? "Excluded" 
                            : "—";
                          return (
                            <tr key={i} className={`${i % 2 ? "bg-gray-50" : ""} ${it.excluded ? "opacity-60 bg-red-50" : ""}`}>
                              <td className="p-3 border-b">
                                <input
                                  type="checkbox"
                                  checked={it.excluded || false}
                                  onChange={() => isEditMode ? toggleItemExclusion(idx, i) : null}
                                  className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                                  title="Exclude from total calculation"
                                  disabled={!isEditMode}
                                />
                              </td>
                              <td className="p-3 border-b">
                                {isEditMode ? (
                                  <input
                                    type="text"
                                    value={it.name}
                                    onChange={(e) => updateItemName(idx, i, e.target.value)}
                                    className="w-full bg-transparent border border-gray-300 rounded px-2 py-1 focus:border-blue-500 outline-none"
                                  />
                                ) : (
                                  it.name
                                )}
                              </td>
                              <td className="p-3 border-b">
                                {isEditMode ? (
                                  <input
                                    type="text"
                                    value={it.value}
                                    onChange={(e) => updateItemValue(idx, i, e.target.value)}
                                    className="w-full bg-transparent border border-gray-300 rounded px-2 py-1 focus:border-blue-500 outline-none"
                                  />
                                ) : (
                                  formatVal(it.value)
                                )}
                              </td>
                              <td className="p-3 border-b">{pct}</td>
                              {isEditMode && (
                                <td className="p-3 border-b">
                                  <button
                                    onClick={() => removeItem(idx, i)}
                                    className="px-3 py-1 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                                  >
                                    🗑️ Remove
                                  </button>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                        {isEditMode && (
                          <tr>
                            <td colSpan={isEditMode ? 5 : 4} className="p-3 border-b">
                              <button
                                onClick={() => addNewItem(idx)}
                                className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                              >
                                ➕ Add Item
                              </button>
                            </td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-100 font-semibold">
                          <td className="p-3 border-t"></td>
                          <td className="p-3 border-t">Subtotal</td>
                          <td className="p-3 border-t">{formatVal(sec.total)}</td>
                          <td className="p-3 border-t">100%</td>
                          {isEditMode && <td className="p-3 border-t"></td>}
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              ))}
              <div className="bg-gradient-to-r from-gray-900 to-black text-white rounded-2xl p-6 text-center font-bold text-xl shadow-xl">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl">💰</span>
                  <span>إجمالي الكل: {formatVal((isEditMode ? editableData : data).grandTotal)}</span>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

# Admin UI - Document Citation Workflow

**Date:** November 20, 2025  
**Status:** 📋 Reference Document - To be implemented in Phase 3+

---

## Overview

**Key Requirement:** Users can only cite documents that are already loaded in the system. Documents must be uploaded and processed before they can be selected in the document picker.

---

## The Workflow

### ✅ Correct Flow:

```
1. Document Upload
   ↓
   User uploads document to system
   ↓
   Document is processed and stored in database
   ↓

2. Document Available in Picker
   ↓
   Document appears in document picker (via GET /admin/docs)
   ↓

3. User Selects Document
   ↓
   User selects document from picker
   ↓

4. Citation Attached
   ↓
   Citation is attached to inbox item with document UUID
```

**Key Point:** Documents must be uploaded first before they can be cited.

---

## Why Documents Must Exist First

### 1. Document Processing

**When document is uploaded:**
- ✅ Document is stored in `public.docs` table
- ✅ Document is chunked into smaller pieces
- ✅ Chunks are embedded (vector embeddings created)
- ✅ Chunks are stored in `public.doc_chunks` table
- ✅ Document is indexed for search

**Why this matters:**
- Citations reference specific documents in the database
- Citations may reference specific pages/chunks
- Runtime API needs to access document content for RAG
- If document doesn't exist, citations can't be resolved

---

### 2. Citation References

**Citations store:**
```json
{
  "type": "doc",
  "doc_id": "550e8400-e29b-41d4-a716-446655440000",  // ← Must exist in database
  "page": 1,
  "span": {
    "text": "...",
    "start": 0,
    "end": 20
  }
}
```

**If document doesn't exist:**
- ❌ Citation references non-existent document
- ❌ Runtime API can't resolve citation
- ❌ FAQ promotion may fail
- ❌ Users see broken citations

---

### 3. Document Picker Data Source

**Document picker fetches from:**
```
GET /admin/docs?status=active
```

**This endpoint returns:**
- Only documents that exist in `public.docs` table
- Only documents that have been processed
- Only documents that are available for citation

**If document isn't uploaded:**
- ❌ Won't appear in document picker
- ❌ Can't be selected
- ❌ Can't be cited

---

## Workflow Options

### Option 1: Two-Step Process (Current Design)

**Step 1: Upload Document**
```
User goes to document upload page
  ↓
User uploads document (PDF, DOCX, etc.)
  ↓
Document is processed (chunked, embedded)
  ↓
Document appears in document list
```

**Step 2: Attach Citation**
```
User goes to citation attachment
  ↓
User opens document picker
  ↓
User selects uploaded document
  ↓
Citation is attached
```

**Pros:**
- ✅ Clear separation of concerns
- ✅ Documents fully processed before citation
- ✅ Better error handling
- ✅ Can verify document exists before citation

**Cons:**
- ❌ Requires two separate steps
- ❌ User must navigate between pages
- ❌ Slightly more clicks

---

### Option 2: Upload from Picker (Recommended Enhancement)

**Integrated Workflow:**
```
User wants to attach citation
  ↓
User opens document picker
  ↓
User searches for document (not found)
  ↓
UI shows: "Document not found. Upload it?"
  ↓
User clicks "Upload New Document"
  ↓
Upload modal opens (within picker)
  ↓
User uploads document
  ↓
Document is processed
  ↓
Document automatically selected
  ↓
Citation is attached
```

**Pros:**
- ✅ Streamlined workflow
- ✅ User doesn't leave citation page
- ✅ Documents uploaded on-demand
- ✅ Better user experience

**Cons:**
- ⚠️ Requires upload endpoint accessible from picker
- ⚠️ May have delay if document processing is slow
- ⚠️ Need to handle upload errors gracefully

---

### Option 3: Pre-Uploaded Documents Only

**Strict Workflow:**
```
User must upload documents separately first
  ↓
Documents must be fully processed
  ↓
Only then can user attach citations
  ↓
Document picker only shows existing documents
```

**Pros:**
- ✅ Simplest implementation
- ✅ Documents always fully processed
- ✅ No waiting for document processing
- ✅ Clear workflow

**Cons:**
- ❌ Less convenient for users
- ❌ Requires separate upload step
- ❌ May interrupt user flow

---

## Recommended Implementation

### For MVP (Phase 1-2): Option 1 or 3

**Use Two-Step Process:**
1. Documents uploaded separately
2. Citations attached from existing documents
3. Document picker only shows existing documents

**Why:**
- ✅ Simpler to implement
- ✅ Documents fully processed before use
- ✅ Better error handling
- ✅ Can test and refine upload separately

---

### For Future Enhancement (Phase 3+): Option 2

**Add "Upload from Picker" Feature:**
1. Document picker shows existing documents
2. If document not found, show "Upload New" button
3. Upload modal opens within picker
4. After upload, document automatically selected
5. Citation attached

**Why:**
- ✅ Better user experience
- ✅ Streamlined workflow
- ✅ Handles on-demand uploads

---

## Current Backend Support

### Document Upload Endpoints:

**1. Text Upload:**
```
POST /admin/docs/upload_text
Body: {
  "title": "Document Title",
  "text": "Document content..."
}
```

**2. File Upload (TUS):**
```
POST /admin/uploads (TUS protocol)
→ Document processed asynchronously by worker
```

### Document List Endpoint:

```
GET /admin/docs?status=active&limit=100
Returns: {
  "items": [
    {
      "id": "uuid...",  // ← UUID (hidden from user)
      "title": "Document Title",  // ← Shown to user
      "status": "active"
    }
  ]
}
```

---

## UI Implementation

### Document Picker Component:

```typescript
const DocumentPicker = ({ onSelect, onClose }) => {
  const [documents, setDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUpload, setShowUpload] = useState(false);

  // Fetch existing documents only
  useEffect(() => {
    const fetchDocs = async () => {
      const url = `/admin/docs?status=active&limit=100${searchQuery ? `&q=${searchQuery}` : ''}`;
      const response = await fetch(url);
      const data = await response.json();
      setDocuments(data.items || []);
    };
    fetchDocs();
  }, [searchQuery]);

  // Handle document selection (only existing documents)
  const handleSelect = (doc) => {
    onSelect(doc.id);  // UUID of existing document
  };

  return (
    <Modal onClose={onClose}>
      <h2>Select Document</h2>
      
      {/* Search Box */}
      <input
        type="text"
        placeholder="Search documents..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      {/* Document List (only existing documents) */}
      {documents.length === 0 && searchQuery && (
        <div>
          <p>No documents found.</p>
          {/* Option: Show upload button if document not found */}
          <button onClick={() => setShowUpload(true)}>
            Upload New Document
          </button>
        </div>
      )}

      {documents.map(doc => (
        <div
          key={doc.id}
          onClick={() => handleSelect(doc)}
        >
          {doc.title}  {/* User sees friendly name */}
        </div>
      ))}

      {/* Upload Modal (optional, Phase 3+) */}
      {showUpload && (
        <UploadModal
          onUploadComplete={(newDocId) => {
            // After upload, select new document
            handleSelect({ id: newDocId });
            setShowUpload(false);
          }}
          onClose={() => setShowUpload(false)}
        />
      )}
    </Modal>
  );
};
```

**Key Points:**
- ✅ Only shows existing documents (from `GET /admin/docs`)
- ✅ User selects from existing documents only
- ✅ Option to upload if document not found (Phase 3+)
- ✅ UUIDs handled internally (user never sees them)

---

## Error Handling

### Document Not Found Scenario:

**Current Behavior:**
```
User searches for "Product Guide"
  ↓
No documents found
  ↓
UI shows: "No documents found"
  ↓
Option 1: Show "Upload New Document" button (Phase 3+)
Option 2: Show message: "Please upload document first"
```

**Recommended Message:**
```
"No documents found matching 'Product Guide'.

To cite a document:
1. Upload the document first
2. Then return here to attach citation

[Upload Document] [Cancel]"
```

---

## Testing Scenarios

### Scenario 1: Document Exists

```
1. Document "Product Guide 2025" is uploaded
2. User opens citation attachment
3. User searches "Product Guide"
4. Document appears in picker
5. User selects "Product Guide 2025"
6. ✅ Citation attached successfully
```

### Scenario 2: Document Doesn't Exist

```
1. Document "New Product Guide" is NOT uploaded
2. User opens citation attachment
3. User searches "New Product Guide"
4. No documents found
5. UI shows: "No documents found. Upload it?"
6. User clicks "Upload New Document"
7. User uploads document (Phase 3+)
8. Document processed
9. Document automatically selected
10. ✅ Citation attached successfully
```

### Scenario 3: Document Processing in Progress

```
1. Document is uploaded but still processing
2. User opens citation attachment
3. Document may not appear in picker yet
4. UI should show processing status (if applicable)
5. User must wait for processing to complete
6. Then document can be selected
```

---

## Summary

### ✅ Documents Must Exist First

**Current Workflow:**
1. ✅ User uploads document (separate step)
2. ✅ Document is processed and stored
3. ✅ Document appears in document picker
4. ✅ User selects document from picker
5. ✅ Citation is attached

**Future Enhancement (Phase 3+):**
1. ✅ User opens document picker
2. ✅ If document not found, show "Upload New" button
3. ✅ Upload modal opens (within picker)
4. ✅ After upload, document automatically selected
5. ✅ Citation is attached

**Key Points:**
- ✅ Users can only cite documents that already exist
- ✅ Documents must be uploaded before citation
- ✅ Document picker only shows existing documents
- ✅ UUIDs are handled internally (user never sees them)
- ✅ Future: Option to upload from picker (convenience feature)

---

**Status:** ✅ **Yes - Users can only select documents that are already loaded. Document must be uploaded first before it can be cited.**






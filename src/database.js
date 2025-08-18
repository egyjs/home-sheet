import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  query,
  orderBy,
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';

const COLLECTION_NAME = 'home_sheets';

// Save a new document
export async function saveDocument(title, text, parsedData) {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      title: title || 'Untitled Document',
      text,
      parsedData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error saving document:', error);
    throw new Error('Failed to save document');
  }
}

// Update an existing document
export async function updateDocument(id, title, text, parsedData) {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      title: title || 'Untitled Document',
      text,
      parsedData,
      updatedAt: Timestamp.now()
    });
    return id;
  } catch (error) {
    console.error('Error updating document:', error);
    throw new Error('Failed to update document');
  }
}

// Load a specific document
export async function loadDocument(id) {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } else {
      throw new Error('Document not found');
    }
  } catch (error) {
    console.error('Error loading document:', error);
    throw new Error('Failed to load document');
  }
}

// Get all documents (recent first)
export async function getAllDocuments() {
  try {
    const q = query(
      collection(db, COLLECTION_NAME), 
      orderBy('updatedAt', 'desc'),
      limit(20)
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting documents:', error);
    throw new Error('Failed to load documents');
  }
}

// Delete a document
export async function deleteDocument(id) {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    console.error('Error deleting document:', error);
    throw new Error('Failed to delete document');
  }
}

// Generate shareable link
export function generateShareableLink(id) {
  return `${window.location.origin}${window.location.pathname}?doc=${id}`;
}

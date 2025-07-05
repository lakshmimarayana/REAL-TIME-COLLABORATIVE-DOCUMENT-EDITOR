import React, { useState, useEffect } from 'react';
import Editor from './components/Editor';
import { v4 as uuidV4 } from 'uuid'; // For generating unique IDs

function App() {
    const [documentId, setDocumentId] = useState(null);

    useEffect(() => {
        // Simple routing: if a document ID is in the URL, use it.
        // Otherwise, generate a new one and redirect.
        const pathParts = window.location.pathname.split('/');
        const idFromUrl = pathParts[pathParts.length - 1];

        if (idFromUrl && idFromUrl !== '' && idFromUrl !== '/') {
            setDocumentId(idFromUrl);
        } else {
            const newId = uuidV4();
            window.history.replaceState(null, '', `/${newId}`); // Change URL without reloading
            setDocumentId(newId);
        }
    }, []);

    return (
        <div className="App">
            {documentId ? (
                <Editor documentId={documentId} />
            ) : (
                <div>Loading or creating document...</div>
            )}
        </div>
    );
}

export default App;

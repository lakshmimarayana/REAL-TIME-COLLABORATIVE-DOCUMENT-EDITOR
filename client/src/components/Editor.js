import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { apply } from 'ot-json0'; // Using apply from ot-json0 for client-side application

const SERVER_URL = 'http://localhost:3001'; // Backend server URL

function Editor({ documentId }) {
    const [documentContent, setDocumentContent] = useState('');
    const [documentVersion, setDocumentVersion] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const socketRef = useRef(null); // Ref for Socket.IO instance
    const contentRef = useRef(''); // Ref to store the actual content for OT
    const versionRef = useRef(0); // Ref to store the actual version for OT
    const textareaRef = useRef(null); // Ref for textarea to manage cursor

    // Memoize the handleContentChange to prevent re-renders when passing to children (if any)
    const handleContentChange = useCallback((e) => {
        const newContent = e.target.value;
        const oldContent = contentRef.current;

        // Calculate the operation based on content difference
        // For simple textarea, this is a patch. For rich text, OT libraries do this.
        // This is a simplified diff for basic text; a real OT library would generate the operation.
        // In a real OT system with 'ot-json0', you'd compare two JSON structures.
        // For text: we need a library that generates string OT operations or manually derive them.
        // As ot-json0 directly applies JSON operations, this example will be simplified
        // and assume a full content update for the 'send-operation' for demonstration.
        // For true character-level OT on a textarea, a dedicated OT text library is needed.
        // Here, we'll simulate an "replace all" operation for simplicity.
        // A better approach would be to use a library that integrates with a textarea,
        // like https://github.com/Operational-Transformation/ot-text
        // For now, let's just send the whole new content as a "replace" operation
        // (which ot-json0 doesn't directly support for strings without complex diffing).
        // Let's adapt this to be a simpler "set content" for this basic example.

        const operation = { p: [], ld: oldContent, li: newContent }; // Simplified "replace all" as an example JSON0 op

        // Send the operation to the server
        if (socketRef.current) {
            socketRef.current.emit('send-operation', documentId, operation, versionRef.current);
        }

        // Apply the change locally immediately for responsiveness
        contentRef.current = newContent;
        setDocumentContent(newContent); // Update React state
    }, [documentId]);


    useEffect(() => {
        socketRef.current = io(SERVER_URL);

        socketRef.current.on('connect', () => {
            console.log('Connected to server');
            socketRef.current.emit('join-document', documentId);
        });

        socketRef.current.on('load-document', (content, version) => {
            console.log(`Document loaded: Version ${version}`);
            contentRef.current = content;
            versionRef.current = version;
            setDocumentContent(content);
            setDocumentVersion(version);
            setIsLoading(false);
            setError(null);
        });

        socketRef.current.on('receive-operation', (operation, serverVersionBeforeOp) => {
            // Check if our local version matches the server's version *before* this operation was applied
            if (versionRef.current === serverVersionBeforeOp) {
                // Apply the received operation to our local content
                const [newContent, newOp] = apply(contentRef.current, operation);
                contentRef.current = newContent;
                versionRef.current++; // Increment local version
                setDocumentContent(newContent); // Update React state to re-render
                setDocumentVersion(versionRef.current);
                console.log(`Applied remote op. New local version: ${versionRef.current}`);
            } else {
                // Version mismatch: request full document sync (or implement full OT transformation)
                console.warn(`Version mismatch. Local: ${versionRef.current}, Server Op from: ${serverVersionBeforeOp}. Requesting resync.`);
                // For a robust solution, implement client-side queue of pending ops and transformation
                // against incoming ops. For this example, simplest is to request full re-sync.
                socketRef.current.emit('join-document', documentId); // Re-join to force full load
            }
        });

        socketRef.current.on('resync-required', () => {
            console.warn('Server requested resync. Rejoining document.');
            socketRef.current.emit('join-document', documentId);
        });

        socketRef.current.on('error', (msg) => {
            setError(msg);
            setIsLoading(false);
            console.error('Socket error:', msg);
        });

        socketRef.current.on('disconnect', () => {
            console.log('Disconnected from server');
        });

        // Cleanup on component unmount
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [documentId]); // Re-run effect if documentId changes

    if (isLoading) {
        return <div className="editor-container">Loading document...</div>;
    }

    if (error) {
        return <div className="editor-container error-message">Error: {error}</div>;
    }

    return (
        <div className="editor-container">
            <h2>Document ID: {documentId}</h2>
            <p>Current Version: {documentVersion}</p>
            <textarea
                ref={textareaRef}
                value={documentContent}
                onChange={handleContentChange}
                placeholder="Start typing here..."
                className="document-textarea"
            ></textarea>
        </div>
    );
}

export default Editor;

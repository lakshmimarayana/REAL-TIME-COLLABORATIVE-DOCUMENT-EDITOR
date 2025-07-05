const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const Document = require('./models/Document'); // Our Mongoose Document model
const ot = require('ot-json0'); // For Operational Transformation
const cors = require('cors'); // For handling CORS with React dev server

const app = express();
const server = http.createServer(app);
// Configure Socket.IO to allow CORS from our React dev server
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:3000", // React development server
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3001; // Backend will run on 3001
const MONGO_URI = 'mongodb://localhost:27017/collaborative_editor'; // MongoDB URI

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB Connection
mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Store active documents in memory for OT
const activeDocuments = new Map(); // Map<documentId, { content: string, version: number }>

// Helper to get or create document
async function getOrCreateDocument(id) {
    if (activeDocuments.has(id)) {
        return activeDocuments.get(id);
    }

    let document = await Document.findById(id);
    if (!document) {
        document = new Document({ _id: id, content: '', version: 0 });
        await document.save();
    }

    activeDocuments.set(id, { content: document.content, version: document.version });
    return activeDocuments.get(id);
}

// Socket.IO Logic
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('join-document', async (documentId) => {
        socket.join(documentId);
        console.log(`User ${socket.id} joined document ${documentId}`);

        try {
            const docState = await getOrCreateDocument(documentId);
            socket.emit('load-document', docState.content, docState.version);
        } catch (error) {
            console.error(`Error loading document ${documentId}:`, error);
            socket.emit('error', 'Failed to load document.');
        }
    });

    socket.on('send-operation', async (documentId, operation, clientVersion) => {
        const docState = activeDocuments.get(documentId);

        if (!docState) {
            console.warn(`Document ${documentId} not found in active cache.`);
            return;
        }

        // --- Operational Transformation (OT) Core Logic ---
        if (clientVersion === docState.version) {
            // Client's version matches server's version: apply directly
            const [newContent, newOp] = ot.apply(docState.content, operation); // Apply operation
            docState.content = newContent;
            docState.version++; // Increment version
            console.log(`Applied op for doc ${documentId}, new version: ${docState.version}`);

            // Broadcast the applied operation to all other clients in the room
            socket.to(documentId).emit('receive-operation', operation, docState.version - 1); // Send original op, server's version *before* this op
            // Store the updated document to DB periodically or on disconnect
            // For simplicity, we'll save on every update here, but batching is better for production
            await Document.findByIdAndUpdate(documentId, {
                content: docState.content,
                version: docState.version
            });
        } else {
            // Client's version is out of sync: transformation needed (for more advanced OT)
            // For basic `ot-json0` and simple text changes, applying sequentially and ensuring
            // client re-sync is often enough. A full OT implementation would transform 'operation'
            // against the operations that happened *between* clientVersion and server's current version.
            // For now, we'll just log and let client request full sync if desynced.
            console.warn(`Client ${socket.id} has old version ${clientVersion} for doc ${documentId}. Server version: ${docState.version}.`);
            // In a full OT setup, you'd send back the transformed op or a state sync command.
            // For this simple example, we'll rely on the client reloading if versions are off.
            socket.emit('resync-required'); // Tell client to resync
        }
        // --- End OT Core Logic ---
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        // In a more robust app, clear from activeDocuments if no one is editing.
        // For simplicity, we keep documents in cache once loaded.
    });
});

// API endpoint to retrieve a document
app.get('/document/:id', async (req, res) => {
    try {
        const doc = await Document.findById(req.params.id);
        if (doc) {
            res.json(doc);
        } else {
            res.status(404).json({ message: 'Document not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    console.log(`MongoDB URI: ${MONGO_URI}`);
});

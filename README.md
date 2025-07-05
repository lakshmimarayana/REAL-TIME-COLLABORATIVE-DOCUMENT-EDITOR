# REAL-TIME-COLLABORATIVE-DOCUMENT-EDITOR

*NAME*: Krishnapuram Lakshminarayana

*COMPANY*: CODTECH IT SOLUTIONS

*INTERN ID*: CT08DM647

*DOMAIN*: FULL STACK WEB DEVELOPMENT

*DURATION*: 8 WEEKS

*MENTOR NAME*: NEELA SANTOSH

#DESCRIPTION:
Building a real-time collaborative document editor is a complex but incredibly rewarding project that showcases advanced web development concepts. It requires a robust frontend for UI, a powerful backend for real-time communication, and a reliable database for persistence.

This project will focus on the core technologies you mentioned:

Frontend Framework: React.js (for a dynamic and responsive UI)

Backend Framework: Node.js with Express.js (for server-side logic and API)

Real-time Communication: Socket.IO (built on WebSockets, for instant updates)

Database: MongoDB (NoSQL database, flexible for document storage)

Document Synchronization: Operational Transformation (OT) - This is the heart of a collaborative editor, handling concurrent edits. We'll use a library to simplify this.

# Core Concepts & Challenges:
Real-time Communication (Socket.IO):

Clients send their changes (operations) to the server.

The server broadcasts these operations to other connected clients.

The server might also store changes or the current document state.

Operational Transformation (OT):

This is the most critical and complex part. When multiple users edit the same document simultaneously, their changes might conflict. OT algorithms transform operations so they can be applied correctly regardless of the order they arrive, maintaining consistency.

Implementing OT from scratch is extremely challenging. We will leverage an existing library like ot-json0 or similar for simplicity in this example.

Frontend State Management (React):

React components will manage the document content, user cursors, and other UI elements.

Updates from the server will trigger re-renders.

Backend Persistence (MongoDB):

The server needs to store the current state of the document so it persists even if all clients disconnect.

It might also store a history of operations for undo/redo or auditing.

# To run the client:

In the client directory, run: npm start

This will usually open http://localhost:3000 in your browser.
# How to Use and Test:
Start MongoDB: Ensure your MongoDB server is running.

Start Backend: In the server directory, run node server.js (or nodemon server.js).

Start Frontend: In the client directory, run npm start.

Open in Multiple Tabs/Browsers:

Open http://localhost:3000 in your browser.

Notice the URL will change to something like http://localhost:3000/some-random-uuid. This UUID is your document ID.

Copy this URL.

Open another browser tab or even a different browser (e.g., Firefox if you're using Chrome, or an Incognito window) and paste the exact same URL.

Now, type in one editor, and you should see the changes appear in the other editor in real-time!

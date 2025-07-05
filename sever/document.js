const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    _id: { type: String, required: true }, // Using String for easy UUIDs
    content: { type: String, default: '' },
    version: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Update `updatedAt` field on save
documentSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// You might add indexes for performance
documentSchema.index({ _id: 1 });

module.exports = mongoose.model('Document', documentSchema);

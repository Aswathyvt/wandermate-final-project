import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    senderid: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rec: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: { type: String, required: true },
    
})

export const Message = mongoose.model('Message', messageSchema)
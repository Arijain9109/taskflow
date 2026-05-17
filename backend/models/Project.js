const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['Admin', 'Member'],
    default: 'Member'
  }
});

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    minlength: [3, 'Project name must be at least 3 characters'],
    maxlength: [100, 'Project name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [memberSchema],
  status: {
    type: String,
    enum: ['Active', 'Completed', 'On Hold'],
    default: 'Active'
  },
  deadline: {
    type: Date
  }
}, { timestamps: true });

// Ensure owner is always an Admin member
projectSchema.pre('save', function(next) {
  const ownerIsMember = this.members.some(
    m => m.user.toString() === this.owner.toString()
  );
  if (!ownerIsMember) {
    this.members.push({ user: this.owner, role: 'Admin' });
  }
  next();
});

module.exports = mongoose.model('Project', projectSchema);

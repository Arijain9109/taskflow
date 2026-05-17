const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Helper: check if user is Admin in a project
const isProjectAdmin = (project, userId) => {
  const member = project.members.find(m => m.user.toString() === userId.toString());
  return member && member.role === 'Admin';
};

// @GET /api/projects - Get all projects for current user
router.get('/', protect, async (req, res) => {
  try {
    const projects = await Project.find({ 'members.user': req.user._id })
      .populate('owner', 'name email')
      .populate('members.user', 'name email')
      .sort('-createdAt');
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @POST /api/projects - Create project
router.post('/', protect, [
  body('name').trim().isLength({ min: 3 }).withMessage('Project name must be at least 3 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

    const { name, description, deadline } = req.body;
    const project = await Project.create({
      name, description, deadline,
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'Admin' }]
    });
    await project.populate('owner', 'name email');
    await project.populate('members.user', 'name email');
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @GET /api/projects/:id - Get single project
router.get('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email');

    if (!project) return res.status(404).json({ message: 'Project not found' });

    const isMember = project.members.some(m => m.user._id.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: 'Access denied' });

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @PUT /api/projects/:id - Update project (Admin only)
router.put('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!isProjectAdmin(project, req.user._id)) {
      return res.status(403).json({ message: 'Only Admins can update this project' });
    }

    const { name, description, deadline, status } = req.body;
    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (deadline !== undefined) project.deadline = deadline;
    if (status) project.status = status;

    await project.save();
    await project.populate('owner', 'name email');
    await project.populate('members.user', 'name email');
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @DELETE /api/projects/:id - Delete project (Admin only)
router.delete('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!isProjectAdmin(project, req.user._id)) {
      return res.status(403).json({ message: 'Only Admins can delete this project' });
    }

    await Task.deleteMany({ project: project._id });
    await project.deleteOne();
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @POST /api/projects/:id/members - Add member (Admin only)
router.post('/:id/members', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!isProjectAdmin(project, req.user._id)) {
      return res.status(403).json({ message: 'Only Admins can add members' });
    }

    const { email, role } = req.body;
    const userToAdd = await User.findOne({ email });
    if (!userToAdd) return res.status(404).json({ message: 'User not found with this email' });

    const alreadyMember = project.members.some(m => m.user.toString() === userToAdd._id.toString());
    if (alreadyMember) return res.status(400).json({ message: 'User is already a member' });

    project.members.push({ user: userToAdd._id, role: role || 'Member' });
    await project.save();
    await project.populate('members.user', 'name email');
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @DELETE /api/projects/:id/members/:userId - Remove member (Admin only)
router.delete('/:id/members/:userId', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!isProjectAdmin(project, req.user._id)) {
      return res.status(403).json({ message: 'Only Admins can remove members' });
    }
    if (req.params.userId === project.owner.toString()) {
      return res.status(400).json({ message: 'Cannot remove the project owner' });
    }

    project.members = project.members.filter(m => m.user.toString() !== req.params.userId);
    await project.save();
    res.json({ message: 'Member removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

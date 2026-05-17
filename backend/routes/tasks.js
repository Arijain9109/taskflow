const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');

const isProjectAdmin = (project, userId) => {
  const member = project.members.find(m => m.user.toString() === userId.toString());
  return member && member.role === 'Admin';
};

// @GET /api/tasks?project=:projectId - Get tasks for a project
router.get('/', protect, async (req, res) => {
  try {
    const { project: projectId, status, priority } = req.query;
    if (!projectId) return res.status(400).json({ message: 'Project ID is required' });

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const isMember = project.members.some(m => m.user.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: 'Access denied' });

    const filter = { project: projectId };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort('-createdAt');

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @GET /api/tasks/dashboard - Get dashboard summary for current user
router.get('/dashboard', protect, async (req, res) => {
  try {
    const projects = await Project.find({ 'members.user': req.user._id });
    const projectIds = projects.map(p => p._id);

    const allTasks = await Task.find({ project: { $in: projectIds } });
    const myTasks = await Task.find({
      project: { $in: projectIds },
      assignedTo: req.user._id
    }).populate('project', 'name').populate('assignedTo', 'name email');

    const now = new Date();
    const overdueTasks = myTasks.filter(t => t.dueDate && t.status !== 'Done' && new Date(t.dueDate) < now);

    res.json({
      totalProjects: projects.length,
      totalTasks: allTasks.length,
      myTasks: myTasks.length,
      overdueTasks: overdueTasks.length,
      tasksByStatus: {
        todo: allTasks.filter(t => t.status === 'Todo').length,
        inProgress: allTasks.filter(t => t.status === 'In Progress').length,
        done: allTasks.filter(t => t.status === 'Done').length,
      },
      recentTasks: myTasks.slice(0, 5),
      overdueList: overdueTasks.slice(0, 5)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @POST /api/tasks - Create task (Admin only)
router.post('/', protect, [
  body('title').trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
  body('project').notEmpty().withMessage('Project ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

    const { title, description, project: projectId, assignedTo, priority, dueDate } = req.body;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!isProjectAdmin(project, req.user._id)) {
      return res.status(403).json({ message: 'Only Admins can create tasks' });
    }

    // Validate assignedTo is a project member
    if (assignedTo) {
      const isMember = project.members.some(m => m.user.toString() === assignedTo);
      if (!isMember) return res.status(400).json({ message: 'Assigned user is not a project member' });
    }

    const task = await Task.create({
      title, description, project: projectId,
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
      priority: priority || 'Medium',
      dueDate: dueDate || null
    });

    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @PUT /api/tasks/:id - Update task
router.put('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const project = await Project.findById(task.project);
    const isMember = project.members.some(m => m.user.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: 'Access denied' });

    const isAdmin = isProjectAdmin(project, req.user._id);
    const isAssigned = task.assignedTo && task.assignedTo.toString() === req.user._id.toString();

    // Members can only update status of their own tasks
    if (!isAdmin && !isAssigned) {
      return res.status(403).json({ message: 'You can only update tasks assigned to you' });
    }

    const { title, description, status, priority, dueDate, assignedTo } = req.body;

    if (isAdmin) {
      if (title) task.title = title;
      if (description !== undefined) task.description = description;
      if (priority) task.priority = priority;
      if (dueDate !== undefined) task.dueDate = dueDate;
      if (assignedTo !== undefined) task.assignedTo = assignedTo || null;
    }

    // Both admin and assigned member can update status
    if (status) task.status = status;

    await task.save();
    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @DELETE /api/tasks/:id - Delete task (Admin only)
router.delete('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const project = await Project.findById(task.project);
    if (!isProjectAdmin(project, req.user._id)) {
      return res.status(403).json({ message: 'Only Admins can delete tasks' });
    }

    await task.deleteOne();
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');

  // Modals
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [saving, setSaving] = useState(false);

  const [taskForm, setTaskForm] = useState({ title: '', description: '', assignedTo: '', priority: 'Medium', dueDate: '' });
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('Member');

  const myRole = project?.members?.find(m => m.user._id === user?._id)?.role;
  const isAdmin = myRole === 'Admin';

  const loadData = useCallback(async () => {
    try {
      const [proj, taskRes] = await Promise.all([
        api.get(`/api/projects/${id}`),
        api.get(`/api/tasks?project=${id}`)
      ]);
      setProject(proj.data);
      setTasks(taskRes.data);
    } catch (err) {
      toast.error('Failed to load project');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...taskForm, project: id };
      if (!taskForm.assignedTo) delete payload.assignedTo;
      if (!taskForm.dueDate) delete payload.dueDate;

      if (editTask) {
        const { data } = await api.put(`/api/tasks/${editTask._id}`, payload);
        setTasks(tasks.map(t => t._id === data._id ? data : t));
        toast.success('Task updated!');
      } else {
        const { data } = await api.post('/api/tasks', payload);
        setTasks([data, ...tasks]);
        toast.success('Task created!');
      }
      closeTaskModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  const closeTaskModal = () => {
    setShowTaskModal(false);
    setEditTask(null);
    setTaskForm({ title: '', description: '', assignedTo: '', priority: 'Medium', dueDate: '' });
  };

  const openEditTask = (task) => {
    setEditTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      assignedTo: task.assignedTo?._id || '',
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : ''
    });
    setShowTaskModal(true);
  };

  const handleStatusChange = async (task, newStatus) => {
    try {
      const { data } = await api.put(`/api/tasks/${task._id}`, { status: newStatus });
      setTasks(tasks.map(t => t._id === data._id ? data : t));
      toast.success('Status updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/api/tasks/${taskId}`);
      setTasks(tasks.filter(t => t._id !== taskId));
      toast.success('Task deleted');
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.post(`/api/projects/${id}/members`, { email: memberEmail, role: memberRole });
      setProject(data);
      setMemberEmail('');
      setShowMemberModal(false);
      toast.success('Member added!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      await api.delete(`/api/projects/${id}/members/${userId}`);
      setProject(p => ({ ...p, members: p.members.filter(m => m.user._id !== userId) }));
      toast.success('Member removed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('Delete this entire project and all its tasks? This cannot be undone.')) return;
    try {
      await api.delete(`/api/projects/${id}`);
      toast.success('Project deleted');
      navigate('/projects');
    } catch {
      toast.error('Failed to delete project');
    }
  };

  const columns = ['Todo', 'In Progress', 'Done'];
  const now = new Date();

  
    const map = { 'Todo': 'badge-todo', 'In Progress': 'badge-progress', 'Done': 'badge-done' };
    return <span className={`badge ${map[status] || 'badge-todo'}`}>{status}</span>;
  };
  const priorityBadge = (p) => {
    const map = { 'Low': 'badge-low', 'Medium': 'badge-medium', 'High': 'badge-high' };
    return <span className={`badge ${map[p]}`}>{p}</span>;
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;
  if (!project) return null;

  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <button onClick={() => navigate('/projects')} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 14 }}>
              ← Projects
            </button>
          </div>
          <h1 className="page-title">{project.name}</h1>
          {project.description && <p className="page-sub">{project.description}</p>}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {isAdmin && (
            <>
              <button className="btn btn-secondary" onClick={() => setShowMemberModal(true)}>+ Member</button>
              <button className="btn btn-primary" onClick={() => setShowTaskModal(true)}>+ Task</button>
              <button className="btn btn-danger btn-sm" onClick={handleDeleteProject}>Delete</button>
            </>
          )}
        </div>
      </div>

      {/* Role badge */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <span className={`badge ${myRole === 'Admin' ? 'badge-admin' : 'badge-member'}`}>
          Your role: {myRole}
        </span>
        <span className="badge badge-member">{project.members.length} members</span>
        {project.deadline && (
          <span className="badge" style={{ background: 'var(--bg3)', color: 'var(--text2)' }}>
            Deadline: {new Date(project.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>
          Tasks ({tasks.length})
        </button>
        <button className={`tab ${activeTab === 'members' ? 'active' : ''}`} onClick={() => setActiveTab('members')}>
          Members ({project.members.length})
        </button>
      </div>

      {activeTab === 'tasks' && (
        <div className="task-columns">
          {columns.map(col => {
            const colTasks = tasks.filter(t => t.status === col);
            return (
              <div key={col} className="task-column">
                <div className="column-header">
                  <span style={{ color: col === 'Todo' ? 'var(--text2)' : col === 'In Progress' ? 'var(--info)' : 'var(--success)' }}>
                    {col}
                  </span>
                  <span className="column-count">{colTasks.length}</span>
                </div>
                {colTasks.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 13, padding: '20px 0' }}>Empty</div>
                )}
                {colTasks.map(task => {
                  const isOverdue = task.dueDate && task.status !== 'Done' && new Date(task.dueDate) < now;
                  const canEdit = isAdmin || task.assignedTo?._id === user?._id;
                  return (
                    <div key={task._id} className={`task-item ${isOverdue ? 'overdue' : ''}`} style={{ flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                        <div className="task-title">{task.title}</div>
                        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                          {canEdit && isAdmin && (
                            <button onClick={() => openEditTask(task)} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 14 }} title="Edit">✏️</button>
                          )}
                          {isAdmin && (
                            <button onClick={() => handleDeleteTask(task._id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 14 }} title="Delete">🗑️</button>
                          )}
                        </div>
                      </div>
                      {task.description && <p style={{ fontSize: 12, color: 'var(--text2)' }}>{task.description}</p>}
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {priorityBadge(task.priority)}
                        {isOverdue && <span className="badge badge-overdue">Overdue</span>}
                      </div>
                      <div className="task-meta">
                        {task.assignedTo ? <span>👤 {task.assignedTo.name}</span> : <span>Unassigned</span>}
                        {task.dueDate && <span>📅 {new Date(task.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>}
                      </div>
                      {canEdit && (
                        <select
                          className="form-control"
                          style={{ fontSize: 12, padding: '4px 8px' }}
                          value={task.status}
                          onChange={e => handleStatusChange(task, e.target.value)}
                        >
                          {columns.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'members' && (
        <div className="card" style={{ maxWidth: 500 }}>
          {project.members.map(m => (
            <div key={m.user._id} className="member-item">
              <div className="member-info">
                <div className="member-avatar">{m.user.name[0].toUpperCase()}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{m.user.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)' }}>{m.user.email}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className={`badge ${m.role === 'Admin' ? 'badge-admin' : 'badge-member'}`}>{m.role}</span>
                {isAdmin && m.user._id !== project.owner._id && m.user._id !== user?._id && (
                  <button className="btn btn-danger btn-sm" onClick={() => handleRemoveMember(m.user._id)}>Remove</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={closeTaskModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">
              {editTask ? 'Edit Task' : 'New Task'}
              <button onClick={closeTaskModal}>✕</button>
            </div>
            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label>Task Title *</label>
                <input className="form-control" value={taskForm.title}
                  onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="What needs to be done?" required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea className="form-control" value={taskForm.description}
                  onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                  placeholder="Additional details..." rows={3} />
              </div>
              <div className="form-group">
                <label>Assign To</label>
                <select className="form-control" value={taskForm.assignedTo}
                  onChange={e => setTaskForm({ ...taskForm, assignedTo: e.target.value })}>
                  <option value="">Unassigned</option>
                  {project.members.map(m => (
                    <option key={m.user._id} value={m.user._id}>{m.user.name} ({m.role})</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label>Priority</label>
                  <select className="form-control" value={taskForm.priority}
                    onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}>
                    <option>Low</option><option>Medium</option><option>High</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Due Date</label>
                  <input type="date" className="form-control" value={taskForm.dueDate}
                    onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeTaskModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editTask ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showMemberModal && (
        <div className="modal-overlay" onClick={() => setShowMemberModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">
              Add Member
              <button onClick={() => setShowMemberModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddMember}>
              <div className="form-group">
                <label>Member Email</label>
                <input className="form-control" type="email" value={memberEmail}
                  onChange={e => setMemberEmail(e.target.value)}
                  placeholder="teammate@example.com" required />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select className="form-control" value={memberRole} onChange={e => setMemberRole(e.target.value)}>
                  <option>Member</option>
                  <option>Admin</option>
                </select>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 16 }}>
                ⚠️ The user must already have a TaskFlow account
              </p>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowMemberModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

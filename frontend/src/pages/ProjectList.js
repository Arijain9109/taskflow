import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function ProjectList() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', deadline: '' });
  const [saving, setSaving] = useState(false);

  const loadProjects = async () => {
    try {
      const { data } = await api.get('/api/projects');
      setProjects(data);
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProjects(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.post('/api/projects', form);
      setProjects([data, ...projects]);
      setShowModal(false);
      setForm({ name: '', description: '', deadline: '' });
      toast.success('Project created!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally {
      setSaving(false);
    }
  };

  const statusBadge = (status) => {
    const map = { 'Active': 'badge-active', 'Completed': 'badge-done', 'On Hold': 'badge-medium' };
    return <span className={`badge ${map[status] || 'badge-active'}`}>{status}</span>;
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-sub">{projects.length} project{projects.length !== 1 ? 's' : ''} total</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Project</button>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📁</div>
          <h3>No projects yet</h3>
          <p>Create your first project to get started</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ marginTop: 16 }}>
            Create Project
          </button>
        </div>
      ) : (
        <div className="card-grid">
          {projects.map(project => (
            <Link key={project._id} to={`/projects/${project._id}`} className="project-card">
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                <div className="project-name">{project.name}</div>
                {statusBadge(project.status)}
              </div>
              <p className="project-desc">{project.description || 'No description'}</p>
              <div className="project-footer">
                <span>{project.members?.length} member{project.members?.length !== 1 ? 's' : ''}</span>
                {project.deadline && <span>Due {new Date(project.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">
              New Project
              <button onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Project Name *</label>
                <input className="form-control" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. E-Commerce Platform" required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea className="form-control" value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="What is this project about?" rows={3} />
              </div>
              <div className="form-group">
                <label>Deadline</label>
                <input type="date" className="form-control" value={form.deadline}
                  onChange={e => setForm({ ...form, deadline: e.target.value })} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

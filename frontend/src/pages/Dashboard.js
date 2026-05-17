import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/tasks/dashboard')
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—';

  const statusBadge = (status) => {
    const map = { 'Todo': 'badge-todo', 'In Progress': 'badge-progress', 'Done': 'badge-done' };
    return <span className={`badge ${map[status] || 'badge-todo'}`}>{status}</span>;
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Hello, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-sub">Here's what's happening in your workspace</p>
        </div>
        <Link to="/projects" className="btn btn-primary">+ New Project</Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card accent">
          <div className="stat-label">Total Projects</div>
          <div className="stat-value">{data?.totalProjects ?? 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Tasks</div>
          <div className="stat-value">{data?.totalTasks ?? 0}</div>
        </div>
        <div className="stat-card success">
          <div className="stat-label">My Tasks</div>
          <div className="stat-value">{data?.myTasks ?? 0}</div>
        </div>
        <div className="stat-card danger">
          <div className="stat-label">Overdue</div>
          <div className="stat-value">{data?.overdueTasks ?? 0}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Tasks by Status</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Todo', value: data?.tasksByStatus?.todo, color: 'var(--text2)' },
              { label: 'In Progress', value: data?.tasksByStatus?.inProgress, color: 'var(--info)' },
              { label: 'Done', value: data?.tasksByStatus?.done, color: 'var(--success)' },
            ].map(({ label, value, color }) => {
              const total = data?.totalTasks || 1;
              const pct = Math.round(((value || 0) / total) * 100);
              return (
                <div key={label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span>{label}</span>
                    <span style={{ color }}>{value || 0}</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--bg3)', borderRadius: 3 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.6s' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Overdue Tasks</h3>
          {data?.overdueList?.length === 0 ? (
            <div className="empty-state" style={{ padding: '20px 0' }}>
              <div>✅</div>
              <p style={{ fontSize: 13, marginTop: 8 }}>No overdue tasks!</p>
            </div>
          ) : (
            data?.overdueList?.map(task => (
              <div key={task._id} className="task-item overdue">
                <div style={{ flex: 1 }}>
                  <div className="task-title">{task.title}</div>
                  <div className="task-meta">
                    <span>{task.project?.name}</span>
                    <span>•</span>
                    <span style={{ color: 'var(--danger)' }}>Due {formatDate(task.dueDate)}</span>
                  </div>
                </div>
                {statusBadge(task.status)}
              </div>
            ))
          )}
        </div>

        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>My Recent Tasks</h3>
          {data?.recentTasks?.length === 0 ? (
            <div className="empty-state" style={{ padding: '20px 0' }}>
              <div>📋</div>
              <p style={{ fontSize: 13, marginTop: 8 }}>No tasks assigned yet</p>
            </div>
          ) : (
            data?.recentTasks?.map(task => (
              <div key={task._id} className="task-item">
                <div style={{ flex: 1 }}>
                  <div className="task-title">{task.title}</div>
                  <div className="task-meta">
                    <span>{task.project?.name}</span>
                    {task.dueDate && <><span>•</span><span>Due {formatDate(task.dueDate)}</span></>}
                  </div>
                </div>
                {statusBadge(task.status)}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

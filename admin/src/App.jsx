import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';

// API Setup 
const api = axios.create({
  baseURL: 'http://localhost:3001/api', // Here we have to put our correct backend api
  timeout: 10000,
});

// Attach token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API Service
const apiService = {
  getBlogs: async (page = 1, limit = 10, search = '') => {
    const params = { page, limit };
    if (search) params.search = search;

    const response = await api.get('/blogs', { params });
    return response.data; // { data, total, page, limit }
  },

  addBlog: async (blogData) => {
    const response = await api.post('/blogs', blogData);
    return response.data; // { success, id }
  },

  updateBlog: async (id, blogData) => {
    const response = await api.put(`/blogs/${id}`, blogData);
    return response.data; // { success }
  },

  deleteBlog: async (id) => {
    const response = await api.delete(`/blogs/${id}`);
    return response.data; // { success }
  },
};

//  Protected Route 
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

// LOGIN - note here i have used hardcoded login for testing purpose 
const Login = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) navigate('/blog-management');
  }, [navigate]);

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    //  Hardcoded fake login
    if (credentials.username === 'admin' && credentials.password === '12345') {
      localStorage.setItem('token', 'jwt_token_here'); // fake token
      navigate('/blog-management');
    } else {
      setError('Invalid credentials');
    }

    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h1>Blog Admin Login</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username:</label>
            <input
              type="text"
              id="username"
              name="username"
              value={credentials.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

//  Blog Table 
const BlogTable = ({ blogs, onEdit, onDelete }) => {
  const sortedBlogs = [...blogs].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="table-container">
      <table className="blog-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Tags</th>
            <th>Summary</th>
            <th>Date</th>
            <th>File Path</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedBlogs.length === 0 ? (
            <tr>
              <td colSpan="7" className="no-data">No blogs found</td>
            </tr>
          ) : (
            sortedBlogs.map((blog) => (
              <tr key={blog.id}>
                <td>{blog.id}</td>
                <td className="title-cell">{blog.title}</td>
                <td className="tags-cell">{blog.tags}</td>
                <td className="summary-cell">
                  {blog.summary.length > 100
                    ? `${blog.summary.substring(0, 100)}...`
                    : blog.summary}
                </td>
                <td>{new Date(blog.date).toLocaleDateString()}</td>
                <td className="path-cell">{blog.file_path}</td>
                <td className="actions-cell">
                  <button onClick={() => onEdit(blog)} className="edit-btn">Edit</button>
                  <button onClick={() => onDelete(blog)} className="delete-btn">Delete</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

// Blog Form 
const BlogForm = ({ onSubmit, onCancel, title }) => {
  const [formData, setFormData] = useState({
    title: '',
    tags: '',
    summary: '',
    date: new Date().toISOString().split('T')[0],
    file_path: '',
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleSubmit = (e) => { e.preventDefault(); onSubmit(formData); };

  return (
    <div className="form-container">
      <h3>{title}</h3>
      <form onSubmit={handleSubmit} className="blog-form">
        <div className="form-group">
          <label htmlFor="title">Title *</label>
          <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="tags">Tags (comma-separated)</label>
          <input type="text" id="tags" name="tags" value={formData.tags} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="summary">Summary *</label>
          <textarea id="summary" name="summary" value={formData.summary} onChange={handleChange} required rows="4" />
        </div>
        <div className="form-group">
          <label htmlFor="date">Date *</label>
          <input type="date" id="date" name="date" value={formData.date} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="file_path">File Path *</label>
          <input type="text" id="file_path" name="file_path" value={formData.file_path} onChange={handleChange} required />
        </div>
        <div className="form-actions">
          <button type="submit" className="submit-btn">Add Blog</button>
          <button type="button" onClick={onCancel} className="cancel-btn">Cancel</button>
        </div>
      </form>
    </div>
  );
};

//  Edit Modal 
const EditModal = ({ blog, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({ ...blog });
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleSubmit = (e) => { e.preventDefault(); onSubmit(formData); };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Edit Blog</h3>
        <form onSubmit={handleSubmit} className="blog-form">
          <div className="form-group">
            <label>Title *</label>
            <input type="text" name="title" value={formData.title} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Tags</label>
            <input type="text" name="tags" value={formData.tags} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Summary *</label>
            <textarea name="summary" value={formData.summary} onChange={handleChange} required rows="4" />
          </div>
          <div className="form-group">
            <label>Date *</label>
            <input type="date" name="date" value={formData.date} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>File Path *</label>
            <input type="text" name="file_path" value={formData.file_path} onChange={handleChange} required />
          </div>
          <div className="form-actions">
            <button type="submit" className="submit-btn">Update Blog</button>
            <button type="button" onClick={onCancel} className="cancel-btn">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

//  Delete Confirmation 
const DeleteConfirmation = ({ blog, onConfirm, onCancel }) => (
  <div className="modal-overlay" onClick={onCancel}>
    <div className="modal confirmation-modal" onClick={(e) => e.stopPropagation()}>
      <h3>Confirm Delete</h3>
      <p>Are you sure you want to delete: <strong>"{blog.title}"</strong>?</p>
      <p>This action cannot be undone.</p>
      <div className="form-actions">
        <button onClick={onConfirm} className="delete-btn">Delete</button>
        <button onClick={onCancel} className="cancel-btn">Cancel</button>
      </div>
    </div>
  </div>
);

//  Blog Management 
const BlogManagement = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalBlogs, setTotalBlogs] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [deletingBlog, setDeletingBlog] = useState(null);
  const navigate = useNavigate();

  const limit = 10;

  const fetchBlogs = async (page = 1, search = '') => {
    setLoading(true);
    setError('');
    try {
      const response = await apiService.getBlogs(page, limit, search);
      setBlogs(response.data);
      setTotalBlogs(response.total);
      setCurrentPage(response.page);
    } catch {
      setError('Failed to fetch blogs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBlogs(currentPage, searchQuery); }, [currentPage, searchQuery]);

  const handleLogout = () => { localStorage.removeItem('token'); navigate('/login'); };

  const handleSearch = (e) => { setSearchQuery(e.target.value); setCurrentPage(1); };

  const handleAddBlog = async (blogData) => {
    try {
      await apiService.addBlog(blogData);
      setShowAddForm(false);
      fetchBlogs(currentPage, searchQuery);
    } catch {
      setError('Failed to add blog');
    }
  };

  const handleEditBlog = async (blogData) => {
    try {
      await apiService.updateBlog(editingBlog.id, blogData);
      setEditingBlog(null);
      fetchBlogs(currentPage, searchQuery);
    } catch {
      setError('Failed to update blog');
    }
  };

  const handleDeleteBlog = async () => {
    try {
      await apiService.deleteBlog(deletingBlog.id);
      setDeletingBlog(null);
      fetchBlogs(currentPage, searchQuery);
    } catch {
      setError('Failed to delete blog');
    }
  };

  const totalPages = Math.ceil(totalBlogs / limit);

  return (
    <div className="blog-management">
      <div className="header">
        <h1>Blog Management</h1>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="controls">
        <div className="search-section">
          <input
            type="text"
            placeholder="Search by title or tag..."
            value={searchQuery}
            onChange={handleSearch}
            className="search-input"
          />
        </div>
        <button onClick={() => setShowAddForm(!showAddForm)} className="add-btn">
          {showAddForm ? 'Cancel' : 'Add New Blog'}
        </button>
      </div>

      {showAddForm && (
        <BlogForm onSubmit={handleAddBlog} onCancel={() => setShowAddForm(false)} title="Add New Blog" />
      )}

      {loading ? (
        <div className="loading">Loading blogs...</div>
      ) : (
        <>
          <BlogTable blogs={blogs} onEdit={setEditingBlog} onDelete={setDeletingBlog} />
          {totalPages > 1 && (
            <div className="pagination">
              <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1}>
                Previous
              </button>
              <span className="page-info">
                Page {currentPage} of {totalPages} ({totalBlogs} total)
              </span>
              <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>
                Next
              </button>
            </div>
          )}
        </>
      )}

      {editingBlog && <EditModal blog={editingBlog} onSubmit={handleEditBlog} onCancel={() => setEditingBlog(null)} />}
      {deletingBlog && <DeleteConfirmation blog={deletingBlog} onConfirm={handleDeleteBlog} onCancel={() => setDeletingBlog(null)} />}
    </div>
  );
};



function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/blog-management"
            element={
              <ProtectedRoute>
                <BlogManagement />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/blog-management" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

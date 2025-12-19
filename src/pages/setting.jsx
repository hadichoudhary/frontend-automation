import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../css/settings.css';

const Settings = () => {
  const [user, setUser] = useState({
    name: '',
    email: '',
    platforms: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('profile');

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("authToken");

      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/settings/profile`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );


      setUser({
        name: response.data.data.name,
        email: response.data.data.email,
        platforms: response.data.data.platforms || [],
      });

      setLoading(false);
    } catch (error) {
      console.error("Error fetching user data:", error);
      setMessage({ type: "error", text: "Failed to load user data" });
      setLoading(false);
    }
  };


  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/settings/profile`,
        { name: user.name },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUser({
        name: response.data.data.name,
        email: response.data.data.email,
        platforms: response.data.data.platforms || [],
      });
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to update profile'
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    setPasswordErrors({});

    // Validation
    const errors = {};
    if (!passwordForm.currentPassword) errors.currentPassword = 'Current password is required';
    if (!passwordForm.newPassword) errors.newPassword = 'New password is required';
    if (passwordForm.newPassword.length < 6) errors.newPassword = 'Password must be at least 6 characters';
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      setSaving(false);
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/settings/change-password`,
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setPasswordErrors({});
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to change password'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUser(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const disconnectPlatform = async (platform) => {
    try {
      // Implement platform disconnect logic here
      console.log('Disconnecting platform:', platform);
      setMessage({ type: 'success', text: `Disconnected from ${platform}` });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to disconnect platform' });
    }
  };

  if (loading) {
    return (
      <div className="settings-loading">
        <div className="spinner"></div>
        <p>Loading your settings...</p>
      </div>
    );
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>Account Settings</h1>
        <p className="user-email">{user.email}</p>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="settings-content">
        <div className="settings-sidebar">
          <button
            className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <i className="icon-user"></i>
            Profile
          </button>
          <button
            className={`tab-button ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <i className="icon-lock"></i>
            Security
          </button>
          <button
            className={`tab-button ${activeTab === 'platforms' ? 'active' : ''}`}
            onClick={() => setActiveTab('platforms')}
          >
            <i className="icon-link"></i>
            Connected Platforms
          </button>
        </div>

        <div className="settings-main">
          {activeTab === 'profile' && (
            <div className="tab-content">
              <h2>Profile Information</h2>
              <p className="tab-description">Update your personal information</p>

              <form onSubmit={handleProfileUpdate} className="settings-form">
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={user.name}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={user.email}
                    className="form-input"
                    disabled
                  />
                  <small className="text-muted">Email cannot be changed</small>
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="tab-content">
              <h2>Change Password</h2>
              <p className="tab-description">Update your password to keep your account secure</p>

              <form onSubmit={handlePasswordChange} className="settings-form">
                <div className="form-group">
                  <label htmlFor="currentPassword">Current Password</label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordInputChange}
                    className={`form-input ${passwordErrors.currentPassword ? 'error' : ''}`}
                    placeholder="Enter current password"
                  />
                  {passwordErrors.currentPassword && (
                    <span className="error-text">{passwordErrors.currentPassword}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordInputChange}
                    className={`form-input ${passwordErrors.newPassword ? 'error' : ''}`}
                    placeholder="Enter new password (min. 6 characters)"
                  />
                  {passwordErrors.newPassword && (
                    <span className="error-text">{passwordErrors.newPassword}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordInputChange}
                    className={`form-input ${passwordErrors.confirmPassword ? 'error' : ''}`}
                    placeholder="Confirm new password"
                  />
                  {passwordErrors.confirmPassword && (
                    <span className="error-text">{passwordErrors.confirmPassword}</span>
                  )}
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving}
                  >
                    {saving ? 'Changing Password...' : 'Change Password'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'platforms' && (
            <div className="tab-content">
              <h2>Connected Platforms</h2>
              <p className="tab-description">Manage your connected third-party platforms</p>

              {user.platforms && user.platforms.length > 0 ? (
                <div className="platforms-list">
                  {user.platforms.map((platform, index) => (
                    <div key={index} className="platform-card">
                      <div className="platform-info">
                        <div className="platform-icon">
                          {platform.platform === 'google' && 'G'}
                          {platform.platform === 'facebook' && 'F'}
                          {platform.platform === 'github' && 'GH'}
                          {platform.platform === 'twitter' && 'T'}
                        </div>
                        <div className="platform-details">
                          <h3>{platform.platform.charAt(0).toUpperCase() + platform.platform.slice(1)}</h3>
                          <span className={`status ${platform.status}`}>
                            {platform.status}
                          </span>
                        </div>
                      </div>
                      <button
                        className="btn btn-outline"
                        onClick={() => disconnectPlatform(platform.platform)}
                        disabled={platform.status === 'disconnected'}
                      >
                        {platform.status === 'connected' ? 'Disconnect' : 'Disconnected'}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <i className="icon-link"></i>
                  <h3>No platforms connected</h3>
                  <p>Connect your accounts to third-party platforms to enhance your experience</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
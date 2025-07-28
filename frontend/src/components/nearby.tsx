import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './css/nearby.css';

interface UserProfile {
  id: number;
  username: string;
  avatar_url?: string;
  distance: number;
}

const RADIUS_METERS = 100;

const Nearby: React.FC = () => {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requests, setRequests] = useState<number[]>([]);

  const token = localStorage.getItem('token');
  const axiosConfig = token
    ? { headers: { Authorization: `Bearer ${token}` } }
    : {};

  // Get user location
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => setError('Location permission denied or unavailable.')
      );
    } else {
      setError('Geolocation not supported by your browser.');
    }
  }, []);

  // Update backend with user location
  useEffect(() => {
    if (coords && token) {
      axios.post(
        '/api/nearby/update_location',
        { lat: coords.lat, lon: coords.lon, visible: true },
        axiosConfig
      ).catch(() => { });
    }
  }, [coords, token]);

  // Fetch nearby users
  useEffect(() => {
    const fetchUsers = async () => {
      if (!coords || !token) return;
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get('/api/users_nearby', {
          params: { lat: coords.lat, lon: coords.lon, r: RADIUS_METERS },
          ...axiosConfig,
        });
        setUsers(res.data.users);
      } catch {
        setError('Error fetching nearby users.');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [coords, token]);

  // Send contact request
  const sendRequest = async (userId: number) => {
    if (!token) {
      alert('You must be logged in to send requests.');
      return;
    }
    try {
      await axios.post(
        '/api/contacts/request',
        { contactId: userId },
        axiosConfig
      );
      setRequests((prev) => [...prev, userId]);
    } catch {
      alert('Failed to send request. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="nearby-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Finding nearby users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="nearby-container">
      <div className="nearby-header">
        <h2 className="nearby-title">
          <span className="location-icon">📍</span>
          Nearby Users
        </h2>
        <div className="radius-badge">Within {RADIUS_METERS}m</div>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {!coords && !error && (
        <div className="waiting-message">
          <div className="pulse-dot"></div>
          <p>Getting your location...</p>
        </div>
      )}

      {coords && users.length === 0 && !error && (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No one nearby</h3>
          <p>Try expanding your search radius or check back later</p>
        </div>
      )}

      {users.length > 0 && (
        <div className="users-grid">
          {users.map((user) => (
            <div key={user.id} className="user-card">
              <div className="user-avatar">
                <img
                  src={user.avatar_url ?? '/default-avatar.png'}
                  alt={user.username}
                  className="avatar-image"
                />
                <div className="online-indicator"></div>
              </div>
              
              <div className="user-info">
                <h4 className="username">{user.username}</h4>
                <div className="distance">
                  <span className="distance-icon">📏</span>
                  ~{Math.round(user.distance)}m away
                </div>
              </div>

              <button
                disabled={requests.includes(user.id)}
                onClick={() => sendRequest(user.id)}
                className={`request-button ${requests.includes(user.id) ? 'requested' : ''}`}
              >
                {requests.includes(user.id) ? (
                  <>
                    <span className="check-icon">✓</span>
                    Requested
                  </>
                ) : (
                  <>
                    <span className="plus-icon">+</span>
                    Connect
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Nearby;

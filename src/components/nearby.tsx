import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface UserProfile {
  id: number;
  username: string;
  avatar_url?: string;
  distance: number;
}

const RADIUS_METERS = 100; // User search radius

const Nearby: React.FC = () => {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requests, setRequests] = useState<number[]>([]); // IDs of users requested

  // Get JWT token from storage (adapt if you store elsewhere)
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
      ).catch(() => { /* (optional) set error */ });
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

  return (
    <div className="nearby-container" style={{ padding: 20, maxWidth: 400, margin: "auto" }}>
      <h2>Nearby Users</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {loading && <p>Loading...</p>}
      {!loading && !error && !coords && <p>Waiting for location...</p>}
      {!loading && users.length === 0 && coords && <p>No users nearby.</p>}

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {users.map((user) => (
          <li key={user.id} style={{ margin: '1em 0', display: 'flex', alignItems: 'center' }}>
            <img
              src={user.avatar_url ?? '/default-avatar.png'}
              alt={user.username}
              style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }}
            />
            <div style={{ flex: 1 }}>
              <div>{user.username}</div>
              <div style={{ fontSize: '0.85em', color: '#555' }}>
                ~{Math.round(user.distance)}m away
              </div>
            </div>
            <button
              disabled={requests.includes(user.id)}
              onClick={() => sendRequest(user.id)}
              style={{
                marginLeft: '1em',
                background: requests.includes(user.id) ? '#ccc' : '#007bff',
                color: '#fff',
                border: 'none',
                borderRadius: 5,
                padding: '0.3em 0.8em',
                cursor: requests.includes(user.id) ? 'default' : 'pointer',
              }}
            >
              {requests.includes(user.id) ? 'Requested' : 'Send Request'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Nearby;

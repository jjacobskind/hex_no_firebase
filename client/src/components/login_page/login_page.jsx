import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/use_auth';
import './login_page.css';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Attempt to login (placeholder logic)
    const success = login(username, password);
    if (success) {
      navigate('/game');
    } else {
      alert('Login failed');
    }
  };

  return (
    <div className="login-page">
      <h1>Hex Island Login</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Username:</label><br/>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div style={{ marginTop: 10 }}>
          <label>Password:</label><br/>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button style={{ marginTop: 10 }} type="submit">Log In</button>
      </form>
    </div>
  );
}

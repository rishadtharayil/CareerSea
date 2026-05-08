import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://api.careersea.in';
            const res = await axios.post(`${apiBaseUrl}/api/token/`, { username, password });
            localStorage.setItem('access_token', res.data.access);
            localStorage.setItem('refresh_token', res.data.refresh);
            navigate('/');
        } catch (error) {
            alert("Login failed. Please check your credentials.");
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '4rem auto' }} className="pop-card">
            <h1 style={{ marginBottom: '2rem' }}>LOGIN</h1>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
                <div>
                    <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.5rem' }}>USERNAME</label>
                    <input 
                        type="text" 
                        className="pop-input" 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)} 
                        required 
                    />
                </div>
                <div>
                    <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.5rem' }}>PASSWORD</label>
                    <input 
                        type="password" 
                        className="pop-input" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                    />
                </div>
                <button type="submit" className="pop-button">Sign In</button>
            </form>
            <p style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                Don't have an account? <Link to="/register">Register here</Link>
            </p>
        </div>
    );
};

export default Login;

import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://api.careersea.in';
            await axios.post(`${apiBaseUrl}/api/register/`, { username, email, password });
            alert("Registration successful! You can now log in.");
            navigate('/login');
        } catch (error) {
            alert("Registration failed. Try a different username.");
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '4rem auto' }} className="pop-card">
            <h1 style={{ marginBottom: '2rem' }}>REGISTER</h1>
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
                    <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.5rem' }}>EMAIL (OPTIONAL)</label>
                    <input 
                        type="email" 
                        className="pop-input" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
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
                <button type="submit" className="pop-button">Create Account</button>
            </form>
            <p style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                Already have an account? <Link to="/login">Login here</Link>
            </p>
        </div>
    );
};

export default Register;

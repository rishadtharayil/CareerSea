import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabase';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        const { error: authError } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
        });

        setSubmitting(false);

        if (authError) {
            // Supabase returns a deliberately vague message here to avoid
            // confirming whether an account exists.
            setError(
                authError.message === 'Invalid login credentials'
                    ? 'Incorrect email or password.'
                    : authError.message
            );
            return;
        }

        navigate('/');
    };

    return (
        <div className="pop-card max-w-[400px] mx-auto my-12 sm:my-16">
            <h1 className="text-4xl mb-8 uppercase">LOGIN</h1>
            <form onSubmit={handleSubmit} className="grid gap-6">
                <div>
                    <label className="block font-black mb-2 uppercase text-sm tracking-wider">EMAIL</label>
                    <input
                        type="email"
                        className="pop-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        required
                    />
                </div>
                <div>
                    <label className="block font-black mb-2 uppercase text-sm tracking-wider">PASSWORD</label>
                    <input
                        type="password"
                        className="pop-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        required
                    />
                </div>
                {error && (
                    <div role="alert" className="bg-accent text-text border-pop border-text rounded-pop px-4 py-3 font-black uppercase text-sm tracking-wider shadow-pop-sm">
                        {error}
                    </div>
                )}
                <button type="submit" className="pop-button w-full" disabled={submitting}>
                    {submitting ? 'Signing In...' : 'Sign In'}
                </button>
            </form>
            <p className="mt-6 text-center text-base">
                Don't have an account? <Link to="/register" className="font-bold underline decoration-2 underline-offset-4 hover:text-primary transition-colors">Register here</Link>
            </p>
        </div>
    );
};

export default Login;

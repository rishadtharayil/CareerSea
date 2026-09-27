import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabase';

const MIN_PASSWORD_LENGTH = 12;

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setNotice('');

        if (password.length < MIN_PASSWORD_LENGTH) {
            setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
            return;
        }

        setSubmitting(true);

        const { data, error: authError } = await supabase.auth.signUp({
            email: email.trim(),
            password,
        });

        setSubmitting(false);

        if (authError) {
            setError(authError.message);
            return;
        }

        // When email confirmation is enabled there is no session yet.
        if (data.session) {
            navigate('/');
            return;
        }

        setNotice('Account created. Check your email to confirm it, then sign in.');
    };

    return (
        <div className="pop-card max-w-[400px] mx-auto my-12 sm:my-16">
            <h1 className="text-4xl mb-8 uppercase">REGISTER</h1>
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
                        autoComplete="new-password"
                        minLength={MIN_PASSWORD_LENGTH}
                        required
                    />
                    <p className="mt-2 text-sm font-bold uppercase tracking-wider opacity-70">
                        Minimum {MIN_PASSWORD_LENGTH} characters
                    </p>
                </div>
                {error && (
                    <div role="alert" className="bg-accent text-text border-pop border-text rounded-pop px-4 py-3 font-black uppercase text-sm tracking-wider shadow-pop-sm">
                        {error}
                    </div>
                )}
                {notice && (
                    <div role="status" className="bg-secondary text-text border-pop border-text rounded-pop px-4 py-3 font-black uppercase text-sm tracking-wider shadow-pop-sm">
                        {notice}
                    </div>
                )}
                <button type="submit" className="pop-button w-full" disabled={submitting}>
                    {submitting ? 'Creating...' : 'Create Account'}
                </button>
            </form>
            <p className="mt-6 text-center text-base">
                Already have an account? <Link to="/login" className="font-bold underline decoration-2 underline-offset-4 hover:text-primary transition-colors">Login here</Link>
            </p>
        </div>
    );
};

export default Register;

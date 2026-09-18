import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { Briefcase, ArrowRight, Lock, Mail, User, AlertCircle, CheckCircle2 } from 'lucide-react';

export const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { loginAsDemo } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authService.register({ 
        name: name.trim(), 
        email: email.trim().toLowerCase(), 
        password: password 
      });
      setSuccess(true);
      // Wait 1.5 seconds then redirect to login screen so user signs in manually
      setTimeout(() => {
        navigate('/login', { state: { registeredEmail: email } });
      }, 1500);
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (detail) {
        setError(detail);
      } else {
        setError('Backend server is connecting or offline. You can explore instantly with the 1-Click Demo Account below!');
      }
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4 sm:px-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center mx-auto shadow-2xs">
            <Briefcase className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-950">Create Your Account</h2>
          <p className="text-xs text-slate-500">
            Start your connected ATS preparation & mock interview workflow.
          </p>
        </div>

        {success && (
          <div className="flex items-start gap-2 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Account created successfully!</p>
              <p className="mt-0.5 text-emerald-700">Redirecting to login. Please enter your email and password to sign in.</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Full Name *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Balaga Mani Sai Sampath"
                className="w-full px-3 py-2 pl-9 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address *
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sampath@example.com"
                className="w-full px-3 py-2 pl-9 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password *
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full px-3 py-2 pl-9 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-all shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Complete Registration'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <div className="relative flex items-center justify-center my-2">
            <div className="border-t border-slate-200 w-full"></div>
            <span className="bg-white px-2 text-[10px] uppercase font-semibold text-slate-400">or explore immediately</span>
          </div>

          <button
            type="button"
            onClick={() => {
              loginAsDemo();
              navigate('/dashboard');
            }}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-all shadow-xs flex items-center justify-center gap-1.5"
            id="btn-register-demo"
          >
            <span>Explore Demo Account (Instant 1-Click)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="text-center pt-2 text-xs text-slate-500">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-slate-900 hover:underline">
            Sign in
          </Link>
        </div>

      </div>
    </div>
  );
};

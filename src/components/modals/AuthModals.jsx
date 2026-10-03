import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { apiFetch } from '../../api/client';

export function Login({ onLogin }) {
  const [screen, setScreen] = useState('main'); // 'main', 'register-email', 'register-otp', 'login', 'forgot-password', 'forgot-otp', 'reset-password'
  const [email, setEmail] = useState('admin@sharada.edu');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('admin123');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [registrationData, setRegistrationData] = useState({ email: '', name: '', password: '' });

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await apiFetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (response.ok) {
        onLogin(await response.json());
      } else {
        const result = await response.json().catch(() => ({}));
        setError(result.error || 'Invalid email or password');
      }
    } catch {
      setError('Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterRequest = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (!name.trim()) throw new Error('Full name is required');
      if (password.length < 6) throw new Error('Password must be at least 6 characters');
      const response = await apiFetch('/api/register/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      if (response.ok) {
        setRegistrationData({ email, name, password });
        setOtp('');
        setScreen('register-otp');
        setSuccess('Verification code sent to your email');
      } else {
        const result = await response.json().catch(() => ({}));
        setError(result.error || 'Unable to register. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Unable to register. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (!otp.trim()) throw new Error('Verification code is required');
      const response = await apiFetch('/api/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: registrationData.email, otp })
      });
      if (response.ok) {
        const userData = await response.json();
        setSuccess('Account created successfully!');
        setTimeout(() => onLogin(userData), 500);
      } else {
        const result = await response.json().catch(() => ({}));
        setError(result.error || 'Invalid or expired verification code');
      }
    } catch (err) {
      setError(err.message || 'Unable to verify. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordRequest = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (!email.trim()) throw new Error('Email is required');
      const response = await apiFetch('/api/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (response.ok) {
        setOtp('');
        setScreen('forgot-otp');
        setSuccess('If an account exists, a verification code was sent to the email');
      } else {
        const result = await response.json().catch(() => ({}));
        setError(result.error || 'Unable to process. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Unable to process. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (!otp.trim()) throw new Error('Verification code is required');
      const response = await apiFetch('/api/password-reset/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      if (response.ok) {
        const result = await response.json();
        setResetToken(result.resetToken);
        setNewPassword('');
        setConfirmPassword('');
        setScreen('reset-password');
        setSuccess('Verification successful. Set your new password.');
      } else {
        const result = await response.json().catch(() => ({}));
        setError(result.error || 'Invalid or expired verification code');
      }
    } catch (err) {
      setError(err.message || 'Unable to verify. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (newPassword.length < 6) throw new Error('Password must be at least 6 characters');
      if (newPassword !== confirmPassword) throw new Error('Passwords do not match');
      const response = await apiFetch('/api/password-reset/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken, password: newPassword })
      });
      if (response.ok) {
        setSuccess('Password updated successfully! Redirecting to login...');
        setTimeout(() => {
          setScreen('main');
          setEmail('');
          setPassword('');
          setName('');
          setOtp('');
          setNewPassword('');
          setConfirmPassword('');
          setResetToken('');
          setSuccess('');
        }, 1000);
      } else {
        const result = await response.json().catch(() => ({}));
        setError(result.error || 'Unable to reset password. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Unable to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setError('');
    setSuccess('');
    setOtp('');
    setEmail('admin@sharada.edu');
    setPassword('admin123');
    setName('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div
      className="login-page"
      style={{
        backgroundImage: 'url(/banner.jpeg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="login-card">
        {/* Main Screen */}
        {screen === 'main' && (
          <form onSubmit={(e) => { e.preventDefault(); setScreen('login'); resetForm(); }} style={{background: '#ffffff'}}>
            <p style={{ marginBottom: '20px', textAlign: 'center', fontSize: '14px', color: '#666' }}>Select an option to continue</p>
            {error && <div className="error">{error}</div>}
            <button type="submit" className="primary-button wide" style={{ marginBottom: '10px' }}>Sign In</button>
            <button type="button" className="primary-button wide" onClick={() => { setScreen('register-email'); resetForm(); }} style={{ marginBottom: '10px' }}>Create Account</button>
            <button type="button" className="text-button" onClick={() => { setScreen('forgot-password'); resetForm(); }}>Forgot Password?</button>
          </form>
        )}

        {/* Login Screen */}
        {screen === 'login' && (
          <form onSubmit={handleLogin}>
            <div className="login-heading"><p>Sign In</p></div>
            <label>Email address<input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required /></label>
            <label>Password<input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required /></label>
            {error && <div className="error">{error}</div>}
            {success && <div className="success">{success}</div>}
            <button type="submit" disabled={loading} className="primary-button wide">{loading ? 'Signing in...' : 'Sign In'} <ChevronRight size={17} /></button>
            <button type="button" className="text-button" onClick={() => { setScreen('main'); resetForm(); }}>Back</button>
          </form>
        )}

        {/* Register Email Screen */}
        {screen === 'register-email' && (
          <form onSubmit={handleRegisterRequest}>
            <div className="login-heading"><p>Create Account</p></div>
            <label>Full Name<input value={name} onChange={(e) => setName(e.target.value)} type="text" required /></label>
            <label>Email address<input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required /></label>
            <label>Password<input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required /></label>
            <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>Password must be at least 6 characters</p>
            {error && <div className="error">{error}</div>}
            {success && <div className="success">{success}</div>}
            <button type="submit" disabled={loading} className="primary-button wide">{loading ? 'Sending...' : 'Send Verification Code'} <ChevronRight size={17} /></button>
            <button type="button" className="text-button" onClick={() => { setScreen('main'); resetForm(); }}>Back</button>
          </form>
        )}

        {/* Register OTP Screen */}
        {screen === 'register-otp' && (
          <form onSubmit={handleRegisterVerify}>
            <div className="login-heading"><p>Verify Email</p></div>
            <p style={{ marginBottom: '16px', textAlign: 'center', fontSize: '14px', color: '#666' }}>Enter the verification code sent to<br /><strong>{registrationData.email}</strong></p>
            <label>Verification Code<input value={otp} onChange={(e) => setOtp(e.target.value)} type="text" placeholder="000000" maxLength="6" required /></label>
            <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>Code expires in 10 minutes</p>
            {error && <div className="error">{error}</div>}
            {success && <div className="success">{success}</div>}
            <button type="submit" disabled={loading} className="primary-button wide">{loading ? 'Verifying...' : 'Verify & Create Account'} <ChevronRight size={17} /></button>
            <button type="button" className="text-button" onClick={() => { setScreen('register-email'); resetForm(); }}>Back</button>
          </form>
        )}

        {/* Forgot Password Screen */}
        {screen === 'forgot-password' && (
          <form onSubmit={handleForgotPasswordRequest}>
            <div className="login-heading"><p>Reset Password</p></div>
            <p style={{ marginBottom: '16px', textAlign: 'center', fontSize: '14px', color: '#666' }}>Enter your email address and we'll send you a verification code</p>
            <label>Email address<input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required /></label>
            {error && <div className="error">{error}</div>}
            {success && <div className="success">{success}</div>}
            <button type="submit" disabled={loading} className="primary-button wide">{loading ? 'Sending...' : 'Send Verification Code'} <ChevronRight size={17} /></button>
            <button type="button" className="text-button" onClick={() => { setScreen('main'); resetForm(); }}>Back</button>
          </form>
        )}

        {/* Forgot Password OTP Screen */}
        {screen === 'forgot-otp' && (
          <form onSubmit={handleForgotPasswordVerify}>
            <div className="login-heading"><p>Verify Email</p></div>
            <p style={{ marginBottom: '16px', textAlign: 'center', fontSize: '14px', color: '#666' }}>Enter the verification code sent to<br /><strong>{email}</strong></p>
            <label>Verification Code<input value={otp} onChange={(e) => setOtp(e.target.value)} type="text" placeholder="000000" maxLength="6" required /></label>
            <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>Code expires in 10 minutes</p>
            {error && <div className="error">{error}</div>}
            {success && <div className="success">{success}</div>}
            <button type="submit" disabled={loading} className="primary-button wide">{loading ? 'Verifying...' : 'Verify'} <ChevronRight size={17} /></button>
            <button type="button" className="text-button" onClick={() => { setScreen('forgot-password'); resetForm(); }}>Back</button>
          </form>
        )}

        {/* Reset Password Screen */}
        {screen === 'reset-password' && (
          <form onSubmit={handleResetPassword}>
            <div className="login-heading"><p>Create New Password</p></div>
            <label>New Password<input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" required /></label>
            <label>Confirm Password<input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password" required /></label>
            <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>Password must be at least 6 characters</p>
            {error && <div className="error">{error}</div>}
            {success && <div className="success">{success}</div>}
            <button type="submit" disabled={loading} className="primary-button wide">{loading ? 'Updating...' : 'Update Password'} <ChevronRight size={17} /></button>
            <button type="button" className="text-button" onClick={() => { setScreen('main'); resetForm(); }}>Back</button>
          </form>
        )}
      </div>
    </div>
  );
}

export default Login;

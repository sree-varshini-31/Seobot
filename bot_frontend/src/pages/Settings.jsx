import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    patchProfile,
    uploadAvatar,
    deleteAvatar,
    changePassword,
    getProfile,
} from '../api/client';

export default function Settings() {
    const { user, updateUser, refreshUser, defaultAvatar } = useAuth();
    const [firstName, setFirstName] = useState(user?.first_name || '');
    const [username, setUsername] = useState(user?.username || '');
    const [email, setEmail] = useState(user?.email || '');
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState(null);
    const [err, setErr] = useState(null);

    const [emailCurrentPassword, setEmailCurrentPassword] = useState('');

    const [oldPw, setOldPw] = useState('');
    const [newPw, setNewPw] = useState('');
    const [pwMsg, setPwMsg] = useState(null);
    const [pwErr, setPwErr] = useState(null);
    const [pwLoading, setPwLoading] = useState(false);

    const fileRef = useRef(null);
    const [avatarBusy, setAvatarBusy] = useState(false);

    useEffect(() => {
        setFirstName(user?.first_name || '');
        setUsername(user?.username || '');
        setEmail(user?.email || '');
    }, [user?.first_name, user?.username, user?.email]);

    const avatarSrc = user?.avatar || defaultAvatar;

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setErr(null);
        setMsg(null);
        setSaving(true);
        try {
            const nextEmail = email.trim();
            const body = {
                first_name: firstName.trim(),
                username: username.trim(),
                email: nextEmail,
            };
            if (nextEmail.toLowerCase() !== (user?.email || '').toLowerCase()) {
                if (!emailCurrentPassword.trim()) {
                    setErr('Enter your current password to change your email.');
                    setSaving(false);
                    return;
                }
                body.current_password = emailCurrentPassword;
            }
            const data = await patchProfile(body);
            if (data?.user) {
                updateUser(data.user);
                setEmailCurrentPassword('');
                setMsg('Settings saved.');
            }
        } catch (e) {
            setErr(e?.error || (Array.isArray(e?.error) ? e.error.join(' ') : '') || 'Could not save.');
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarPick = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAvatarBusy(true);
        setErr(null);
        try {
            const data = await uploadAvatar(file);
            if (data?.user) updateUser(data.user);
            await refreshUser();
            setMsg('Photo updated.');
        } catch (e) {
            setErr(e?.error || 'Upload failed.');
        } finally {
            setAvatarBusy(false);
            if (fileRef.current) fileRef.current.value = '';
        }
    };

    const handleRemoveAvatar = async () => {
        setAvatarBusy(true);
        setErr(null);
        try {
            const data = await deleteAvatar();
            if (data?.user) updateUser(data.user);
            await refreshUser();
            setMsg('Photo removed.');
        } catch (e) {
            setErr(e?.error || 'Could not remove photo.');
        } finally {
            setAvatarBusy(false);
        }
    };

    const handlePassword = async (e) => {
        e.preventDefault();
        setPwErr(null);
        setPwMsg(null);
        setPwLoading(true);
        try {
            await changePassword(oldPw, newPw);
            setOldPw('');
            setNewPw('');
            setPwMsg('Password updated.');
        } catch (e) {
            const m = e?.error;
            setPwErr(Array.isArray(m) ? m.join(' ') : m || 'Could not change password.');
        } finally {
            setPwLoading(false);
        }
    };

    const reload = async () => {
        const data = await getProfile();
        if (data?.user) updateUser(data.user);
    };

    return (
        <div className="px-4 py-6 sm:p-8 lg:p-10 max-w-3xl mx-auto w-full space-y-8 pb-24">
            <div>
                <h1 className="text-2xl sm:text-[28px] font-extrabold text-on-surface tracking-tight">Settings</h1>
                <p className="text-on-surface-variant mt-1 text-sm sm:text-base">Your name, email, photo, and sign-in credentials.</p>
            </div>

            {(msg || err) && (
                <div
                    className={`p-4 rounded-xl text-sm font-semibold border ${
                        err
                            ? 'bg-error-container/50 border-error/30 text-error'
                            : 'bg-secondary-fixed/40 border-secondary/30 text-[#1e4620]'
                    }`}
                >
                    {err || msg}
                </div>
            )}

            <section className="bg-surface-container-lowest border border-outline-variant/40 rounded-[24px] p-5 sm:p-8 shadow-sm">
                <h2 className="text-[11px] font-extrabold uppercase tracking-widest text-outline mb-6">Profile photo</h2>
                <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                    <img
                        src={avatarSrc}
                        alt=""
                        className="w-24 h-24 rounded-full object-cover border-2 border-outline-variant/50"
                    />
                    <div className="flex flex-wrap gap-3">
                        <input
                            ref={fileRef}
                            type="file"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            className="hidden"
                            onChange={handleAvatarPick}
                        />
                        <button
                            type="button"
                            disabled={avatarBusy}
                            onClick={() => fileRef.current?.click()}
                            className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-md disabled:opacity-60"
                        >
                            {avatarBusy ? 'Working…' : 'Upload photo'}
                        </button>
                        {user?.avatar && (
                            <button
                                type="button"
                                disabled={avatarBusy}
                                onClick={handleRemoveAvatar}
                                className="px-5 py-2.5 rounded-xl border border-outline-variant font-bold text-sm text-on-surface-variant hover:bg-surface-container-low"
                            >
                                Remove photo
                            </button>
                        )}
                    </div>
                </div>
            </section>

            <form onSubmit={handleSaveProfile} className="bg-surface-container-lowest border border-outline-variant/40 rounded-[24px] p-5 sm:p-8 shadow-sm space-y-5">
                <h2 className="text-[11px] font-extrabold uppercase tracking-widest text-outline">Account</h2>
                <div>
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide" htmlFor="fn">
                        Display name
                    </label>
                    <input
                        id="fn"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="How we greet you"
                        className="mt-1 w-full px-4 py-3 rounded-xl border border-outline-variant/50 bg-surface-container-low text-sm focus:outline-none focus:border-primary"
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide" htmlFor="uname">
                        Username
                    </label>
                    <input
                        id="uname"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoComplete="username"
                        className="mt-1 w-full px-4 py-3 rounded-xl border border-outline-variant/50 bg-surface-container-low text-sm focus:outline-none focus:border-primary"
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide" htmlFor="em">
                        Email
                    </label>
                    <input
                        id="em"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        className="mt-1 w-full px-4 py-3 rounded-xl border border-outline-variant/50 bg-surface-container-low text-sm focus:outline-none focus:border-primary"
                    />
                    <p className="text-[11px] text-outline mt-1.5">Changing email requires your current password (security).</p>
                </div>
                {email.trim().toLowerCase() !== (user?.email || '').toLowerCase() && (
                    <div>
                        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide" htmlFor="emcpw">
                            Current password (to confirm email change)
                        </label>
                        <input
                            id="emcpw"
                            type="password"
                            value={emailCurrentPassword}
                            onChange={(e) => setEmailCurrentPassword(e.target.value)}
                            autoComplete="current-password"
                            className="mt-1 w-full px-4 py-3 rounded-xl border border-outline-variant/50 bg-surface-container-low text-sm focus:outline-none focus:border-primary"
                        />
                    </div>
                )}
                <button
                    type="submit"
                    disabled={saving}
                    className="px-8 py-3 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-md disabled:opacity-60"
                >
                    {saving ? 'Saving…' : 'Save account'}
                </button>
            </form>

            <form onSubmit={handlePassword} className="bg-surface-container-lowest border border-outline-variant/40 rounded-[24px] p-5 sm:p-8 shadow-sm space-y-5">
                <h2 className="text-[11px] font-extrabold uppercase tracking-widest text-outline">Password</h2>
                {pwMsg && <div className="text-sm font-semibold text-secondary">{pwMsg}</div>}
                {pwErr && <div className="text-sm font-semibold text-error">{pwErr}</div>}
                <div>
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide" htmlFor="op">
                        Current password
                    </label>
                    <input
                        id="op"
                        type="password"
                        value={oldPw}
                        onChange={(e) => setOldPw(e.target.value)}
                        className="mt-1 w-full px-4 py-3 rounded-xl border border-outline-variant/50 bg-surface-container-low text-sm focus:outline-none focus:border-primary"
                        autoComplete="current-password"
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide" htmlFor="np">
                        New password
                    </label>
                    <input
                        id="np"
                        type="password"
                        value={newPw}
                        onChange={(e) => setNewPw(e.target.value)}
                        className="mt-1 w-full px-4 py-3 rounded-xl border border-outline-variant/50 bg-surface-container-low text-sm focus:outline-none focus:border-primary"
                        autoComplete="new-password"
                    />
                </div>
                <button
                    type="submit"
                    disabled={pwLoading}
                    className="px-8 py-3 rounded-xl border-2 border-primary text-primary font-bold text-sm hover:bg-primary/5 disabled:opacity-60"
                >
                    {pwLoading ? 'Updating…' : 'Update password'}
                </button>
            </form>

            <button type="button" onClick={reload} className="text-sm font-bold text-primary hover:underline">
                Reload from server
            </button>
        </div>
    );
}

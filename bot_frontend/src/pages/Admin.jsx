import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { adminGetUsers, adminUpdateUser, adminDeleteUser } from '../api/client';
import { apiClient } from '../api/client';

export default function Admin() {
    const location = useLocation();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selected, setSelected] = useState(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState(location.state?.filter || 'all');
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [msg, setMsg] = useState(null);
    const [deactivationReason, setDeactivationReason] = useState("");
    const [showDeactivateModal, setShowDeactivateModal] = useState(null);

    useEffect(() => {
        fetchAll();
    }, []);

    async function fetchAll() {
        setLoading(true);
        setError(null);
        try {
            const [usersRes, statsRes] = await Promise.allSettled([
                adminGetUsers(),
                apiClient('/auth/admin/stats/'),
            ]);
            const ud = usersRes.status === 'fulfilled' ? usersRes.value : null;
            const sd = statsRes.status === 'fulfilled' ? statsRes.value : null;
            setUsers(ud?.users || ud?.results || (Array.isArray(ud) ? ud : []));
            setStats(sd?.stats || null);
        } catch (e) {
            setError('Failed to load admin data. Make sure you are an admin.');
        } finally {
            setLoading(false);
        }
    }

    async function executeDeactivation(user, reason) {
        setActionLoading(true);
        try {
            await adminUpdateUser(user.id, { is_active: false, deactivation_reason: reason });
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: false, deactivation_reason: reason } : u));
            setSelected(prev => prev?.id === user.id ? { ...prev, is_active: false, deactivation_reason: reason } : prev);
            setMsg(`User ${user.username} deactivated.`);
            setShowDeactivateModal(null);
        } catch {
            setMsg('Failed to deactivate user.');
        } finally {
            setActionLoading(false);
        }
    }

    async function handleToggleActive(user) {
        if (user.is_active) {
            setShowDeactivateModal(user);
            return;
        }
        setActionLoading(true);
        try {
            await adminUpdateUser(user.id, { is_active: true });
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: true, deactivation_reason: null } : u));
            setSelected(prev => prev?.id === user.id ? { ...prev, is_active: true, deactivation_reason: null } : prev);
            setMsg(`User ${user.username} activated.`);
        } catch {
            setMsg('Failed to update user.');
        } finally {
            setActionLoading(false);
        }
    }

    async function handleDelete(user) {
        setActionLoading(true);
        try {
            await adminDeleteUser(user.id);
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_deleted: true } : u));
            setSelected(prev => prev?.id === user.id ? { ...prev, is_deleted: true } : prev);
            setConfirmDelete(null);
            setMsg(`User ${user.username} deleted.`);
        } catch {
            setMsg('Failed to delete user.');
        } finally {
            setActionLoading(false);
        }
    }

    const filtered = users.filter(u => {
        const matchesSearch = u.username?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
        if (!matchesSearch) return false;
        if (statusFilter === 'active') return u.is_active;
        if (statusFilter === 'inactive') return !u.is_active;
        if (statusFilter === 'deleted') return u.is_deleted;
        if (statusFilter === 'admin') return u.is_staff || u.is_superuser;
        return true;
    });

    const statCards = [
        { label: 'Total Users', id: 'all', value: stats?.users?.total ?? users.length, icon: 'group', color: 'text-blue-600 bg-blue-50' },
        { label: 'Active', id: 'active', value: stats?.users?.active ?? users.filter(u => u.is_active).length, icon: 'check_circle', color: 'text-green-600 bg-green-50' },
        { label: 'Inactive', id: 'inactive', value: stats?.users ? (stats.users.total - stats.users.active) : users.filter(u => !u.is_active).length, icon: 'block', color: 'text-orange-600 bg-orange-50' },
        { label: 'Deleted', id: 'deleted', value: users.filter(u => u.is_deleted).length, icon: 'delete', color: 'text-red-600 bg-red-50' },
        { label: 'Admins', id: 'admin', value: stats?.users?.admins ?? users.filter(u => u.is_staff).length, icon: 'admin_panel_settings', color: 'text-purple-600 bg-purple-50' },
    ];

    return (
        <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-8 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="flex items-center gap-3 text-2xl font-extrabold text-on-surface tracking-tight">
                        <span className="material-symbols-outlined text-[28px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>admin_panel_settings</span>
                        Admin Panel
                    </h1>
                    <p className="text-sm text-outline mt-1">Manage all users and platform data</p>
                </div>
                <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-3 py-1 rounded-full border border-purple-200 uppercase tracking-widest">
                    Admin Access
                </span>
            </div>

            {/* Message */}
            {msg && (
                <div className="p-3 bg-secondary-fixed/30 border border-secondary/20 rounded-xl text-sm font-semibold text-on-surface flex items-center justify-between">
                    {msg}
                    <button onClick={() => setMsg(null)} className="text-outline hover:text-on-surface ml-4">
                        <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                </div>
            )}

            {error && (
                <div className="p-4 bg-error/10 border border-error/20 rounded-xl text-sm font-semibold text-error">{error}</div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map(s => (
                    <div 
                        key={s.label} 
                        onClick={() => setStatusFilter(s.id)}
                        className={`bg-surface-container-lowest border rounded-2xl p-4 shadow-sm cursor-pointer transition-all ${statusFilter === s.id ? 'border-primary ring-1 ring-primary' : 'border-outline-variant/30 hover:border-primary/50'}`}
                    >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
                            <span className="material-symbols-outlined text-[18px]">{s.icon}</span>
                        </div>
                        <p className="text-2xl font-extrabold text-on-surface">{s.value ?? '—'}</p>
                        <p className="text-xs text-outline mt-0.5 font-semibold">{s.label}</p>
                    </div>
                ))}
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Users list */}
                <div className="flex-1 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm">
                    <div className="px-5 py-4 border-b border-outline-variant/20">
                        <h2 className="text-sm font-extrabold text-on-surface mb-3">All Users</h2>
                        <div className="flex items-center gap-2 bg-surface-container-low border border-[#dadce0] rounded-xl px-3 py-2.5">
                            <span className="material-symbols-outlined text-outline text-[16px]">search</span>
                            <input
                                type="search"
                                placeholder="Search by name or email…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="bg-transparent border-none focus:ring-0 text-sm w-full outline-none placeholder:text-outline/60"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="bg-surface-container-low border border-[#dadce0] rounded-xl px-3 py-2.5 text-sm outline-none"
                        >
                            <option value="all">All Users</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="deleted">Deleted</option>
                            <option value="admin">Admins</option>
                        </select>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <span className="material-symbols-outlined text-outline text-[28px] animate-spin">progress_activity</span>
                        </div>
                    ) : (
                        <ul className="divide-y divide-outline-variant/20 max-h-[500px] overflow-y-auto">
                            {filtered.length === 0 && (
                                <li className="px-5 py-10 text-center text-sm text-outline">No users found</li>
                            )}
                            {filtered.map(u => (
                                <li
                                    key={u.id}
                                    onClick={() => setSelected(u)}
                                    className={`flex items-center justify-between px-5 py-3 cursor-pointer transition-colors ${selected?.id === u.id ? 'bg-primary/5' : 'hover:bg-surface-container-low'
                                        }`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold text-sm">
                                            {u.username?.[0]?.toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-on-surface truncate">{u.username}</p>
                                            <p className="text-xs text-outline truncate">{u.email || '—'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 ml-2">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                            u.is_deleted ? 'bg-gray-100 text-gray-600' :
                                            u.is_active ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'
                                            }`}>
                                            {u.is_deleted ? 'Deleted' : u.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                        <span className="text-xs text-outline">{u.project_count ?? 0} sites</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* User detail panel */}
                {selected && (
                    <div className="w-full lg:w-72 shrink-0 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm self-start">
                        <div className="px-5 py-4 border-b border-outline-variant/20 flex items-center justify-between">
                            <h2 className="text-sm font-extrabold text-on-surface">User Detail</h2>
                            <button onClick={() => setSelected(null)} className="text-outline hover:text-on-surface">
                                <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                        </div>
                        <div className="p-5">
                            {/* Avatar */}
                            <div className="flex flex-col items-center text-center mb-5">
                                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-extrabold text-2xl mb-2">
                                    {selected.username?.[0]?.toUpperCase()}
                                </div>
                                <p className="text-sm font-bold text-on-surface">{selected.username}</p>
                                <p className="text-xs text-outline break-all">{selected.email || '—'}</p>
                            </div>

                            {/* Info */}
                            <div className="space-y-2 mb-5 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-outline">Joined</span>
                                    <span className="font-bold">{selected.date_joined || '—'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-outline">Websites</span>
                                    <span className="font-bold">{selected.project_count ?? 0}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-outline">Status</span>
                                    <span className={`font-bold ${
                                        selected.is_deleted ? 'text-gray-600' :
                                        selected.is_active ? 'text-green-600' : 'text-red-500'
                                        }`}>
                                        {selected.is_deleted ? 'Deleted' : selected.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                {!selected.is_active && selected.deactivation_reason && (
                                    <div className="flex flex-col mt-2 p-2 bg-error/5 border border-error/10 rounded-lg">
                                        <span className="text-outline text-[10px] uppercase font-bold tracking-wider">Reason Disabled</span>
                                        <span className="font-bold text-error break-words">{selected.deactivation_reason}</span>
                                    </div>
                                )}
                                <div className="mt-4 pt-4 border-t border-outline-variant/20 space-y-2">
                                    <div className="text-[10px] font-extrabold uppercase tracking-widest text-outline mb-2">Usage Stats</div>
                                    <div className="flex justify-between">
                                        <span className="text-outline">API Calls</span>
                                        <span className="font-bold">{selected.api_calls_used ?? 0}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-outline">Sites Searched</span>
                                        <span className="font-bold">{selected.websites_searched ?? 0}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-outline">Data Received</span>
                                        <span className="font-bold">
                                            {selected.data_received_bytes ? (selected.data_received_bytes / 1024).toFixed(1) + ' KB' : '0 KB'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* User's projects */}
                            {selected.projects?.length > 0 && (
                                <div className="mb-5">
                                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-outline mb-2">Websites</p>
                                    <ul className="space-y-1.5">
                                        {selected.projects.map(p => (
                                            <li key={p.id} className="text-xs bg-surface-container-low rounded-lg px-3 py-2 text-on-surface-variant truncate">
                                                {p.url || p.name}
                                                {p.last_score != null && (
                                                    <span className="ml-2 font-bold text-primary">Score: {p.last_score}</span>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="space-y-2">
                                <button
                                    type="button"
                                    disabled={actionLoading}
                                    onClick={() => handleToggleActive(selected)}
                                    className="w-full text-xs font-bold py-2.5 rounded-xl border border-outline-variant/40 hover:bg-surface-container-low transition-colors disabled:opacity-60"
                                >
                                    {selected.is_active ? 'Deactivate User' : 'Activate User'}
                                </button>
                                <button
                                    type="button"
                                    disabled={actionLoading}
                                    onClick={() => setConfirmDelete(selected)}
                                    className="w-full text-xs font-bold py-2.5 rounded-xl bg-error/10 text-error hover:bg-error/20 transition-colors disabled:opacity-60"
                                >
                                    Delete User
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete confirm modal */}
            {confirmDelete && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
                        <h3 className="text-base font-extrabold text-on-surface mb-2">Delete User?</h3>
                        <p className="text-sm text-outline mb-6">
                            This will permanently delete <strong>{confirmDelete.username}</strong> and all their data. This cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setConfirmDelete(null)}
                                className="flex-1 py-2.5 text-sm font-bold border border-outline-variant/40 rounded-xl hover:bg-surface-container-low transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={actionLoading}
                                onClick={() => handleDelete(confirmDelete)}
                                className="flex-1 py-2.5 text-sm font-bold bg-error text-white rounded-xl hover:bg-error/90 transition-colors disabled:opacity-60"
                            >
                                {actionLoading ? 'Deleting…' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Deactivation confirm modal */}
            {showDeactivateModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
                        <h3 className="text-base font-extrabold text-on-surface mb-2">Deactivate User?</h3>
                        <p className="text-sm text-outline mb-6">
                            You are about to deactivate <strong>{showDeactivateModal.username}</strong>. They will see an automated message that their account has been deactivated by an administrator when they try to log in.
                        </p>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowDeactivateModal(null);
                                }}
                                className="flex-1 py-2.5 text-sm font-bold border border-outline-variant/40 rounded-xl hover:bg-surface-container-low transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={actionLoading}
                                onClick={() => executeDeactivation(showDeactivateModal, "Your account has been deactivated by an administrator.")}
                                className="flex-1 py-2.5 text-sm font-bold bg-error text-white rounded-xl hover:bg-error/90 transition-colors disabled:opacity-60"
                            >
                                {actionLoading ? 'Saving…' : 'Deactivate'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
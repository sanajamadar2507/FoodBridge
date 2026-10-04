import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  ShieldCheck,
  Building2,
  Heart,
  CheckCircle,
  XCircle,
  TrendingUp,
  Award,
  History,
  FileText,
} from 'lucide-react';

export default function AdminDashboard() {
  const [organizations, setOrganizations] = useState({ donors: [], recipients: [] });
  const [analytics, setAnalytics] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ANALYTICS'); // 'ANALYTICS' | 'VERIFY' | 'LOGS'

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const [orgRes, analyticsRes, logsRes] = await Promise.all([
        api.get('/admin/organizations'),
        api.get('/admin/analytics'),
        api.get('/admin/logs'),
      ]);
      setOrganizations(orgRes.data);
      setAnalytics(analyticsRes.data);
      setLogs(logsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOrg = async (type, id, verifiedState) => {
    try {
      await api.patch('/admin/verify-org', {
        type,
        id,
        verified: verifiedState,
      });
      fetchAdminData();
    } catch (err) {
      alert('Failed to update verification status');
    }
  };

  if (loading) {
    return <div className="py-16 text-center text-gray-500 text-sm">Loading admin dashboard analytics...</div>;
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-purple-400" />
            <h1 className="text-2xl sm:text-3xl font-extrabold">System Administration Panel</h1>
          </div>
          <p className="text-xs text-purple-200 mt-1">
            Monitor platform metrics, verify NGO documents, and track food waste reduction trends
          </p>
        </div>

        <div className="flex bg-purple-950/60 p-1.5 rounded-2xl border border-purple-700/50 text-xs font-bold">
          <button
            onClick={() => setActiveTab('ANALYTICS')}
            className={`px-4 py-2 rounded-xl transition ${
              activeTab === 'ANALYTICS' ? 'bg-purple-600 text-white shadow' : 'text-purple-200 hover:text-white'
            }`}
          >
            Analytics & Impact
          </button>
          <button
            onClick={() => setActiveTab('VERIFY')}
            className={`px-4 py-2 rounded-xl transition ${
              activeTab === 'VERIFY' ? 'bg-purple-600 text-white shadow' : 'text-purple-200 hover:text-white'
            }`}
          >
            Verify Organizations
          </button>
          <button
            onClick={() => setActiveTab('LOGS')}
            className={`px-4 py-2 rounded-xl transition ${
              activeTab === 'LOGS' ? 'bg-purple-600 text-white shadow' : 'text-purple-200 hover:text-white'
            }`}
          >
            Audit Logs
          </button>
        </div>
      </div>

      {activeTab === 'ANALYTICS' && analytics && (
        <div className="space-y-8">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-xs font-semibold text-gray-500 uppercase">Total Food Saved</p>
              <p className="text-3xl font-extrabold text-gray-900 mt-1">{analytics.summary.totalFoodSavedKg} kg</p>
              <span className="text-[11px] text-emerald-600 font-semibold">↑ 24% from last month</span>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-xs font-semibold text-gray-500 uppercase">Meals Served</p>
              <p className="text-3xl font-extrabold text-gray-900 mt-1">{analytics.summary.totalMealsDistributed}</p>
              <span className="text-[11px] text-emerald-600 font-semibold">Distributed via NGOs</span>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-xs font-semibold text-gray-500 uppercase">CO₂ Saved</p>
              <p className="text-3xl font-extrabold text-gray-900 mt-1">{analytics.summary.CO2ReducedKg} kg</p>
              <span className="text-[11px] text-purple-600 font-semibold">Environmental impact</span>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-xs font-semibold text-gray-500 uppercase">Active Organizations</p>
              <p className="text-3xl font-extrabold text-gray-900 mt-1">
                {analytics.summary.activeDonorsCount + analytics.summary.activeRecipientsCount}
              </p>
              <span className="text-[11px] text-blue-600 font-semibold">
                {analytics.summary.activeDonorsCount} Donors &bull; {analytics.summary.activeRecipientsCount} NGOs
              </span>
            </div>
          </div>

          {/* Recharts Food Waste Reduction Trend Chart */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" /> Food Waste Saved Over Time (kg)
            </h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.trendTimeline}>
                  <defs>
                    <linearGradient id="colorFood" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="foodSavedKg" name="Food Saved (kg)" stroke="#10b981" fillOpacity={1} fill="url(#colorFood)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Leaderboard & Category Charts */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Top Donors Leaderboard */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" /> Top Donor Organizations
              </h3>
              <div className="divide-y divide-gray-100">
                {analytics.topDonors.map((donor, idx) => (
                  <div key={donor.id} className="py-3 flex justify-between items-center text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-extrabold w-5 text-gray-400">#{idx + 1}</span>
                      <div>
                        <p className="font-bold text-gray-900">{donor.name}</p>
                        <p className="text-gray-500">{donor.type}</p>
                      </div>
                    </div>
                    <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      {donor.totalQuantity} Units Donated
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Breakdown Bar Chart */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-900 text-base">Food Category Distribution</h3>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.categoryCounts}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="_count.id" name="Listings Count" fill="#6366f1" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'VERIFY' && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Donors Verification Table */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" /> Donor Organizations ({organizations.donors.length})
            </h3>
            <div className="divide-y divide-gray-100">
              {organizations.donors.map((donor) => (
                <div key={donor.id} className="py-3 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-gray-900">{donor.organization_name}</p>
                    <p className="text-gray-500">{donor.user?.email} &bull; {donor.donor_type}</p>
                  </div>

                  <button
                    onClick={() => handleVerifyOrg('donor', donor.id, !donor.verified)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 ${
                      donor.verified
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-500 text-white shadow hover:bg-amber-600'
                    }`}
                  >
                    {donor.verified ? <CheckCircle className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                    <span>{donor.verified ? 'Verified' : 'Verify'}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Recipients Verification Table */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
              <Heart className="w-5 h-5 text-blue-600" /> Recipient NGOs & Shelters ({organizations.recipients.length})
            </h3>
            <div className="divide-y divide-gray-100">
              {organizations.recipients.map((rec) => (
                <div key={rec.id} className="py-3 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-gray-900">{rec.organization_name}</p>
                    <p className="text-gray-500">Reg #: {rec.registration_number || 'N/A'} &bull; Capacity: {rec.capacity}</p>
                  </div>

                  <button
                    onClick={() => handleVerifyOrg('recipient', rec.id, !rec.verified)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 ${
                      rec.verified
                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                        : 'bg-amber-500 text-white shadow hover:bg-amber-600'
                    }`}
                  >
                    {rec.verified ? <CheckCircle className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                    <span>{rec.verified ? 'Verified' : 'Verify'}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'LOGS' && (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
            <History className="w-5 h-5 text-purple-600" /> Admin Audit Log Trail
          </h3>

          <div className="divide-y divide-gray-100 text-xs">
            {logs.map((log) => (
              <div key={log.id} className="py-3 flex justify-between items-center">
                <div>
                  <span className="font-bold text-gray-900">{log.action}</span> on table <code className="bg-gray-100 px-1.5 py-0.5 rounded text-purple-700">{log.target_table}</code>
                  <p className="text-gray-500 mt-0.5">Admin: {log.admin?.name} ({log.admin?.email})</p>
                </div>
                <span className="text-gray-400">{new Date(log.timestamp).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

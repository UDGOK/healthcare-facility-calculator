'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Plus,
  FileText,
  Calendar,
  DollarSign,
  Download,
  Trash2,
  Edit3,
  User as UserIcon,
  LogOut,
  Search,
  Filter,
  Settings
} from 'lucide-react';

interface SavedEstimate {
  id: string;
  projectName: string;
  facilityType: string;
  totalCost: number;
  savedAt: string;
  lastModified?: string;
  status: 'draft' | 'final' | 'sent';
}

export default function DashboardPage() {
  const { user, logout, getUserEstimates, deleteEstimate } = useAuth();
  const router = useRouter();
  const [estimates, setEstimates] = useState<SavedEstimate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'final' | 'sent'>('all');

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const userEstimates = getUserEstimates();
    setEstimates(userEstimates);
  }, [user, router, getUserEstimates]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleDeleteEstimate = (estimateId: string) => {
    if (confirm('Are you sure you want to delete this estimate?')) {
      deleteEstimate(estimateId);
      setEstimates(prev => prev.filter(est => est.id !== estimateId));
    }
  };

  const filteredEstimates = estimates.filter(estimate => {
    const matchesSearch = estimate.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         estimate.facilityType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || estimate.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const totalEstimatesValue = estimates.reduce((sum, est) => sum + est.totalCost, 0);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <div className="bg-blue-600 text-white p-2 rounded-lg">
                  <Building2 className="h-6 w-6" />
                </div>
                <span className="text-xl font-bold text-gray-900">DS Arch</span>
              </Link>
              <div className="hidden md:block h-6 w-px bg-gray-300"></div>
              <h1 className="hidden md:block text-lg font-semibold text-gray-900">Dashboard</h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <UserIcon className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">{user.name}</span>
                {user.role === 'admin' && (
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Admin</span>
                )}
              </div>
              <button className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                <Settings className="h-5 w-5" />
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:block">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Estimates</p>
                <p className="text-2xl font-bold text-gray-900">{estimates.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">${totalEstimatesValue.toLocaleString()}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  {estimates.filter(est => {
                    const estimateDate = new Date(est.savedAt);
                    const now = new Date();
                    return estimateDate.getMonth() === now.getMonth() &&
                           estimateDate.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/estimate/new"
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>New Estimate</span>
            </Link>

            <Link
              href="/templates"
              className="inline-flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <FileText className="h-4 w-4" />
              <span>Use Template</span>
            </Link>

            <Link
              href="/client-portal"
              className="inline-flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Building2 className="h-4 w-4" />
              <span>Client Portal</span>
            </Link>

            {user.role === 'admin' && (
              <Link
                href="/admin"
                className="inline-flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Settings className="h-4 w-4" />
                <span>Admin Panel</span>
              </Link>
            )}
          </div>
        </div>

        {/* Estimates Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <h2 className="text-lg font-semibold text-gray-900">My Estimates</h2>

              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search estimates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>

                {/* Filter */}
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none"
                  >
                    <option value="all">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="final">Final</option>
                    <option value="sent">Sent</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Estimates List */}
          <div className="divide-y divide-gray-200">
            {filteredEstimates.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No estimates found</h3>
                <p className="text-gray-600 mb-6">
                  {estimates.length === 0
                    ? "You haven't created any estimates yet."
                    : "No estimates match your search criteria."
                  }
                </p>
                <Link
                  href="/estimate/new"
                  className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Your First Estimate</span>
                </Link>
              </div>
            ) : (
              filteredEstimates.map((estimate) => (
                <div key={estimate.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{estimate.projectName}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          estimate.status === 'final' ? 'bg-green-100 text-green-800' :
                          estimate.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {estimate.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center space-x-6 text-sm text-gray-600">
                        <span>{estimate.facilityType}</span>
                        <span>${estimate.totalCost.toLocaleString()}</span>
                        <span>Saved {new Date(estimate.savedAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/estimate/edit/${estimate.id}`}
                        className="p-2 text-gray-500 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                        title="Edit Estimate"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Link>
                      <button
                        className="p-2 text-gray-500 hover:text-green-600 rounded-lg hover:bg-green-50"
                        title="Download PDF"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEstimate(estimate.id)}
                        className="p-2 text-gray-500 hover:text-red-600 rounded-lg hover:bg-red-50"
                        title="Delete Estimate"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

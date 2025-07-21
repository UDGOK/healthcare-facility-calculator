'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Users,
  FileText,
  DollarSign,
  Calendar,
  TrendingUp,
  Activity,
  BarChart3,
  Settings,
  Shield,
  AlertCircle,
  User as UserIcon,
  LogOut,
  ArrowLeft,
  Download,
  Search
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  createdAt: string;
  estimates: string[];
}

interface Estimate {
  id: string;
  projectName: string;
  facilityType: string;
  totalCost: number;
  userId: string;
  createdAt: string;
  status: string;
}

interface Analytics {
  totalUsers: number;
  totalEstimates: number;
  totalValue: number;
  monthlyGrowth: number;
  recentActivity: Array<{
    type: 'user_signup' | 'estimate_created';
    user: string;
    timestamp: string;
    details: string;
  }>;
  estimatesByMonth: Array<{
    month: string;
    count: number;
    value: number;
  }>;
  facilityTypes: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    loadData();
  }, [user, router]);

  const loadData = () => {
    // Load users
    const usersData = JSON.parse(localStorage.getItem('ds-arch-users') || '[]');
    setUsers(usersData);

    // Load estimates
    const estimatesData = JSON.parse(localStorage.getItem('ds-arch-estimates') || '{}');
    const estimatesArray = Object.values(estimatesData) as Estimate[];
    setEstimates(estimatesArray);

    // Calculate analytics
    calculateAnalytics(usersData, estimatesArray);
  };

  const calculateAnalytics = (usersData: User[], estimatesArray: Estimate[]) => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Recent estimates count
    const recentEstimates = estimatesArray.filter(est => new Date(est.createdAt) >= lastMonth);
    const totalValue = estimatesArray.reduce((sum, est) => sum + (est.totalCost || 0), 0);

    // Monthly growth calculation
    const monthlyGrowth = recentEstimates.length > 0 ?
      ((recentEstimates.length / estimatesArray.length) * 100) : 0;

    // Recent activity
    const recentActivity: Array<{
      type: 'user_signup' | 'estimate_created';
      user: string;
      timestamp: string;
      details: string;
    }> = [];

    // Add recent user signups
    usersData.forEach(user => {
      if (new Date(user.createdAt) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
        recentActivity.push({
          type: 'user_signup' as const,
          user: user.name,
          timestamp: user.createdAt,
          details: `New ${user.role} account created`
        });
      }
    });

    // Add recent estimates
    estimatesArray.forEach(estimate => {
      if (new Date(estimate.createdAt) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
        const estimateUser = usersData.find(u => u.id === estimate.userId);
        recentActivity.push({
          type: 'estimate_created' as const,
          user: estimateUser?.name || 'Unknown User',
          timestamp: estimate.createdAt,
          details: `Created estimate: ${estimate.projectName}`
        });
      }
    });

    // Sort by timestamp
    recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Estimates by month (last 6 months)
    const estimatesByMonth = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEstimates = estimatesArray.filter(est => {
        const estDate = new Date(est.createdAt);
        return estDate.getMonth() === monthDate.getMonth() &&
               estDate.getFullYear() === monthDate.getFullYear();
      });

      estimatesByMonth.push({
        month: monthDate.toLocaleDateString('en-US', { month: 'short' }),
        count: monthEstimates.length,
        value: monthEstimates.reduce((sum, est) => sum + (est.totalCost || 0), 0)
      });
    }

    // Facility types breakdown
    const facilityTypeCounts = estimatesArray.reduce((acc, est) => {
      acc[est.facilityType] = (acc[est.facilityType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const facilityTypes = Object.entries(facilityTypeCounts).map(([type, count]) => ({
      type,
      count,
      percentage: (count / estimatesArray.length) * 100
    }));

    setAnalytics({
      totalUsers: usersData.length,
      totalEstimates: estimatesArray.length,
      totalValue,
      monthlyGrowth,
      recentActivity: recentActivity.slice(0, 10),
      estimatesByMonth,
      facilityTypes
    });
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const deleteUser = (userId: string) => {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      const updatedUsers = users.filter(u => u.id !== userId);
      setUsers(updatedUsers);
      localStorage.setItem('ds-arch-users', JSON.stringify(updatedUsers));
      loadData(); // Refresh analytics
    }
  };

  const exportData = () => {
    const data = {
      users: users.map(u => ({ ...u, password: undefined })), // Remove passwords
      estimates,
      analytics,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ds-arch-admin-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user || user.role !== 'admin') {
    return <div>Loading...</div>;
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Dashboard</span>
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <div className="bg-blue-600 text-white p-2 rounded-lg">
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                  <p className="text-sm text-gray-600">System administration and analytics</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <UserIcon className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">{user.name}</span>
                <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">Admin</span>
              </div>
              <button
                onClick={exportData}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Export Data</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: BarChart3 },
              { id: 'users', name: 'Users', icon: Users },
              { id: 'estimates', name: 'Estimates', icon: FileText },
              { id: 'analytics', name: 'Analytics', icon: TrendingUp }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-4 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.totalUsers}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Estimates</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.totalEstimates}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-lg">
                    <FileText className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Value</p>
                    <p className="text-2xl font-bold text-gray-900">${analytics.totalValue.toLocaleString()}</p>
                  </div>
                  <div className="bg-orange-100 p-3 rounded-lg">
                    <DollarSign className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Monthly Growth</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.monthlyGrowth.toFixed(1)}%</p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h3>
              <div className="space-y-4">
                {analytics.recentActivity.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No recent activity</p>
                ) : (
                  analytics.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${
                        activity.type === 'user_signup' ? 'bg-blue-100' : 'bg-green-100'
                      }`}>
                        {activity.type === 'user_signup' ? (
                          <Users className={`h-4 w-4 ${activity.type === 'user_signup' ? 'text-blue-600' : 'text-green-600'}`} />
                        ) : (
                          <FileText className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{activity.user}</p>
                        <p className="text-sm text-gray-600">{activity.details}</p>
                        <p className="text-xs text-gray-500">{new Date(activity.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estimates</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((userData) => (
                      <tr key={userData.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{userData.name}</div>
                            <div className="text-sm text-gray-500">{userData.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            userData.role === 'admin'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {userData.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {userData.estimates?.length || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(userData.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {userData.id !== user.id && (
                            <button
                              onClick={() => deleteUser(userData.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Estimates Tab */}
        {activeTab === 'estimates' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">All Estimates</h2>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {estimates.map((estimate) => {
                      const estimateUser = users.find(u => u.id === estimate.userId);
                      return (
                        <tr key={estimate.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{estimate.projectName}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {estimate.facilityType}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {estimateUser?.name || 'Unknown User'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            ${estimate.totalCost?.toLocaleString() || '0'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(estimate.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-gray-900">Advanced Analytics</h2>

            {/* Monthly Estimates Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Estimates by Month</h3>
              <div className="space-y-4">
                {analytics.estimatesByMonth.map((month, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="w-16 text-sm text-gray-600">{month.month}</div>
                    <div className="flex-1 mx-4">
                      <div className="bg-gray-200 rounded-full h-4">
                        <div
                          className="bg-blue-600 h-4 rounded-full"
                          style={{ width: `${(month.count / Math.max(...analytics.estimatesByMonth.map(m => m.count))) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="w-24 text-right">
                      <div className="text-sm font-medium text-gray-900">{month.count} estimates</div>
                      <div className="text-xs text-gray-500">${month.value.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Facility Types */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Facility Types</h3>
              <div className="space-y-4">
                {analytics.facilityTypes.map((type, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{type.type}</div>
                      <div className="bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${type.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <div className="text-sm font-medium text-gray-900">{type.count}</div>
                      <div className="text-xs text-gray-500">{type.percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

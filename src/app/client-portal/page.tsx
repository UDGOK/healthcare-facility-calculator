'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { clientPortalService, ClientUser, ClientDashboardData } from '@/services/clientPortalService';
import {
  Building2,
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  TrendingUp,
  Bell,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
  MessageCircle,
  Settings,
  LogOut,
  Eye,
  Search,
  Filter
} from 'lucide-react';

type ViewMode = 'login' | 'register' | 'dashboard' | 'project_request' | 'project_detail';

export default function ClientPortalPage() {
  const router = useRouter();
  const [currentView, setCurrentView] = useState<ViewMode>('login');
  const [currentClient, setCurrentClient] = useState<ClientUser | null>(null);
  const [dashboardData, setDashboardData] = useState<ClientDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Login form
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  // Registration form
  const [registerData, setRegisterData] = useState({
    email: '',
    companyName: '',
    contactName: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA'
    },
    accountType: 'healthcare_provider' as const,
    preferences: {
      communicationMethod: 'email' as const,
      timezone: 'America/New_York',
      language: 'en'
    }
  });

  // Project request form
  const [projectRequest, setProjectRequest] = useState({
    title: '',
    description: '',
    facilityType: 'hospital' as const,
    projectType: 'new_construction' as const,
    timeline: {
      requestedStartDate: '',
      estimatedDuration: 12,
      criticalMilestones: ['']
    },
    budget: {
      estimatedRange: '$1M - $5M',
      fundingSource: 'internal' as const,
      approvalRequired: false
    },
    scope: {
      squareFootage: 0,
      numberOfRooms: 0,
      specialtyAreas: [''],
      medicalGasRequired: false,
      hvacUpgrade: false,
      electricalUpgrade: false,
      structuralWork: false
    },
    compliance: {
      regulatoryRequirements: [''],
      certificationNeeded: [''],
      inspectionRequired: false
    },
    attachments: [],
    priority: 'medium' as const,
    dueDate: ''
  });

  useEffect(() => {
    if (currentClient) {
      loadDashboardData();
    }
  }, [currentClient]);

  const loadDashboardData = async () => {
    if (!currentClient) return;

    const data = await clientPortalService.getClientDashboard(currentClient.id);
    setDashboardData(data);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const result = await clientPortalService.authenticateClient(loginData.email, loginData.password);

    if (result.success && result.client) {
      setCurrentClient(result.client);
      setCurrentView('dashboard');
    } else {
      setError(result.error || 'Login failed');
    }

    setIsLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const result = await clientPortalService.registerClient(registerData);

    if (result.success) {
      alert('Registration successful! Please check your email for verification instructions.');
      setCurrentView('login');
    } else {
      setError(result.error || 'Registration failed');
    }

    setIsLoading(false);
  };

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentClient) return;

    setIsLoading(true);
    setError('');

    const result = await clientPortalService.submitProjectRequest(currentClient.id, projectRequest);

    if (result.success) {
      alert('Project request submitted successfully!');
      setCurrentView('dashboard');
      loadDashboardData();
    } else {
      setError(result.error || 'Failed to submit project request');
    }

    setIsLoading(false);
  };

  const handleLogout = () => {
    setCurrentClient(null);
    setDashboardData(null);
    setCurrentView('login');
  };

  const renderLogin = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-600 text-white p-3 rounded-xl">
              <Building2 className="h-8 w-8" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">DS Arch Client Portal</h1>
          <p className="text-gray-600">Access your healthcare facility projects</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-medium transition-colors"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <UserIcon className="h-5 w-5" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              New to DS Arch?{' '}
              <button
                onClick={() => setCurrentView('register')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Create an account
              </button>
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">Demo Account:</p>
              <div className="text-xs text-gray-600">
                <p><strong>Client Portal:</strong> client@healthcare.com / client123</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRegister = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center px-4 py-8">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-600 text-white p-3 rounded-xl">
              <Building2 className="h-8 w-8" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Client Account</h1>
          <p className="text-gray-600">Join DS Arch for professional healthcare facility services</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <form onSubmit={handleRegister} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                <input
                  type="text"
                  value={registerData.companyName}
                  onChange={(e) => setRegisterData({...registerData, companyName: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Your healthcare organization"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Name</label>
                <input
                  type="text"
                  value={registerData.contactName}
                  onChange={(e) => setRegisterData({...registerData, contactName: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Primary contact person"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="contact@organization.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={registerData.phone}
                  onChange={(e) => setRegisterData({...registerData, phone: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="(555) 123-4567"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
              <select
                value={registerData.accountType}
                onChange={(e) => setRegisterData({...registerData, accountType: e.target.value as any})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              >
                <option value="healthcare_provider">Healthcare Provider</option>
                <option value="contractor">General Contractor</option>
                <option value="architect">Architect/Designer</option>
                <option value="consultant">Healthcare Consultant</option>
              </select>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Address Information</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                  <input
                    type="text"
                    value={registerData.address.street}
                    onChange={(e) => setRegisterData({
                      ...registerData,
                      address: {...registerData.address, street: e.target.value}
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="123 Main Street"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    value={registerData.address.city}
                    onChange={(e) => setRegisterData({
                      ...registerData,
                      address: {...registerData.address, city: e.target.value}
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="City"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                  <input
                    type="text"
                    value={registerData.address.state}
                    onChange={(e) => setRegisterData({
                      ...registerData,
                      address: {...registerData.address, state: e.target.value}
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="State"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setCurrentView('login')}
                className="text-gray-600 hover:text-gray-800 text-sm font-medium"
              >
                ← Back to Login
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-medium"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <UserIcon className="h-5 w-5" />
                    <span>Create Account</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  const renderDashboard = () => {
    if (!dashboardData) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
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
                <div className="bg-blue-600 text-white p-2 rounded-lg">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">DS Arch Client Portal</h1>
                  <p className="text-sm text-gray-600">{dashboardData.client.companyName}</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Bell className="h-6 w-6 text-gray-500" />
                  {dashboardData.recentNotifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {dashboardData.recentNotifications.filter(n => !n.read).length}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <UserIcon className="h-5 w-5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">{dashboardData.client.contactName}</span>
                </div>
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
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome back, {dashboardData.client.contactName}
            </h2>
            <p className="text-gray-600">Manage your healthcare facility projects and stay updated on progress.</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Projects</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.quickStats.totalProjects}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Projects</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.quickStats.activeProjects}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.quickStats.completedProjects}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Unread Notifications</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboardData.recentNotifications.filter(n => !n.read).length}
                  </p>
                </div>
                <div className="bg-orange-100 p-3 rounded-lg">
                  <Bell className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setCurrentView('project_request')}
                className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>New Project Request</span>
              </button>

              <button className="inline-flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
                <MessageCircle className="h-4 w-4" />
                <span>Contact Team</span>
              </button>

              <button className="inline-flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                <Download className="h-4 w-4" />
                <span>Download Reports</span>
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Active Projects */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Active Projects</h3>
              </div>

              <div className="divide-y divide-gray-200">
                {dashboardData.activeProjects.length === 0 ? (
                  <div className="p-6 text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No active projects</h4>
                    <p className="text-gray-600 mb-4">Start by submitting a new project request</p>
                    <button
                      onClick={() => setCurrentView('project_request')}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Create Project Request
                    </button>
                  </div>
                ) : (
                  dashboardData.activeProjects.map((project) => {
                    const projectDetails = clientPortalService.getProject(project.projectId);
                    return (
                      <div key={project.projectId} className="p-6 hover:bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-lg font-medium text-gray-900">
                            {projectDetails?.title || 'Project'}
                          </h4>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            project.currentPhase === 'planning' ? 'bg-blue-100 text-blue-800' :
                            project.currentPhase === 'design' ? 'bg-purple-100 text-purple-800' :
                            project.currentPhase === 'estimation' ? 'bg-orange-100 text-orange-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {project.currentPhase.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="mb-3">
                          <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Progress</span>
                            <span>{project.overallProgress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${project.overallProgress}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>Next: {project.nextMilestone.name}</span>
                          <button
                            onClick={() => {
                              setSelectedProjectId(project.projectId);
                              setCurrentView('project_detail');
                            }}
                            className="text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                          >
                            <Eye className="h-4 w-4" />
                            <span>View Details</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Recent Notifications */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Recent Notifications</h3>
              </div>

              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {dashboardData.recentNotifications.length === 0 ? (
                  <div className="p-6 text-center">
                    <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No notifications yet</p>
                  </div>
                ) : (
                  dashboardData.recentNotifications.map((notification) => (
                    <div key={notification.id} className={`p-4 ${!notification.read ? 'bg-blue-50' : ''}`}>
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${
                          notification.type === 'project_update' ? 'bg-blue-100' :
                          notification.type === 'document_shared' ? 'bg-green-100' :
                          notification.type === 'message_received' ? 'bg-purple-100' :
                          'bg-gray-100'
                        }`}>
                          {notification.type === 'project_update' && <TrendingUp className="h-4 w-4 text-blue-600" />}
                          {notification.type === 'document_shared' && <FileText className="h-4 w-4 text-green-600" />}
                          {notification.type === 'message_received' && <MessageCircle className="h-4 w-4 text-purple-600" />}
                          {notification.type === 'system_alert' && <Bell className="h-4 w-4 text-gray-600" />}
                        </div>

                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">{notification.title}</h4>
                          <p className="text-sm text-gray-600">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(notification.timestamp).toLocaleDateString()}
                          </p>
                        </div>

                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Upcoming Milestones */}
          {dashboardData.upcomingMilestones.length > 0 && (
            <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Milestones</h3>
              <div className="space-y-3">
                {dashboardData.upcomingMilestones.map((milestone, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{milestone.milestone}</h4>
                      <p className="text-sm text-gray-600">{milestone.projectName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(milestone.date).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {Math.ceil((new Date(milestone.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderProjectRequest = () => (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentView('dashboard')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowRight className="h-5 w-5 rotate-180" />
                <span>Back to Dashboard</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-xl font-bold text-gray-900">New Project Request</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleProjectSubmit} className="space-y-8">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            )}

            {/* Basic Information */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Project Information</h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project Title</label>
                  <input
                    type="text"
                    value={projectRequest.title}
                    onChange={(e) => setProjectRequest({...projectRequest, title: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="Enter project title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Facility Type</label>
                  <select
                    value={projectRequest.facilityType}
                    onChange={(e) => setProjectRequest({...projectRequest, facilityType: e.target.value as any})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  >
                    <option value="hospital">Hospital</option>
                    <option value="surgery_center">Surgery Center</option>
                    <option value="clinic">Clinic</option>
                    <option value="emergency">Emergency Department</option>
                    <option value="specialty">Specialty Care</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project Type</label>
                  <select
                    value={projectRequest.projectType}
                    onChange={(e) => setProjectRequest({...projectRequest, projectType: e.target.value as any})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  >
                    <option value="new_construction">New Construction</option>
                    <option value="renovation">Renovation</option>
                    <option value="expansion">Expansion</option>
                    <option value="upgrade">System Upgrade</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={projectRequest.priority}
                    onChange={(e) => setProjectRequest({...projectRequest, priority: e.target.value as any})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Project Description</label>
                <textarea
                  value={projectRequest.description}
                  onChange={(e) => setProjectRequest({...projectRequest, description: e.target.value})}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Describe your project requirements, goals, and any specific needs..."
                  required
                />
              </div>
            </div>

            {/* Project Scope */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900">Project Scope</h3>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Square Footage</label>
                  <input
                    type="number"
                    value={projectRequest.scope.squareFootage}
                    onChange={(e) => setProjectRequest({
                      ...projectRequest,
                      scope: {...projectRequest.scope, squareFootage: parseInt(e.target.value) || 0}
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="Total square footage"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Number of Rooms</label>
                  <input
                    type="number"
                    value={projectRequest.scope.numberOfRooms}
                    onChange={(e) => setProjectRequest({
                      ...projectRequest,
                      scope: {...projectRequest.scope, numberOfRooms: parseInt(e.target.value) || 0}
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="Number of rooms"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">System Requirements</label>
                <div className="grid md:grid-cols-2 gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={projectRequest.scope.medicalGasRequired}
                      onChange={(e) => setProjectRequest({
                        ...projectRequest,
                        scope: {...projectRequest.scope, medicalGasRequired: e.target.checked}
                      })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Medical Gas Systems</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={projectRequest.scope.hvacUpgrade}
                      onChange={(e) => setProjectRequest({
                        ...projectRequest,
                        scope: {...projectRequest.scope, hvacUpgrade: e.target.checked}
                      })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">HVAC Upgrade</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={projectRequest.scope.electricalUpgrade}
                      onChange={(e) => setProjectRequest({
                        ...projectRequest,
                        scope: {...projectRequest.scope, electricalUpgrade: e.target.checked}
                      })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Electrical Systems</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={projectRequest.scope.structuralWork}
                      onChange={(e) => setProjectRequest({
                        ...projectRequest,
                        scope: {...projectRequest.scope, structuralWork: e.target.checked}
                      })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Structural Work</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Timeline & Budget */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900">Timeline & Budget</h3>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Requested Start Date</label>
                  <input
                    type="date"
                    value={projectRequest.timeline.requestedStartDate}
                    onChange={(e) => setProjectRequest({
                      ...projectRequest,
                      timeline: {...projectRequest.timeline, requestedStartDate: e.target.value}
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Duration (months)</label>
                  <input
                    type="number"
                    value={projectRequest.timeline.estimatedDuration}
                    onChange={(e) => setProjectRequest({
                      ...projectRequest,
                      timeline: {...projectRequest.timeline, estimatedDuration: parseInt(e.target.value) || 0}
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Budget Range</label>
                  <select
                    value={projectRequest.budget.estimatedRange}
                    onChange={(e) => setProjectRequest({
                      ...projectRequest,
                      budget: {...projectRequest.budget, estimatedRange: e.target.value}
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  >
                    <option value="$100K - $500K">$100K - $500K</option>
                    <option value="$500K - $1M">$500K - $1M</option>
                    <option value="$1M - $5M">$1M - $5M</option>
                    <option value="$5M - $10M">$5M - $10M</option>
                    <option value="$10M+">$10M+</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Funding Source</label>
                  <select
                    value={projectRequest.budget.fundingSource}
                    onChange={(e) => setProjectRequest({
                      ...projectRequest,
                      budget: {...projectRequest.budget, fundingSource: e.target.value as any}
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  >
                    <option value="internal">Internal Funding</option>
                    <option value="loan">Bank Loan</option>
                    <option value="grant">Grant Funding</option>
                    <option value="insurance">Insurance</option>
                    <option value="mixed">Mixed Sources</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setCurrentView('dashboard')}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-medium"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Plus className="h-5 w-5" />
                    <span>Submit Project Request</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  // Render appropriate view
  switch (currentView) {
    case 'login':
      return renderLogin();
    case 'register':
      return renderRegister();
    case 'dashboard':
      return renderDashboard();
    case 'project_request':
      return renderProjectRequest();
    default:
      return renderDashboard();
  }
}

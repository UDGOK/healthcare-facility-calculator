'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { emailService, EstimateEmailData } from '@/services/emailService';
import { Mail, Send, X, CheckCircle, AlertCircle, User as UserIcon, Building } from 'lucide-react';

interface EmailEstimateProps {
  estimate: {
    id: string;
    projectName: string;
    facilityType: string;
    clientName?: string;
    totalCost: number;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function EmailEstimate({ estimate, isOpen, onClose, onSuccess }: EmailEstimateProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    clientEmail: '',
    clientName: estimate.clientName || '',
    customMessage: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setStatus({ type: 'error', message: 'You must be logged in to send emails' });
      return;
    }

    if (!formData.clientEmail || !formData.clientName) {
      setStatus({ type: 'error', message: 'Please fill in all required fields' });
      return;
    }

    setIsLoading(true);
    setStatus({ type: null, message: '' });

    try {
      const estimateUrl = `${window.location.origin}/estimate/view?id=${estimate.id}`;

      const emailData: EstimateEmailData = {
        clientEmail: formData.clientEmail,
        clientName: formData.clientName,
        projectName: estimate.projectName,
        facilityType: estimate.facilityType,
        totalCost: estimate.totalCost,
        estimateUrl,
        senderName: user.name,
        senderEmail: user.email
      };

      const result = await emailService.sendEstimateEmail(emailData);

      if (result.success) {
        setStatus({ type: 'success', message: result.message });

        // Save email activity to estimate
        const estimates = JSON.parse(localStorage.getItem('ds-arch-estimates') || '{}');
        if (estimates[estimate.id]) {
          estimates[estimate.id].emailHistory = estimates[estimate.id].emailHistory || [];
          estimates[estimate.id].emailHistory.push({
            sentTo: formData.clientEmail,
            sentAt: new Date().toISOString(),
            sentBy: user.name
          });
          estimates[estimate.id].status = 'sent';
          localStorage.setItem('ds-arch-estimates', JSON.stringify(estimates));
        }

        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 2000);
        }
      } else {
        setStatus({ type: 'error', message: result.message });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Failed to send email. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      clientEmail: '',
      clientName: estimate.clientName || '',
      customMessage: ''
    });
    setStatus({ type: null, message: '' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Send Estimate via Email</h2>
              <p className="text-sm text-gray-600">Share your estimate with the client</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Estimate Summary */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Estimate Summary</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <Building className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-sm font-medium text-gray-900">{estimate.projectName}</div>
                <div className="text-xs text-gray-600">{estimate.facilityType}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">${estimate.totalCost.toLocaleString()}</div>
              <div className="text-xs text-gray-600">Total Project Cost</div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Status Messages */}
          {status.type && (
            <div className={`p-4 rounded-lg flex items-center space-x-3 ${
              status.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              {status.type === 'success' ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              <span className={`text-sm font-medium ${
                status.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {status.message}
              </span>
            </div>
          )}

          {/* Client Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">Client Information</h4>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-2">
                  Client Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="clientName"
                    type="text"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="Enter client name"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="clientEmail" className="block text-sm font-medium text-gray-700 mb-2">
                  Client Email *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="clientEmail"
                    type="email"
                    value={formData.clientEmail}
                    onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="client@example.com"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Custom Message */}
          <div>
            <label htmlFor="customMessage" className="block text-sm font-medium text-gray-700 mb-2">
              Custom Message (Optional)
            </label>
            <textarea
              id="customMessage"
              value={formData.customMessage}
              onChange={(e) => setFormData({ ...formData, customMessage: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder="Add a personal message to include with the estimate..."
            />
          </div>

          {/* Email Preview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h5 className="text-sm font-semibold text-gray-900 mb-3">Email Preview</h5>
            <div className="text-sm text-gray-600 space-y-2">
              <div><strong>To:</strong> {formData.clientEmail || 'client@example.com'}</div>
              <div><strong>Subject:</strong> Medical Facility Cost Estimate - {estimate.projectName}</div>
              <div className="bg-white rounded p-3 border border-gray-200">
                <p>Dear {formData.clientName || '[Client Name]'},</p>
                <p className="mt-2">Thank you for your interest in our medical facility cost estimation services. We've prepared a comprehensive estimate for your {estimate.facilityType.toLowerCase()} project.</p>
                {formData.customMessage && (
                  <div className="mt-3 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                    <p className="italic">{formData.customMessage}</p>
                  </div>
                )}
                <p className="mt-2">The email will include a link to view the detailed estimate online.</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleReset}
              className="text-gray-600 hover:text-gray-800 text-sm font-medium"
            >
              Reset Form
            </button>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isLoading || !formData.clientEmail || !formData.clientName}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-medium"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <Send className="h-5 w-5" />
                )}
                <span>{isLoading ? 'Sending...' : 'Send Estimate'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

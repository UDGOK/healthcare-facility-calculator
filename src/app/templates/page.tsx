'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { templateService, FacilityTemplate } from '@/services/templateService';
import {
  Building2,
  Search,
  Filter,
  Clock,
  DollarSign,
  Users,
  CheckCircle,
  Info,
  ArrowRight,
  ArrowLeft,
  Heart,
  Star,
  Download,
  Eye,
  Edit3,
  Copy,
  Bookmark,
  Settings,
  Zap,
  Shield,
  Award,
  Wrench,
  FileText
} from 'lucide-react';

interface TemplateCardProps {
  template: FacilityTemplate;
  onUseTemplate: (templateId: string) => void;
  onViewDetails: (templateId: string) => void;
}

export default function TemplatesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [templates, setTemplates] = useState<FacilityTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<FacilityTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<FacilityTemplate | null>(null);
  const [showTemplateDetails, setShowTemplateDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [templates, searchTerm, selectedCategory]);

  const loadTemplates = () => {
    // Load custom templates if any
    templateService.loadCustomTemplates();
    const allTemplates = templateService.getAllTemplates();
    setTemplates(allTemplates);
  };

  const filterTemplates = () => {
    let filtered = templates;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template =>
        template.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    setFilteredTemplates(filtered);
  };

  const handleUseTemplate = async (templateId: string) => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    setIsLoading(true);

    try {
      const estimateData = templateService.createEstimateFromTemplate(templateId);

      // Save the estimate
      const estimates = JSON.parse(localStorage.getItem('ds-arch-estimates') || '{}');
      estimates[estimateData.id] = estimateData;
      localStorage.setItem('ds-arch-estimates', JSON.stringify(estimates));

      // Add to user's estimates
      const users = JSON.parse(localStorage.getItem('ds-arch-users') || '[]');
      const userIndex = users.findIndex((u: any) => u.id === user.id);
      if (userIndex !== -1) {
        if (!users[userIndex].estimates.includes(estimateData.id)) {
          users[userIndex].estimates.push(estimateData.id);
          localStorage.setItem('ds-arch-users', JSON.stringify(users));
        }
      }

      // Redirect to edit the new estimate
      router.push(`/estimate/edit/${estimateData.id}`);
    } catch (error) {
      console.error('Error creating estimate from template:', error);
      alert('Failed to create estimate from template. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (templateId: string) => {
    const template = templateService.getTemplate(templateId);
    if (template) {
      setSelectedTemplate(template);
      setShowTemplateDetails(true);
    }
  };

  const TemplateCard: React.FC<TemplateCardProps> = ({ template, onUseTemplate, onViewDetails }) => {
    const [isFavorited, setIsFavorited] = useState(false);

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className={`p-3 rounded-lg ${
                template.category === 'Hospital' ? 'bg-blue-100' :
                template.category === 'Surgery Center' ? 'bg-green-100' :
                template.category === 'Emergency' ? 'bg-red-100' :
                template.category === 'Clinic' ? 'bg-purple-100' :
                'bg-gray-100'
              }`}>
                <Building2 className={`h-6 w-6 ${
                  template.category === 'Hospital' ? 'text-blue-600' :
                  template.category === 'Surgery Center' ? 'text-green-600' :
                  template.category === 'Emergency' ? 'text-red-600' :
                  template.category === 'Clinic' ? 'text-purple-600' :
                  'text-gray-600'
                }`} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                <p className="text-sm text-gray-600">{template.type}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsFavorited(!isFavorited)}
                className={`p-2 rounded-lg transition-colors ${
                  isFavorited ? 'text-red-500 hover:bg-red-50' : 'text-gray-400 hover:bg-gray-100'
                }`}
              >
                <Heart className={`h-4 w-4 ${isFavorited ? 'fill-current' : ''}`} />
              </button>

              <span className={`px-2 py-1 text-xs rounded-full ${
                template.category === 'Hospital' ? 'bg-blue-100 text-blue-800' :
                template.category === 'Surgery Center' ? 'bg-green-100 text-green-800' :
                template.category === 'Emergency' ? 'bg-red-100 text-red-800' :
                template.category === 'Clinic' ? 'bg-purple-100 text-purple-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {template.category}
              </span>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-4">{template.description}</p>

          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-gray-900">{template.squareFootage.toLocaleString()}</div>
              <div className="text-xs text-gray-500">Sq Ft</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">{template.rooms.length}</div>
              <div className="text-xs text-gray-500">Rooms</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">{template.constructionTime}</div>
              <div className="text-xs text-gray-500">Months</div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="p-6 border-b border-gray-100">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Key Features</h4>
          <div className="space-y-2">
            {template.specialRequirements.slice(0, 3).map((requirement, index) => (
              <div key={index} className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-sm text-gray-600">{requirement}</span>
              </div>
            ))}
            {template.specialRequirements.length > 3 && (
              <div className="text-sm text-blue-600">
                +{template.specialRequirements.length - 3} more features
              </div>
            )}
          </div>
        </div>

        {/* Compliance Standards */}
        <div className="p-6 border-b border-gray-100">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Compliance Standards</h4>
          <div className="flex flex-wrap gap-2">
            {template.complianceStandards.slice(0, 3).map((standard, index) => (
              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                {standard.split(' ')[0]} {/* Show abbreviated version */}
              </span>
            ))}
            {template.complianceStandards.length > 3 && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                +{template.complianceStandards.length - 3}
              </span>
            )}
          </div>
        </div>

        {/* Cost & Actions */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                ${template.estimatedCost.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">Estimated Cost</div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                <span className="text-sm text-gray-600">4.8</span>
              </div>
              <div className="text-sm text-gray-500">•</div>
              <div className="text-sm text-gray-500">12 used</div>
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => onViewDetails(template.id)}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Eye className="h-4 w-4" />
              <span>View Details</span>
            </button>

            <button
              onClick={() => onUseTemplate(template.id)}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Copy className="h-4 w-4" />
              <span>Use Template</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const TemplateDetailsModal = () => {
    if (!selectedTemplate) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{selectedTemplate.name}</h2>
              <p className="text-gray-600">{selectedTemplate.description}</p>
            </div>
            <button
              onClick={() => setShowTemplateDetails(false)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              ×
            </button>
          </div>

          <div className="p-6">
            {/* Overview */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <Building2 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-lg font-bold text-gray-900">{selectedTemplate.squareFootage.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Square Feet</div>
              </div>

              <div className="bg-green-50 rounded-lg p-4 text-center">
                <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-lg font-bold text-gray-900">{selectedTemplate.rooms.length}</div>
                <div className="text-sm text-gray-600">Rooms</div>
              </div>

              <div className="bg-orange-50 rounded-lg p-4 text-center">
                <Clock className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <div className="text-lg font-bold text-gray-900">{selectedTemplate.constructionTime}</div>
                <div className="text-sm text-gray-600">Timeline</div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <DollarSign className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-lg font-bold text-gray-900">${selectedTemplate.estimatedCost.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Est. Cost</div>
              </div>
            </div>

            {/* Room Configuration */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Room Configuration</h3>
              <div className="grid gap-4">
                {selectedTemplate.rooms.map((room, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{room.name}</h4>
                        <p className="text-sm text-gray-600">{room.type} • {room.area} sq ft</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">Total Outlets: {
                          room.oxygenOutlets + room.airOutlets + room.vacuumOutlets + room.co2Outlets + room.n2oOutlets
                        }</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-5 gap-4 text-center text-sm">
                      <div>
                        <div className="font-medium text-gray-900">{room.oxygenOutlets}</div>
                        <div className="text-gray-600">Oxygen</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{room.airOutlets}</div>
                        <div className="text-gray-600">Air</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{room.vacuumOutlets}</div>
                        <div className="text-gray-600">Vacuum</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{room.co2Outlets}</div>
                        <div className="text-gray-600">CO2</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{room.n2oOutlets}</div>
                        <div className="text-gray-600">N2O</div>
                      </div>
                    </div>

                    {room.specialRequirements && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-700">
                          <strong>Special Requirements:</strong> {room.specialRequirements}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Equipment List */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Major Equipment</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 text-sm font-medium text-gray-700">Equipment</th>
                      <th className="text-left py-3 text-sm font-medium text-gray-700">Manufacturer</th>
                      <th className="text-center py-3 text-sm font-medium text-gray-700">Qty</th>
                      <th className="text-right py-3 text-sm font-medium text-gray-700">Unit Cost</th>
                      <th className="text-right py-3 text-sm font-medium text-gray-700">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTemplate.equipment.map((item, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-3">
                          <div>
                            <div className="font-medium text-gray-900">{item.name}</div>
                            <div className="text-sm text-gray-600">{item.category}</div>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="text-sm text-gray-900">{item.manufacturer}</div>
                          <div className="text-xs text-gray-600">{item.model}</div>
                        </td>
                        <td className="py-3 text-center text-gray-900">{item.quantity}</td>
                        <td className="py-3 text-right text-gray-900">${item.unitCost.toLocaleString()}</td>
                        <td className="py-3 text-right font-medium text-gray-900">
                          ${(item.quantity * item.unitCost).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* System Requirements */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Zap className="h-5 w-5 text-blue-600 mr-2" />
                  Medical Gas Systems
                </h4>
                <div className="space-y-2 text-sm">
                  <div>Pressure: {selectedTemplate.medicalGasRequirements.totalPressure} PSI</div>
                  <div>Redundancy: {selectedTemplate.medicalGasRequirements.redundancyLevel}</div>
                  <div>Central Supply: {selectedTemplate.medicalGasRequirements.centralSupplyRequired ? 'Yes' : 'No'}</div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Settings className="h-5 w-5 text-green-600 mr-2" />
                  HVAC Requirements
                </h4>
                <div className="space-y-2 text-sm">
                  <div>Air Changes: {selectedTemplate.hvacRequirements.airChangesPerHour}/hr</div>
                  <div>Filtration: {selectedTemplate.hvacRequirements.filtrationLevel}</div>
                  <div>Pressure: {selectedTemplate.hvacRequirements.pressurization}</div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Wrench className="h-5 w-5 text-orange-600 mr-2" />
                  Electrical Systems
                </h4>
                <div className="space-y-2 text-sm">
                  <div>Normal: {selectedTemplate.electricalRequirements.normalPower}</div>
                  <div>Emergency: {selectedTemplate.electricalRequirements.emergencyPower}</div>
                  <div>Isolated: {selectedTemplate.electricalRequirements.isolatedPower ? 'Yes' : 'No'}</div>
                </div>
              </div>
            </div>

            {/* Compliance Standards */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Shield className="h-5 w-5 text-green-600 mr-2" />
                Compliance Standards
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {selectedTemplate.complianceStandards.map((standard, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-gray-700">{standard}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowTemplateDetails(false)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Close
              </button>

              <button
                onClick={() => {
                  setShowTemplateDetails(false);
                  handleUseTemplate(selectedTemplate.id);
                }}
                disabled={isLoading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-medium"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Copy className="h-5 w-5" />
                    <span>Use This Template</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <div className="bg-blue-600 text-white p-2 rounded-lg">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Professional Templates</h1>
                  <p className="text-sm text-gray-600">Enterprise healthcare facility templates</p>
                </div>
              </div>
            </div>

            {user && (
              <div className="flex items-center space-x-4">
                <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                  <Bookmark className="h-5 w-5" />
                  <span>My Templates</span>
                </button>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>{user.name}</span>
                  {user.role === 'admin' && (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Admin</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Healthcare Facility Templates
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Accelerate your project with our professionally designed templates. Each template includes
            NFPA 99 compliant medical gas systems, equipment specifications, and cost estimates.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
            {/* Search */}
            <div className="relative flex-1 max-w-lg">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 appearance-none"
                >
                  <option value="all">All Categories</option>
                  <option value="hospital">Hospital</option>
                  <option value="surgery center">Surgery Center</option>
                  <option value="clinic">Clinic</option>
                  <option value="emergency">Emergency</option>
                  <option value="specialty">Specialty</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-8 mb-12">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onUseTemplate={handleUseTemplate}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>

        {/* Empty State */}
        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || selectedCategory !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Templates are being loaded.'
              }
            </p>
            {(searchTerm || selectedCategory !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Benefits Section */}
        <div className="bg-blue-50 rounded-2xl p-8 mb-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Use Professional Templates?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our templates are developed by healthcare facility experts and include all necessary
              compliance requirements and engineering specifications.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Save Time</h3>
              <p className="text-gray-600 text-sm">
                Reduce project planning time by 70% with pre-configured room layouts and equipment specifications.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Ensure Compliance</h3>
              <p className="text-gray-600 text-sm">
                All templates meet NFPA 99, ASHRAE 170, and other healthcare facility standards.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Proven Designs</h3>
              <p className="text-gray-600 text-sm">
                Based on real-world healthcare facility projects with verified performance data.
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Need a Custom Template?</h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Our team can create custom templates tailored to your specific requirements and facility types.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors">
              Contact Our Team
            </button>
            <button className="border border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:text-blue-600 transition-colors">
              Learn More
            </button>
          </div>
        </div>
      </div>

      {/* Template Details Modal */}
      {showTemplateDetails && <TemplateDetailsModal />}
    </div>
  );
}

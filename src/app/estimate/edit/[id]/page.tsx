'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  Building,
  ArrowRight,
  ArrowLeft,
  Save,
  Download,
  Mail,
  Calculator,
  MapPin,
  Users,
  Wrench,
  Settings,
  FileText,
  DollarSign,
  QrCode,
  UserIcon,
  History,
  AlertTriangle,
  CheckCircle,
  Clock,
  Edit3,
  RotateCcw
} from 'lucide-react';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import EmailEstimate from '@/components/EmailEstimate';

interface EstimateVersion {
  id: string;
  version: number;
  modifiedAt: string;
  modifiedBy: string;
  changeNotes: string;
  changes: Array<{
    field: string;
    oldValue: any;
    newValue: any;
    timestamp: string;
  }>;
}

interface EstimateData {
  id: string;
  projectName: string;
  facilityType: string;
  clientName: string;
  location: string;
  projectData: any;
  rooms: any[];
  equipment: any[];
  costs: {
    equipment: number;
    installation: number;
    medicalGas: number;
    compliance: number;
    contingency: number;
    total: number;
  };
  totalCost: number;
  createdAt: string;
  lastModified: string;
  status: 'draft' | 'final' | 'sent' | 'approved';
  version: number;
  versions: EstimateVersion[];
  auditTrail: Array<{
    action: string;
    timestamp: string;
    user: string;
    details: string;
  }>;
}

export default function EditEstimatePage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const estimateId = params.id as string;

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showAuditTrail, setShowAuditTrail] = useState(false);
  const [changeNotes, setChangeNotes] = useState('');
  const [originalData, setOriginalData] = useState<EstimateData | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Form Data
  const [projectData, setProjectData] = useState({
    projectName: '',
    clientName: '',
    facilityType: 'Hospital',
    location: '',
    squareFootage: 0,
    numberOfRooms: 0,
    specialRequirements: ''
  });

  const [rooms, setRooms] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [costs, setCosts] = useState({
    equipment: 0,
    installation: 0,
    medicalGas: 0,
    compliance: 0,
    contingency: 0,
    total: 0
  });

  const [estimateData, setEstimateData] = useState<EstimateData | null>(null);

  // Load estimate data
  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (!estimateId) {
      router.push('/dashboard');
      return;
    }

    loadEstimateData();
  }, [user, estimateId, router]);

  const loadEstimateData = () => {
    const estimates = JSON.parse(localStorage.getItem('ds-arch-estimates') || '{}');
    const estimate = estimates[estimateId];

    if (!estimate) {
      router.push('/dashboard');
      return;
    }

    // Check if user has permission to edit
    if (estimate.userId !== user?.id && user?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    setEstimateData(estimate);
    setOriginalData(JSON.parse(JSON.stringify(estimate))); // Deep copy for comparison

    // Populate form fields
    setProjectData(estimate.projectData || {
      projectName: estimate.projectName || '',
      clientName: estimate.clientName || '',
      facilityType: estimate.facilityType || 'Hospital',
      location: estimate.location || '',
      squareFootage: estimate.projectData?.squareFootage || 0,
      numberOfRooms: estimate.projectData?.numberOfRooms || 0,
      specialRequirements: estimate.projectData?.specialRequirements || ''
    });

    setRooms(estimate.rooms || []);
    setEquipment(estimate.equipment || []);
    setCosts(estimate.costs || {
      equipment: 0,
      installation: 0,
      medicalGas: 0,
      compliance: 0,
      contingency: 0,
      total: 0
    });
  };

  // Calculate costs when data changes
  const calculateCosts = useCallback(() => {
    const equipmentCost = equipment.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
    const installationCost = equipment.reduce((sum, item) => sum + item.installationCost, 0);

    // Medical gas costs based on outlets with pressure calculations
    const totalOutlets = rooms.reduce((sum, room) =>
      sum + room.oxygenOutlets + room.airOutlets + room.vacuumOutlets + room.co2Outlets + room.n2oOutlets, 0
    );

    // Enhanced medical gas calculations
    const medicalGasCost = calculateMedicalGasCost(rooms);

    const subtotal = equipmentCost + installationCost + medicalGasCost;
    const complianceCost = subtotal * 0.15; // 15% for compliance
    const contingencyCost = subtotal * 0.10; // 10% contingency

    const total = subtotal + complianceCost + contingencyCost;

    const newCosts = {
      equipment: equipmentCost,
      installation: installationCost,
      medicalGas: medicalGasCost,
      compliance: complianceCost,
      contingency: contingencyCost,
      total
    };

    setCosts(newCosts);
    checkForChanges();
  }, [equipment, rooms]);

  // Enhanced medical gas cost calculation
  const calculateMedicalGasCost = (roomsData: any[]) => {
    let totalCost = 0;

    roomsData.forEach(room => {
      // Base outlet costs
      const outletCosts = {
        oxygen: room.oxygenOutlets * 1500, // Higher cost for O2 due to pressure requirements
        air: room.airOutlets * 1200,
        vacuum: room.vacuumOutlets * 1400,
        co2: room.co2Outlets * 1300,
        n2o: room.n2oOutlets * 1350
      };

      // Area-based piping costs (per sq ft)
      const pipingCost = room.area * 25;

      // Room type complexity multiplier
      const complexityMultipliers = {
        'Operating Room': 1.5,
        'ICU': 1.3,
        'Emergency Room': 1.4,
        'Recovery Room': 1.1,
        'Patient Room': 1.0
      };

      const multiplier = complexityMultipliers[room.type as keyof typeof complexityMultipliers] || 1.0;
      const roomTotal = (Object.values(outletCosts).reduce((sum: number, cost: number) => sum + cost, 0) + pipingCost) * multiplier;

      totalCost += roomTotal;
    });

    return totalCost;
  };

  useEffect(() => {
    calculateCosts();
  }, [calculateCosts]);

  // Check for changes compared to original data
  const checkForChanges = () => {
    if (!originalData) return;

    const currentData = {
      projectData,
      rooms,
      equipment,
      costs
    };

    const hasChanges = JSON.stringify(currentData) !== JSON.stringify({
      projectData: originalData.projectData,
      rooms: originalData.rooms,
      equipment: originalData.equipment,
      costs: originalData.costs
    });

    setHasUnsavedChanges(hasChanges);
  };

  const saveEstimate = async () => {
    if (!user || !estimateData) return;

    setIsLoading(true);

    try {
      // Calculate changes for audit trail
      const changes = [];
      if (JSON.stringify(projectData) !== JSON.stringify(originalData?.projectData)) {
        changes.push({
          field: 'Project Information',
          oldValue: originalData?.projectData,
          newValue: projectData,
          timestamp: new Date().toISOString()
        });
      }
      if (JSON.stringify(rooms) !== JSON.stringify(originalData?.rooms)) {
        changes.push({
          field: 'Room Configuration',
          oldValue: originalData?.rooms,
          newValue: rooms,
          timestamp: new Date().toISOString()
        });
      }
      if (JSON.stringify(equipment) !== JSON.stringify(originalData?.equipment)) {
        changes.push({
          field: 'Equipment & Materials',
          oldValue: originalData?.equipment,
          newValue: equipment,
          timestamp: new Date().toISOString()
        });
      }

      const newVersion: EstimateVersion = {
        id: Math.random().toString(36).substr(2, 9),
        version: (estimateData.version || 1) + 1,
        modifiedAt: new Date().toISOString(),
        modifiedBy: user.name,
        changeNotes: changeNotes || 'No notes provided',
        changes
      };

      const auditEntry = {
        action: 'Estimate Modified',
        timestamp: new Date().toISOString(),
        user: user.name,
        details: `Version ${newVersion.version}: ${changeNotes || 'No notes provided'}`
      };

      const updatedEstimate = {
        ...estimateData,
        projectData,
        rooms,
        equipment,
        costs,
        totalCost: costs.total,
        lastModified: new Date().toISOString(),
        version: newVersion.version,
        versions: [...(estimateData.versions || []), newVersion],
        auditTrail: [...(estimateData.auditTrail || []), auditEntry]
      };

      // Save to localStorage
      const estimates = JSON.parse(localStorage.getItem('ds-arch-estimates') || '{}');
      estimates[estimateId] = updatedEstimate;
      localStorage.setItem('ds-arch-estimates', JSON.stringify(estimates));

      setEstimateData(updatedEstimate);
      setOriginalData(JSON.parse(JSON.stringify(updatedEstimate)));
      setHasUnsavedChanges(false);
      setChangeNotes('');

      alert('Estimate saved successfully!');
    } catch (error) {
      console.error('Error saving estimate:', error);
      alert('Failed to save estimate. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const revertToVersion = (version: EstimateVersion) => {
    if (!confirm(`Are you sure you want to revert to version ${version.version}? This will discard current changes.`)) {
      return;
    }

    // In a real implementation, you would restore the data from the version
    alert(`Reverting to version ${version.version} (implementation pending)`);
  };

  const generatePDF = async () => {
    try {
      setIsLoading(true);
      const pdf = new jsPDF('p', 'mm', 'a4');

      // Enhanced PDF with version information
      pdf.setFontSize(20);
      pdf.text('DS Arch Medical Facility Cost Estimate', 20, 30);

      pdf.setFontSize(10);
      pdf.text(`Version: ${estimateData?.version || 1}`, 150, 20);
      pdf.text(`Last Modified: ${estimateData?.lastModified ? new Date(estimateData.lastModified).toLocaleDateString() : 'N/A'}`, 150, 25);

      pdf.setFontSize(12);
      pdf.text(`Project: ${projectData.projectName}`, 20, 50);
      pdf.text(`Client: ${projectData.clientName}`, 20, 60);
      pdf.text(`Facility Type: ${projectData.facilityType}`, 20, 70);
      pdf.text(`Location: ${projectData.location}`, 20, 80);

      // Cost Breakdown
      let yPos = 100;
      pdf.setFontSize(14);
      pdf.text('Cost Breakdown:', 20, yPos);
      yPos += 10;

      pdf.setFontSize(10);
      pdf.text(`Equipment: $${costs.equipment.toLocaleString()}`, 20, yPos);
      yPos += 8;
      pdf.text(`Installation: $${costs.installation.toLocaleString()}`, 20, yPos);
      yPos += 8;
      pdf.text(`Medical Gas Systems: $${costs.medicalGas.toLocaleString()}`, 20, yPos);
      yPos += 8;
      pdf.text(`Compliance: $${costs.compliance.toLocaleString()}`, 20, yPos);
      yPos += 8;
      pdf.text(`Contingency: $${costs.contingency.toLocaleString()}`, 20, yPos);
      yPos += 15;

      pdf.setFontSize(14);
      pdf.text(`Total: $${costs.total.toLocaleString()}`, 20, yPos);

      // Version History
      if (estimateData?.versions && estimateData.versions.length > 0) {
        yPos += 20;
        pdf.setFontSize(12);
        pdf.text('Version History:', 20, yPos);
        yPos += 10;

        pdf.setFontSize(8);
        estimateData.versions.slice(-5).forEach(version => {
          pdf.text(`v${version.version} - ${new Date(version.modifiedAt).toLocaleDateString()} by ${version.modifiedBy}`, 20, yPos);
          yPos += 6;
          if (version.changeNotes) {
            pdf.text(`  Notes: ${version.changeNotes}`, 25, yPos);
            yPos += 6;
          }
        });
      }

      // Footer
      pdf.setFontSize(8);
      pdf.text('Generated by DS Arch Medical Cost Estimator - Enterprise Edition', 20, 280);

      pdf.save(`${projectData.projectName || 'estimate'}-v${estimateData?.version || 1}.pdf`);
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('PDF generation failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Room management functions
  const addRoom = () => {
    setRooms([...rooms, {
      name: `Room ${rooms.length + 1}`,
      type: 'Operating Room',
      area: 400,
      oxygenOutlets: 4,
      airOutlets: 2,
      vacuumOutlets: 4,
      co2Outlets: 0,
      n2oOutlets: 2,
      // Enhanced properties for medical gas calculations
      ceilingHeight: 10,
      pressureRequirement: 'Standard',
      backupRequired: true
    }]);
    setHasUnsavedChanges(true);
  };

  const addEquipment = () => {
    setEquipment([...equipment, {
      name: 'Medical Equipment',
      category: 'General',
      quantity: 1,
      unitCost: 5000,
      installationCost: 1000,
      // Enhanced properties
      manufacturer: '',
      model: '',
      warranty: '1 year',
      maintenanceRequired: true
    }]);
    setHasUnsavedChanges(true);
  };

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  if (!estimateData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading estimate...</p>
        </div>
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Project Information</h2>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>Version {estimateData.version || 1}</span>
                <span>•</span>
                <span>Last modified: {estimateData.lastModified ? new Date(estimateData.lastModified).toLocaleDateString() : 'Never'}</span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Project Name</label>
                <input
                  type="text"
                  value={projectData.projectName}
                  onChange={(e) => {
                    setProjectData({...projectData, projectName: e.target.value});
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Enter project name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Client Name</label>
                <input
                  type="text"
                  value={projectData.clientName}
                  onChange={(e) => {
                    setProjectData({...projectData, clientName: e.target.value});
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Enter client name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Facility Type</label>
                <select
                  value={projectData.facilityType}
                  onChange={(e) => {
                    setProjectData({...projectData, facilityType: e.target.value});
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                >
                  <option value="Hospital">Hospital</option>
                  <option value="Surgery Center">Surgery Center</option>
                  <option value="Clinic">Clinic</option>
                  <option value="Dental Office">Dental Office</option>
                  <option value="Veterinary Clinic">Veterinary Clinic</option>
                  <option value="Emergency Department">Emergency Department</option>
                  <option value="ICU">ICU</option>
                  <option value="NICU">NICU</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  value={projectData.location}
                  onChange={(e) => {
                    setProjectData({...projectData, location: e.target.value});
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="City, State"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Square Footage</label>
                <input
                  type="number"
                  value={projectData.squareFootage}
                  onChange={(e) => {
                    setProjectData({...projectData, squareFootage: parseInt(e.target.value) || 0});
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Total square footage"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Number of Rooms</label>
                <input
                  type="number"
                  value={projectData.numberOfRooms}
                  onChange={(e) => {
                    setProjectData({...projectData, numberOfRooms: parseInt(e.target.value) || 0});
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Total number of rooms"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Special Requirements</label>
              <textarea
                value={projectData.specialRequirements}
                onChange={(e) => {
                  setProjectData({...projectData, specialRequirements: e.target.value});
                  setHasUnsavedChanges(true);
                }}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                placeholder="Any special requirements or notes..."
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Enhanced Room Configuration</h2>
              <button
                onClick={addRoom}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Building className="h-4 w-4" />
                <span>Add Room</span>
              </button>
            </div>

            <div className="grid gap-6">
              {rooms.map((room, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <div className="grid md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Room Name</label>
                      <input
                        type="text"
                        value={room.name}
                        onChange={(e) => {
                          const newRooms = [...rooms];
                          newRooms[index].name = e.target.value;
                          setRooms(newRooms);
                          setHasUnsavedChanges(true);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Room Type</label>
                      <select
                        value={room.type}
                        onChange={(e) => {
                          const newRooms = [...rooms];
                          newRooms[index].type = e.target.value;
                          setRooms(newRooms);
                          setHasUnsavedChanges(true);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      >
                        <option value="Operating Room">Operating Room</option>
                        <option value="Recovery Room">Recovery Room</option>
                        <option value="ICU">ICU</option>
                        <option value="Emergency Room">Emergency Room</option>
                        <option value="Patient Room">Patient Room</option>
                        <option value="NICU">NICU</option>
                        <option value="Surgical Suite">Surgical Suite</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Area (sq ft)</label>
                      <input
                        type="number"
                        value={room.area}
                        onChange={(e) => {
                          const newRooms = [...rooms];
                          newRooms[index].area = parseInt(e.target.value) || 0;
                          setRooms(newRooms);
                          setHasUnsavedChanges(true);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Ceiling Height (ft)</label>
                      <input
                        type="number"
                        value={room.ceilingHeight || 10}
                        onChange={(e) => {
                          const newRooms = [...rooms];
                          newRooms[index].ceilingHeight = parseInt(e.target.value) || 10;
                          setRooms(newRooms);
                          setHasUnsavedChanges(true);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Medical Gas Outlets</h4>
                    <div className="grid grid-cols-5 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Oxygen</label>
                        <input
                          type="number"
                          value={room.oxygenOutlets}
                          onChange={(e) => {
                            const newRooms = [...rooms];
                            newRooms[index].oxygenOutlets = parseInt(e.target.value) || 0;
                            setRooms(newRooms);
                            setHasUnsavedChanges(true);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Medical Air</label>
                        <input
                          type="number"
                          value={room.airOutlets}
                          onChange={(e) => {
                            const newRooms = [...rooms];
                            newRooms[index].airOutlets = parseInt(e.target.value) || 0;
                            setRooms(newRooms);
                            setHasUnsavedChanges(true);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Vacuum</label>
                        <input
                          type="number"
                          value={room.vacuumOutlets}
                          onChange={(e) => {
                            const newRooms = [...rooms];
                            newRooms[index].vacuumOutlets = parseInt(e.target.value) || 0;
                            setRooms(newRooms);
                            setHasUnsavedChanges(true);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">CO2</label>
                        <input
                          type="number"
                          value={room.co2Outlets}
                          onChange={(e) => {
                            const newRooms = [...rooms];
                            newRooms[index].co2Outlets = parseInt(e.target.value) || 0;
                            setRooms(newRooms);
                            setHasUnsavedChanges(true);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">N2O</label>
                        <input
                          type="number"
                          value={room.n2oOutlets}
                          onChange={(e) => {
                            const newRooms = [...rooms];
                            newRooms[index].n2oOutlets = parseInt(e.target.value) || 0;
                            setRooms(newRooms);
                            setHasUnsavedChanges(true);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Pressure Requirement</label>
                      <select
                        value={room.pressureRequirement || 'Standard'}
                        onChange={(e) => {
                          const newRooms = [...rooms];
                          newRooms[index].pressureRequirement = e.target.value;
                          setRooms(newRooms);
                          setHasUnsavedChanges(true);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      >
                        <option value="Standard">Standard (50 PSI)</option>
                        <option value="High">High Pressure (100 PSI)</option>
                        <option value="Low">Low Pressure (30 PSI)</option>
                        <option value="Variable">Variable Pressure</option>
                      </select>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={room.backupRequired || false}
                        onChange={(e) => {
                          const newRooms = [...rooms];
                          newRooms[index].backupRequired = e.target.checked;
                          setRooms(newRooms);
                          setHasUnsavedChanges(true);
                        }}
                        className="mr-2"
                      />
                      <label className="text-sm font-medium text-gray-700">Backup System Required</label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Equipment & Materials</h2>
              <button
                onClick={addEquipment}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Wrench className="h-4 w-4" />
                <span>Add Equipment</span>
              </button>
            </div>

            <div className="grid gap-6">
              {equipment.map((item, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Equipment Name</label>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => {
                          const newEquipment = [...equipment];
                          newEquipment[index].name = e.target.value;
                          setEquipment(newEquipment);
                          setHasUnsavedChanges(true);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Manufacturer</label>
                      <input
                        type="text"
                        value={item.manufacturer || ''}
                        onChange={(e) => {
                          const newEquipment = [...equipment];
                          newEquipment[index].manufacturer = e.target.value;
                          setEquipment(newEquipment);
                          setHasUnsavedChanges(true);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        placeholder="Equipment manufacturer"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                      <input
                        type="text"
                        value={item.model || ''}
                        onChange={(e) => {
                          const newEquipment = [...equipment];
                          newEquipment[index].model = e.target.value;
                          setEquipment(newEquipment);
                          setHasUnsavedChanges(true);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        placeholder="Model number"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-5 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <select
                        value={item.category}
                        onChange={(e) => {
                          const newEquipment = [...equipment];
                          newEquipment[index].category = e.target.value;
                          setEquipment(newEquipment);
                          setHasUnsavedChanges(true);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      >
                        <option value="General">General</option>
                        <option value="Surgical">Surgical</option>
                        <option value="Monitoring">Monitoring</option>
                        <option value="Life Support">Life Support</option>
                        <option value="Diagnostic">Diagnostic</option>
                        <option value="Anesthesia">Anesthesia</option>
                        <option value="HVAC">HVAC</option>
                        <option value="Electrical">Electrical</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => {
                          const newEquipment = [...equipment];
                          newEquipment[index].quantity = parseInt(e.target.value) || 0;
                          setEquipment(newEquipment);
                          setHasUnsavedChanges(true);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Unit Cost</label>
                      <input
                        type="number"
                        value={item.unitCost}
                        onChange={(e) => {
                          const newEquipment = [...equipment];
                          newEquipment[index].unitCost = parseInt(e.target.value) || 0;
                          setEquipment(newEquipment);
                          setHasUnsavedChanges(true);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Installation</label>
                      <input
                        type="number"
                        value={item.installationCost}
                        onChange={(e) => {
                          const newEquipment = [...equipment];
                          newEquipment[index].installationCost = parseInt(e.target.value) || 0;
                          setEquipment(newEquipment);
                          setHasUnsavedChanges(true);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Warranty</label>
                      <select
                        value={item.warranty || '1 year'}
                        onChange={(e) => {
                          const newEquipment = [...equipment];
                          newEquipment[index].warranty = e.target.value;
                          setEquipment(newEquipment);
                          setHasUnsavedChanges(true);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      >
                        <option value="1 year">1 Year</option>
                        <option value="2 years">2 Years</option>
                        <option value="3 years">3 Years</option>
                        <option value="5 years">5 Years</option>
                        <option value="10 years">10 Years</option>
                        <option value="Lifetime">Lifetime</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Enterprise Cost Summary</h2>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowVersionHistory(true)}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                >
                  <History className="h-4 w-4" />
                  <span>Version History</span>
                </button>
                <button
                  onClick={() => setShowAuditTrail(true)}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                >
                  <FileText className="h-4 w-4" />
                  <span>Audit Trail</span>
                </button>
              </div>
            </div>

            {/* Unsaved Changes Warning */}
            {hasUnsavedChanges && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center space-x-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-yellow-800 font-medium">Unsaved Changes</p>
                  <p className="text-yellow-700 text-sm">You have unsaved changes. Please save your work before continuing.</p>
                </div>
              </div>
            )}

            {/* Change Notes */}
            {hasUnsavedChanges && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Notes</h3>
                <textarea
                  value={changeNotes}
                  onChange={(e) => setChangeNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Describe the changes made in this version..."
                />
              </div>
            )}

            {/* Project Summary */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Summary</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div><strong>Project:</strong> {projectData.projectName}</div>
                <div><strong>Client:</strong> {projectData.clientName}</div>
                <div><strong>Facility Type:</strong> {projectData.facilityType}</div>
                <div><strong>Location:</strong> {projectData.location}</div>
                <div><strong>Square Footage:</strong> {projectData.squareFootage.toLocaleString()} sq ft</div>
                <div><strong>Number of Rooms:</strong> {rooms.length}</div>
                <div><strong>Version:</strong> {estimateData.version || 1}</div>
                <div><strong>Last Modified:</strong> {estimateData.lastModified ? new Date(estimateData.lastModified).toLocaleDateString() : 'Never'}</div>
              </div>
            </div>

            {/* Enhanced Cost Breakdown */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Enhanced Cost Breakdown</h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-gray-700">Equipment & Materials</span>
                  <span className="font-medium">${costs.equipment.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-gray-700">Installation & Labor</span>
                  <span className="font-medium">${costs.installation.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <div>
                    <span className="text-gray-700">Medical Gas Systems</span>
                    <div className="text-xs text-gray-500">Includes pressure calculations and NFPA 99 compliance</div>
                  </div>
                  <span className="font-medium">${costs.medicalGas.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-gray-700">Compliance & Testing (15%)</span>
                  <span className="font-medium">${costs.compliance.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-gray-700">Contingency (10%)</span>
                  <span className="font-medium">${costs.contingency.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center py-4 bg-gray-50 rounded-lg px-4">
                  <span className="text-lg font-bold text-gray-900">Total Project Cost</span>
                  <span className="text-2xl font-bold text-blue-600">${costs.total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-4">
              <button
                onClick={saveEstimate}
                disabled={isLoading || !hasUnsavedChanges}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-5 w-5" />
                <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
              </button>

              <button
                onClick={() => setShowEmailModal(true)}
                className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
              >
                <Mail className="h-5 w-5" />
                <span>Email to Client</span>
              </button>

              <button
                onClick={generatePDF}
                disabled={isLoading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                <Download className="h-5 w-5" />
                <span>{isLoading ? 'Generating...' : 'Download PDF'}</span>
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
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
                <Edit3 className="h-5 w-5 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">Edit Estimate</h1>
                {hasUnsavedChanges && (
                  <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">Unsaved</span>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                <span>Version {estimateData.version || 1}</span>
                <span className="mx-2">•</span>
                <span>{estimateData.lastModified ? new Date(estimateData.lastModified).toLocaleDateString() : 'Never modified'}</span>
              </div>
              {user && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <UserIcon className="h-4 w-4" />
                  <span>{user.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step}
                </div>
                <div className="ml-3 text-sm">
                  <div className={`font-medium ${step <= currentStep ? 'text-blue-600' : 'text-gray-600'}`}>
                    {step === 1 && 'Project Info'}
                    {step === 2 && 'Room Config'}
                    {step === 3 && 'Equipment'}
                    {step === 4 && 'Summary'}
                  </div>
                </div>
                {step < 4 && <ArrowRight className="h-5 w-5 text-gray-400 mx-6" />}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Previous</span>
          </button>

          <button
            onClick={nextStep}
            disabled={currentStep === 4}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Next</span>
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Email Modal */}
      <EmailEstimate
        estimate={{
          id: estimateId,
          projectName: projectData.projectName || 'Untitled Project',
          facilityType: projectData.facilityType,
          clientName: projectData.clientName,
          totalCost: costs.total
        }}
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onSuccess={() => {
          alert('Estimate sent successfully!');
        }}
      />

      {/* Version History Modal */}
      {showVersionHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Version History</h2>
              <button
                onClick={() => setShowVersionHistory(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                {estimateData.versions?.map((version, index) => (
                  <div key={version.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">Version {version.version}</h3>
                        <p className="text-sm text-gray-600">
                          Modified by {version.modifiedBy} on {new Date(version.modifiedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => revertToVersion(version)}
                        className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1"
                      >
                        <RotateCcw className="h-4 w-4" />
                        <span>Revert</span>
                      </button>
                    </div>
                    {version.changeNotes && (
                      <p className="text-sm text-gray-700 mb-2">Notes: {version.changeNotes}</p>
                    )}
                    {version.changes.length > 0 && (
                      <div className="text-xs text-gray-600">
                        Changes: {version.changes.map(c => c.field).join(', ')}
                      </div>
                    )}
                  </div>
                )) || (
                  <p className="text-gray-500 text-center py-8">No version history available</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audit Trail Modal */}
      {showAuditTrail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Audit Trail</h2>
              <button
                onClick={() => setShowAuditTrail(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                {estimateData.auditTrail?.map((entry, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{entry.action}</h3>
                        <p className="text-sm text-gray-600">{entry.details}</p>
                      </div>
                      <div className="text-xs text-gray-500">
                        <div>{entry.user}</div>
                        <div>{new Date(entry.timestamp).toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                )) || (
                  <p className="text-gray-500 text-center py-8">No audit trail available</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

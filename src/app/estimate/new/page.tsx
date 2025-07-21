'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  Building,
  ArrowRight,
  ArrowLeft,
  Save,
  Download,
  Share2,
  Calculator,
  MapPin,
  Users,
  Wrench,
  Settings,
  FileText,
  DollarSign,
  QrCode,
  Mail,
  User as UserIcon
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';
import EmailEstimate from '@/components/EmailEstimate';

interface ProjectData {
  projectName: string;
  clientName: string;
  facilityType: string;
  location: string;
  squareFootage: number;
  numberOfRooms: number;
  specialRequirements: string;
}

interface RoomData {
  name: string;
  type: string;
  area: number;
  oxygenOutlets: number;
  airOutlets: number;
  vacuumOutlets: number;
  co2Outlets: number;
  n2oOutlets: number;
}

interface EquipmentData {
  name: string;
  category: string;
  quantity: number;
  unitCost: number;
  installationCost: number;
}

interface CostBreakdown {
  equipment: number;
  installation: number;
  medicalGas: number;
  compliance: number;
  contingency: number;
  total: number;
}

export default function NewEstimatePage() {
  const { user, saveEstimate } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [savedEstimateId, setSavedEstimateId] = useState<string | null>(null);

  // Form Data
  const [projectData, setProjectData] = useState<ProjectData>({
    projectName: '',
    clientName: '',
    facilityType: 'Hospital',
    location: '',
    squareFootage: 0,
    numberOfRooms: 0,
    specialRequirements: ''
  });

  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [equipment, setEquipment] = useState<EquipmentData[]>([]);
  const [costs, setCosts] = useState<CostBreakdown>({
    equipment: 0,
    installation: 0,
    medicalGas: 0,
    compliance: 0,
    contingency: 0,
    total: 0
  });

  // Calculate costs whenever data changes
  const calculateCosts = useCallback(() => {
    const equipmentCost = equipment.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
    const installationCost = equipment.reduce((sum, item) => sum + item.installationCost, 0);

    // Medical gas costs based on outlets
    const totalOutlets = rooms.reduce((sum, room) =>
      sum + room.oxygenOutlets + room.airOutlets + room.vacuumOutlets + room.co2Outlets + room.n2oOutlets, 0
    );
    const medicalGasCost = totalOutlets * 1200; // $1200 per outlet average

    // Compliance and contingency
    const subtotal = equipmentCost + installationCost + medicalGasCost;
    const complianceCost = subtotal * 0.15; // 15% for compliance
    const contingencyCost = subtotal * 0.10; // 10% contingency

    const total = subtotal + complianceCost + contingencyCost;

    setCosts({
      equipment: equipmentCost,
      installation: installationCost,
      medicalGas: medicalGasCost,
      compliance: complianceCost,
      contingency: contingencyCost,
      total
    });
  }, [equipment, rooms]);

  useEffect(() => {
    calculateCosts();
  }, [calculateCosts]);

  const addRoom = () => {
    setRooms([...rooms, {
      name: `Room ${rooms.length + 1}`,
      type: 'Operating Room',
      area: 400,
      oxygenOutlets: 4,
      airOutlets: 2,
      vacuumOutlets: 4,
      co2Outlets: 0,
      n2oOutlets: 2
    }]);
  };

  const addEquipment = () => {
    setEquipment([...equipment, {
      name: 'Medical Equipment',
      category: 'General',
      quantity: 1,
      unitCost: 5000,
      installationCost: 1000
    }]);
  };

  const saveEstimateData = async () => {
    if (!user) return;

    const estimateId = Math.random().toString(36).substr(2, 9);
    const estimateData = {
      projectName: projectData.projectName || 'Untitled Project',
      facilityType: projectData.facilityType,
      clientName: projectData.clientName,
      location: projectData.location,
      projectData,
      rooms,
      equipment,
      costs,
      totalCost: costs.total,
      createdAt: new Date().toISOString(),
      status: 'draft' as const
    };

    saveEstimate(estimateId, estimateData);
    setSavedEstimateId(estimateId);
    return estimateId;
  };

  const generatePDF = async () => {
    try {
      setIsLoading(true);
      const pdf = new jsPDF('p', 'mm', 'a4');

      // Header
      pdf.setFontSize(20);
      pdf.text('DS Arch Medical Facility Cost Estimate', 20, 30);

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

      // Footer
      pdf.setFontSize(8);
      pdf.text('Generated by DS Arch Medical Cost Estimator - dsarch.org', 20, 280);

      pdf.save(`${projectData.projectName || 'estimate'}.pdf`);
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('PDF generation failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateQRCode = async () => {
    try {
      const estimateId = await saveEstimateData();
      if (!estimateId) return;

      const url = `${window.location.origin}/estimate/view?id=${estimateId}`;
      const qrCodeDataURL = await QRCode.toDataURL(url);

      // Create a new window with the QR code
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head><title>Share Estimate</title></head>
            <body style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
              <h2>Share Your Estimate</h2>
              <p>Scan this QR code to view the estimate:</p>
              <img src="${qrCodeDataURL}" style="max-width: 300px; margin: 20px 0;" />
              <p><a href="${url}" target="_blank">${url}</a></p>
            </body>
          </html>
        `);
      }
    } catch (error) {
      console.error('QR code generation failed:', error);
    }
  };

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Project Information</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Project Name</label>
                <input
                  type="text"
                  value={projectData.projectName}
                  onChange={(e) => setProjectData({...projectData, projectName: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Enter project name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Client Name</label>
                <input
                  type="text"
                  value={projectData.clientName}
                  onChange={(e) => setProjectData({...projectData, clientName: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Enter client name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Facility Type</label>
                <select
                  value={projectData.facilityType}
                  onChange={(e) => setProjectData({...projectData, facilityType: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                >
                  <option value="Hospital">Hospital</option>
                  <option value="Surgery Center">Surgery Center</option>
                  <option value="Clinic">Clinic</option>
                  <option value="Dental Office">Dental Office</option>
                  <option value="Veterinary Clinic">Veterinary Clinic</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  value={projectData.location}
                  onChange={(e) => setProjectData({...projectData, location: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="City, State"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Square Footage</label>
                <input
                  type="number"
                  value={projectData.squareFootage}
                  onChange={(e) => setProjectData({...projectData, squareFootage: parseInt(e.target.value) || 0})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Total square footage"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Number of Rooms</label>
                <input
                  type="number"
                  value={projectData.numberOfRooms}
                  onChange={(e) => setProjectData({...projectData, numberOfRooms: parseInt(e.target.value) || 0})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Total number of rooms"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Special Requirements</label>
              <textarea
                value={projectData.specialRequirements}
                onChange={(e) => setProjectData({...projectData, specialRequirements: e.target.value})}
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
              <h2 className="text-2xl font-bold text-gray-900">Room Configuration</h2>
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
                <div key={index} className="bg-gray-50 rounded-lg p-6">
                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Room Name</label>
                      <input
                        type="text"
                        value={room.name}
                        onChange={(e) => {
                          const newRooms = [...rooms];
                          newRooms[index].name = e.target.value;
                          setRooms(newRooms);
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
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      >
                        <option value="Operating Room">Operating Room</option>
                        <option value="Recovery Room">Recovery Room</option>
                        <option value="ICU">ICU</option>
                        <option value="Emergency Room">Emergency Room</option>
                        <option value="Patient Room">Patient Room</option>
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
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      />
                    </div>
                  </div>

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
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Air</label>
                      <input
                        type="number"
                        value={room.airOutlets}
                        onChange={(e) => {
                          const newRooms = [...rooms];
                          newRooms[index].airOutlets = parseInt(e.target.value) || 0;
                          setRooms(newRooms);
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
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      />
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
                <div key={index} className="bg-gray-50 rounded-lg p-6">
                  <div className="grid md:grid-cols-5 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Equipment Name</label>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => {
                          const newEquipment = [...equipment];
                          newEquipment[index].name = e.target.value;
                          setEquipment(newEquipment);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <select
                        value={item.category}
                        onChange={(e) => {
                          const newEquipment = [...equipment];
                          newEquipment[index].category = e.target.value;
                          setEquipment(newEquipment);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      >
                        <option value="General">General</option>
                        <option value="Surgical">Surgical</option>
                        <option value="Monitoring">Monitoring</option>
                        <option value="Life Support">Life Support</option>
                        <option value="Diagnostic">Diagnostic</option>
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
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      />
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
            <h2 className="text-2xl font-bold text-gray-900">Cost Summary</h2>

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
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Cost Breakdown</h3>

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
                  <span className="text-gray-700">Medical Gas Systems</span>
                  <span className="font-medium">${costs.medicalGas.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-gray-700">Compliance & Testing</span>
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
              {user && (
                <button
                  onClick={saveEstimateData}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <Save className="h-5 w-5" />
                  <span>Save Estimate</span>
                </button>
              )}

              {user && savedEstimateId && (
                <button
                  onClick={() => setShowEmailModal(true)}
                  className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
                >
                  <Mail className="h-5 w-5" />
                  <span>Email to Client</span>
                </button>
              )}

              <button
                onClick={generatePDF}
                disabled={isLoading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                <Download className="h-5 w-5" />
                <span>{isLoading ? 'Generating...' : 'Download PDF'}</span>
              </button>

              <button
                onClick={generateQRCode}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
              >
                <QrCode className="h-5 w-5" />
                <span>Share QR Code</span>
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
              <h1 className="text-xl font-bold text-gray-900">New Estimate</h1>
            </div>

            {user && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <UserIcon className="h-4 w-4" />
                <span>{user.name}</span>
              </div>
            )}
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
      {savedEstimateId && (
        <EmailEstimate
          estimate={{
            id: savedEstimateId,
            projectName: projectData.projectName || 'Untitled Project',
            facilityType: projectData.facilityType,
            clientName: projectData.clientName,
            totalCost: costs.total
          }}
          isOpen={showEmailModal}
          onClose={() => setShowEmailModal(false)}
          onSuccess={() => {
            // Refresh the estimate status or show success message
            alert('Estimate sent successfully!');
          }}
        />
      )}
    </div>
  );
}

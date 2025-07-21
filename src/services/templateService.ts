// Professional Template Engine for Healthcare Facilities
// Enterprise-grade template system for multi-billion dollar healthcare organizations

export interface RoomTemplate {
  name: string;
  type: string;
  area: number;
  ceilingHeight: number;
  oxygenOutlets: number;
  airOutlets: number;
  vacuumOutlets: number;
  co2Outlets: number;
  n2oOutlets: number;
  pressureRequirement: 'Standard' | 'High' | 'Low' | 'Variable';
  backupRequired: boolean;
  specialRequirements?: string;
  nfpaCompliance: string[];
  flowRateRequirements?: {
    oxygen: number; // SCFM
    air: number;
    vacuum: number; // CFM
  };
}

export interface EquipmentTemplate {
  name: string;
  category: string;
  manufacturer: string;
  model: string;
  quantity: number;
  unitCost: number;
  installationCost: number;
  warranty: string;
  maintenanceRequired: boolean;
  powerRequirement?: string;
  spaceRequirement?: number; // sq ft
  specialInstallation?: string;
}

export interface FacilityTemplate {
  id: string;
  name: string;
  type: string;
  description: string;
  category: 'Hospital' | 'Surgery Center' | 'Clinic' | 'Emergency' | 'Specialty';
  squareFootage: number;
  estimatedCost: number;
  constructionTime: string; // months
  rooms: RoomTemplate[];
  equipment: EquipmentTemplate[];
  specialRequirements: string[];
  complianceStandards: string[];
  projectData: {
    facilityType: string;
    specialRequirements: string;
    numberOfRooms: number;
  };
  medicalGasRequirements: {
    totalPressure: number; // PSI
    redundancyLevel: 'Single' | 'Dual' | 'Triple';
    centralSupplyRequired: boolean;
    backupSystems: string[];
  };
  hvacRequirements: {
    airChangesPerHour: number;
    filtrationLevel: string;
    pressurization: 'Positive' | 'Negative' | 'Neutral';
    temperatureRange: string;
    humidityRange: string;
  };
  electricalRequirements: {
    normalPower: string;
    emergencyPower: string;
    isolatedPower: boolean;
    groundingRequirements: string[];
  };
}

class TemplateService {
  private templates: Map<string, FacilityTemplate> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  private initializeTemplates() {
    // Operating Room Suite Template
    this.templates.set('or-suite', {
      id: 'or-suite',
      name: 'Operating Room Suite',
      type: 'Surgical Facility',
      description: 'Complete surgical suite with multiple operating rooms, prep areas, and recovery spaces',
      category: 'Surgery Center',
      squareFootage: 8000,
      estimatedCost: 2500000,
      constructionTime: '18-24',
      rooms: [
        {
          name: 'OR 1 - General Surgery',
          type: 'Operating Room',
          area: 600,
          ceilingHeight: 12,
          oxygenOutlets: 6,
          airOutlets: 4,
          vacuumOutlets: 6,
          co2Outlets: 2,
          n2oOutlets: 4,
          pressureRequirement: 'High',
          backupRequired: true,
          specialRequirements: 'Laminar flow ceiling, surgical lights integration',
          nfpaCompliance: ['NFPA 99-2021', 'NFPA 101', 'ASHRAE 170'],
          flowRateRequirements: {
            oxygen: 100,
            air: 80,
            vacuum: 60
          }
        },
        {
          name: 'OR 2 - Cardiac Surgery',
          type: 'Operating Room',
          area: 700,
          ceilingHeight: 12,
          oxygenOutlets: 8,
          airOutlets: 6,
          vacuumOutlets: 8,
          co2Outlets: 4,
          n2oOutlets: 4,
          pressureRequirement: 'High',
          backupRequired: true,
          specialRequirements: 'Enhanced backup systems, specialized cardiac equipment integration',
          nfpaCompliance: ['NFPA 99-2021', 'NFPA 101', 'ASHRAE 170'],
          flowRateRequirements: {
            oxygen: 150,
            air: 120,
            vacuum: 80
          }
        },
        {
          name: 'Pre-Op/PACU',
          type: 'Recovery Room',
          area: 400,
          ceilingHeight: 10,
          oxygenOutlets: 4,
          airOutlets: 2,
          vacuumOutlets: 4,
          co2Outlets: 0,
          n2oOutlets: 0,
          pressureRequirement: 'Standard',
          backupRequired: true,
          nfpaCompliance: ['NFPA 99-2021', 'ASHRAE 170'],
          flowRateRequirements: {
            oxygen: 50,
            air: 40,
            vacuum: 30
          }
        },
        {
          name: 'Sterile Processing',
          type: 'Support Room',
          area: 300,
          ceilingHeight: 10,
          oxygenOutlets: 0,
          airOutlets: 2,
          vacuumOutlets: 2,
          co2Outlets: 0,
          n2oOutlets: 0,
          pressureRequirement: 'Standard',
          backupRequired: false,
          nfpaCompliance: ['ASHRAE 170'],
          flowRateRequirements: {
            oxygen: 0,
            air: 20,
            vacuum: 15
          }
        }
      ],
      equipment: [
        {
          name: 'Surgical Table - Advanced',
          category: 'Surgical',
          manufacturer: 'Steris',
          model: 'Amsco 3080 RL',
          quantity: 2,
          unitCost: 85000,
          installationCost: 5000,
          warranty: '5 years',
          maintenanceRequired: true,
          powerRequirement: '110V/220V',
          spaceRequirement: 25,
          specialInstallation: 'Floor mounting with integrated power/data'
        },
        {
          name: 'Anesthesia Machine',
          category: 'Life Support',
          manufacturer: 'GE Healthcare',
          model: 'Aisys CS2',
          quantity: 2,
          unitCost: 125000,
          installationCost: 8000,
          warranty: '3 years',
          maintenanceRequired: true,
          powerRequirement: '110V',
          spaceRequirement: 15,
          specialInstallation: 'Medical gas connections, scavenging system'
        },
        {
          name: 'Surgical Lights',
          category: 'Surgical',
          manufacturer: 'Stryker',
          model: '1488 LED',
          quantity: 2,
          unitCost: 95000,
          installationCost: 12000,
          warranty: '5 years',
          maintenanceRequired: true,
          powerRequirement: '220V',
          spaceRequirement: 0,
          specialInstallation: 'Ceiling mount with structural support'
        },
        {
          name: 'Laminar Flow System',
          category: 'HVAC',
          manufacturer: 'American Air Filter',
          model: 'UltraClean 2000',
          quantity: 2,
          unitCost: 150000,
          installationCost: 25000,
          warranty: '10 years',
          maintenanceRequired: true,
          powerRequirement: '480V',
          spaceRequirement: 100,
          specialInstallation: 'Ceiling integration with HVAC system'
        }
      ],
      specialRequirements: [
        'Positive pressure environment',
        'HEPA filtration minimum',
        'Redundant medical gas systems',
        'Emergency power backup',
        'Isolated power systems',
        'Fire suppression system',
        'Access control and security'
      ],
      complianceStandards: [
        'NFPA 99-2021 (Health Care Facilities Code)',
        'NFPA 101 (Life Safety Code)',
        'ASHRAE 170 (Ventilation of Health Care Facilities)',
        'FGI Guidelines (Facility Guidelines Institute)',
        'AIA Guidelines',
        'Joint Commission Standards',
        'CMS Conditions of Participation'
      ],
      projectData: {
        facilityType: 'Surgery Center',
        specialRequirements: 'Advanced surgical capabilities with cardiac surgery support',
        numberOfRooms: 4
      },
      medicalGasRequirements: {
        totalPressure: 180,
        redundancyLevel: 'Triple',
        centralSupplyRequired: true,
        backupSystems: ['Liquid oxygen backup', 'Cylinder manifold backup', 'Emergency air compressor']
      },
      hvacRequirements: {
        airChangesPerHour: 25,
        filtrationLevel: 'HEPA (99.97% @ 0.3 microns)',
        pressurization: 'Positive',
        temperatureRange: '68-75°F',
        humidityRange: '45-60% RH'
      },
      electricalRequirements: {
        normalPower: '480V/277V, 3-phase',
        emergencyPower: 'Generator backup with 10-second transfer',
        isolatedPower: true,
        groundingRequirements: ['Isolated ground system', 'Line isolation monitors', 'Ground fault protection']
      }
    });

    // ICU Template
    this.templates.set('icu-unit', {
      id: 'icu-unit',
      name: 'Intensive Care Unit',
      type: 'Critical Care Facility',
      description: 'Complete ICU with patient rooms, central monitoring, and support areas',
      category: 'Hospital',
      squareFootage: 12000,
      estimatedCost: 3500000,
      constructionTime: '24-30',
      rooms: [
        {
          name: 'ICU Room 1',
          type: 'ICU',
          area: 250,
          ceilingHeight: 10,
          oxygenOutlets: 3,
          airOutlets: 2,
          vacuumOutlets: 3,
          co2Outlets: 0,
          n2oOutlets: 0,
          pressureRequirement: 'Standard',
          backupRequired: true,
          specialRequirements: 'Isolation capability, negative pressure option',
          nfpaCompliance: ['NFPA 99-2021', 'ASHRAE 170'],
          flowRateRequirements: {
            oxygen: 75,
            air: 60,
            vacuum: 45
          }
        },
        {
          name: 'ICU Room 2',
          type: 'ICU',
          area: 250,
          ceilingHeight: 10,
          oxygenOutlets: 3,
          airOutlets: 2,
          vacuumOutlets: 3,
          co2Outlets: 0,
          n2oOutlets: 0,
          pressureRequirement: 'Standard',
          backupRequired: true,
          nfpaCompliance: ['NFPA 99-2021', 'ASHRAE 170'],
          flowRateRequirements: {
            oxygen: 75,
            air: 60,
            vacuum: 45
          }
        },
        {
          name: 'Central Monitoring Station',
          type: 'Support Room',
          area: 200,
          ceilingHeight: 10,
          oxygenOutlets: 0,
          airOutlets: 1,
          vacuumOutlets: 0,
          co2Outlets: 0,
          n2oOutlets: 0,
          pressureRequirement: 'Standard',
          backupRequired: false,
          nfpaCompliance: ['ASHRAE 170'],
          flowRateRequirements: {
            oxygen: 0,
            air: 10,
            vacuum: 0
          }
        }
      ],
      equipment: [
        {
          name: 'Patient Monitor',
          category: 'Monitoring',
          manufacturer: 'Philips',
          model: 'IntelliVue MX850',
          quantity: 8,
          unitCost: 35000,
          installationCost: 2000,
          warranty: '3 years',
          maintenanceRequired: true,
          powerRequirement: '110V',
          spaceRequirement: 5
        },
        {
          name: 'Ventilator',
          category: 'Life Support',
          manufacturer: 'Medtronic',
          model: 'Puritan Bennett 980',
          quantity: 8,
          unitCost: 45000,
          installationCost: 3000,
          warranty: '3 years',
          maintenanceRequired: true,
          powerRequirement: '110V',
          spaceRequirement: 8,
          specialInstallation: 'Medical gas connections required'
        }
      ],
      specialRequirements: [
        'Central monitoring capability',
        'Isolation room capability',
        'Advanced life support systems',
        'Redundant power systems',
        'Nurse call integration'
      ],
      complianceStandards: [
        'NFPA 99-2021',
        'ASHRAE 170',
        'FGI Guidelines',
        'Joint Commission Standards'
      ],
      projectData: {
        facilityType: 'Hospital',
        specialRequirements: 'Critical care with isolation capabilities',
        numberOfRooms: 3
      },
      medicalGasRequirements: {
        totalPressure: 160,
        redundancyLevel: 'Dual',
        centralSupplyRequired: true,
        backupSystems: ['Liquid oxygen backup', 'Emergency air compressor']
      },
      hvacRequirements: {
        airChangesPerHour: 12,
        filtrationLevel: 'MERV 16 minimum',
        pressurization: 'Positive',
        temperatureRange: '70-75°F',
        humidityRange: '40-60% RH'
      },
      electricalRequirements: {
        normalPower: '208V/120V, 3-phase',
        emergencyPower: 'Generator backup with UPS',
        isolatedPower: false,
        groundingRequirements: ['Hospital grade grounding', 'GFCI protection']
      }
    });

    // Emergency Department Template
    this.templates.set('emergency-dept', {
      id: 'emergency-dept',
      name: 'Emergency Department',
      type: 'Emergency Care Facility',
      description: 'Complete emergency department with trauma bays, treatment rooms, and triage',
      category: 'Emergency',
      squareFootage: 15000,
      estimatedCost: 4500000,
      constructionTime: '30-36',
      rooms: [
        {
          name: 'Trauma Bay 1',
          type: 'Emergency Room',
          area: 350,
          ceilingHeight: 12,
          oxygenOutlets: 4,
          airOutlets: 3,
          vacuumOutlets: 4,
          co2Outlets: 1,
          n2oOutlets: 1,
          pressureRequirement: 'High',
          backupRequired: true,
          specialRequirements: 'Rapid response capability, imaging equipment compatibility',
          nfpaCompliance: ['NFPA 99-2021', 'ASHRAE 170'],
          flowRateRequirements: {
            oxygen: 120,
            air: 100,
            vacuum: 70
          }
        },
        {
          name: 'Treatment Room 1',
          type: 'Emergency Room',
          area: 200,
          ceilingHeight: 10,
          oxygenOutlets: 2,
          airOutlets: 2,
          vacuumOutlets: 2,
          co2Outlets: 0,
          n2oOutlets: 0,
          pressureRequirement: 'Standard',
          backupRequired: true,
          nfpaCompliance: ['NFPA 99-2021', 'ASHRAE 170'],
          flowRateRequirements: {
            oxygen: 50,
            air: 40,
            vacuum: 30
          }
        },
        {
          name: 'Triage Area',
          type: 'Support Room',
          area: 150,
          ceilingHeight: 10,
          oxygenOutlets: 1,
          airOutlets: 1,
          vacuumOutlets: 1,
          co2Outlets: 0,
          n2oOutlets: 0,
          pressureRequirement: 'Standard',
          backupRequired: false,
          nfpaCompliance: ['ASHRAE 170'],
          flowRateRequirements: {
            oxygen: 25,
            air: 20,
            vacuum: 15
          }
        }
      ],
      equipment: [
        {
          name: 'Emergency Crash Cart',
          category: 'Life Support',
          manufacturer: 'Zoll',
          model: 'R Series Plus',
          quantity: 3,
          unitCost: 25000,
          installationCost: 1000,
          warranty: '3 years',
          maintenanceRequired: true,
          powerRequirement: 'Battery/110V',
          spaceRequirement: 10
        },
        {
          name: 'Emergency Stretcher',
          category: 'General',
          manufacturer: 'Stryker',
          model: 'Performance-PRO XT',
          quantity: 6,
          unitCost: 15000,
          installationCost: 500,
          warranty: '2 years',
          maintenanceRequired: true,
          spaceRequirement: 20
        }
      ],
      specialRequirements: [
        'Rapid patient throughput design',
        'Decontamination capability',
        'Security systems',
        'Communication systems',
        'Helicopter landing compatibility'
      ],
      complianceStandards: [
        'NFPA 99-2021',
        'ASHRAE 170',
        'FGI Guidelines',
        'Joint Commission Standards',
        'EMTALA Compliance'
      ],
      projectData: {
        facilityType: 'Emergency Department',
        specialRequirements: 'High-acuity emergency care with trauma capability',
        numberOfRooms: 3
      },
      medicalGasRequirements: {
        totalPressure: 180,
        redundancyLevel: 'Triple',
        centralSupplyRequired: true,
        backupSystems: ['Liquid oxygen backup', 'Emergency air compressor', 'Portable backup units']
      },
      hvacRequirements: {
        airChangesPerHour: 15,
        filtrationLevel: 'MERV 14 minimum',
        pressurization: 'Positive',
        temperatureRange: '68-72°F',
        humidityRange: '40-60% RH'
      },
      electricalRequirements: {
        normalPower: '480V/277V, 3-phase',
        emergencyPower: 'Generator with 10-second transfer',
        isolatedPower: true,
        groundingRequirements: ['Isolated ground system', 'Emergency power outlets']
      }
    });

    // Outpatient Surgery Center Template
    this.templates.set('outpatient-surgery', {
      id: 'outpatient-surgery',
      name: 'Outpatient Surgery Center',
      type: 'Ambulatory Surgery',
      description: 'Modern outpatient surgical facility for same-day procedures',
      category: 'Surgery Center',
      squareFootage: 6000,
      estimatedCost: 1800000,
      constructionTime: '12-18',
      rooms: [
        {
          name: 'OR 1 - General',
          type: 'Operating Room',
          area: 400,
          ceilingHeight: 10,
          oxygenOutlets: 4,
          airOutlets: 3,
          vacuumOutlets: 4,
          co2Outlets: 1,
          n2oOutlets: 2,
          pressureRequirement: 'Standard',
          backupRequired: true,
          nfpaCompliance: ['NFPA 99-2021', 'ASHRAE 170'],
          flowRateRequirements: {
            oxygen: 80,
            air: 60,
            vacuum: 50
          }
        },
        {
          name: 'Recovery Bay',
          type: 'Recovery Room',
          area: 300,
          ceilingHeight: 10,
          oxygenOutlets: 6,
          airOutlets: 3,
          vacuumOutlets: 6,
          co2Outlets: 0,
          n2oOutlets: 0,
          pressureRequirement: 'Standard',
          backupRequired: true,
          nfpaCompliance: ['NFPA 99-2021', 'ASHRAE 170'],
          flowRateRequirements: {
            oxygen: 40,
            air: 30,
            vacuum: 25
          }
        }
      ],
      equipment: [
        {
          name: 'Surgical Table - Standard',
          category: 'Surgical',
          manufacturer: 'Steris',
          model: 'Amsco 2080 RL',
          quantity: 1,
          unitCost: 65000,
          installationCost: 3000,
          warranty: '5 years',
          maintenanceRequired: true,
          powerRequirement: '110V',
          spaceRequirement: 20
        }
      ],
      specialRequirements: [
        'Efficient patient flow',
        'Pre-op and post-op areas',
        'Sterile processing',
        'Consultation rooms'
      ],
      complianceStandards: [
        'NFPA 99-2021',
        'ASHRAE 170',
        'FGI Guidelines',
        'CMS ASC Standards'
      ],
      projectData: {
        facilityType: 'Surgery Center',
        specialRequirements: 'Outpatient surgical procedures with quick recovery',
        numberOfRooms: 2
      },
      medicalGasRequirements: {
        totalPressure: 150,
        redundancyLevel: 'Dual',
        centralSupplyRequired: true,
        backupSystems: ['Cylinder manifold backup']
      },
      hvacRequirements: {
        airChangesPerHour: 20,
        filtrationLevel: 'HEPA in OR areas',
        pressurization: 'Positive',
        temperatureRange: '68-75°F',
        humidityRange: '45-60% RH'
      },
      electricalRequirements: {
        normalPower: '208V/120V, 3-phase',
        emergencyPower: 'Generator backup',
        isolatedPower: true,
        groundingRequirements: ['Isolated power in OR', 'Hospital grade outlets']
      }
    });
  }

  // Get all available templates
  getAllTemplates(): FacilityTemplate[] {
    return Array.from(this.templates.values());
  }

  // Get templates by category
  getTemplatesByCategory(category: string): FacilityTemplate[] {
    return Array.from(this.templates.values()).filter(template =>
      template.category.toLowerCase().includes(category.toLowerCase())
    );
  }

  // Get a specific template by ID
  getTemplate(id: string): FacilityTemplate | undefined {
    return this.templates.get(id);
  }

  // Create a new estimate from template
  createEstimateFromTemplate(templateId: string, customizations?: Partial<FacilityTemplate>) {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const estimateData = {
      id: Math.random().toString(36).substr(2, 9),
      projectName: customizations?.name || `${template.name} Project`,
      facilityType: template.type,
      clientName: '',
      location: '',
      projectData: {
        ...template.projectData,
        projectName: customizations?.name || `${template.name} Project`,
        squareFootage: customizations?.squareFootage || template.squareFootage,
        ...customizations?.projectData
      },
      rooms: template.rooms.map(room => ({ ...room })),
      equipment: template.equipment.map(eq => ({ ...eq })),
      costs: this.calculateTemplateCosts(template),
      totalCost: 0, // Will be calculated
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      status: 'draft' as const,
      version: 1,
      versions: [],
      auditTrail: [{
        action: 'Created from Template',
        timestamp: new Date().toISOString(),
        user: 'System',
        details: `Created from ${template.name} template`
      }],
      templateId: templateId,
      specialRequirements: template.specialRequirements,
      complianceStandards: template.complianceStandards,
      medicalGasRequirements: template.medicalGasRequirements,
      hvacRequirements: template.hvacRequirements,
      electricalRequirements: template.electricalRequirements
    };

    // Calculate total cost
    const costs = this.calculateTemplateCosts(template);
    estimateData.costs = costs;
    estimateData.totalCost = costs.total;

    return estimateData;
  }

  // Calculate costs for a template
  private calculateTemplateCosts(template: FacilityTemplate) {
    const equipmentCost = template.equipment.reduce((sum, item) =>
      sum + (item.quantity * item.unitCost), 0
    );

    const installationCost = template.equipment.reduce((sum, item) =>
      sum + item.installationCost, 0
    );

    // Enhanced medical gas calculations
    let medicalGasCost = 0;
    template.rooms.forEach(room => {
      const outletCosts = {
        oxygen: room.oxygenOutlets * 1500,
        air: room.airOutlets * 1200,
        vacuum: room.vacuumOutlets * 1400,
        co2: room.co2Outlets * 1300,
        n2o: room.n2oOutlets * 1350
      };

      const pipingCost = room.area * 30; // Higher cost for template-based systems

      const complexityMultipliers = {
        'Operating Room': 1.5,
        'ICU': 1.3,
        'Emergency Room': 1.4,
        'Recovery Room': 1.1,
        'Patient Room': 1.0,
        'Support Room': 0.8
      };

      const multiplier = complexityMultipliers[room.type as keyof typeof complexityMultipliers] || 1.0;
      const roomTotal = (Object.values(outletCosts).reduce((sum: number, cost: number) => sum + cost, 0) + pipingCost) * multiplier;

      medicalGasCost += roomTotal;
    });

    // Add template-specific system costs
    if (template.medicalGasRequirements.redundancyLevel === 'Triple') {
      medicalGasCost *= 1.5;
    } else if (template.medicalGasRequirements.redundancyLevel === 'Dual') {
      medicalGasCost *= 1.2;
    }

    const subtotal = equipmentCost + installationCost + medicalGasCost;
    const complianceCost = subtotal * 0.18; // Higher compliance cost for templates
    const contingencyCost = subtotal * 0.12; // Higher contingency for complex systems

    const total = subtotal + complianceCost + contingencyCost;

    return {
      equipment: equipmentCost,
      installation: installationCost,
      medicalGas: medicalGasCost,
      compliance: complianceCost,
      contingency: contingencyCost,
      total
    };
  }

  // Save a custom template
  saveCustomTemplate(template: FacilityTemplate): boolean {
    try {
      // In a real implementation, this would save to a database
      this.templates.set(template.id, template);

      // Only save to localStorage on client side
      if (typeof window !== 'undefined') {
        const customTemplates = JSON.parse(localStorage.getItem('ds-arch-custom-templates') || '[]');
        const existingIndex = customTemplates.findIndex((t: any) => t.id === template.id);

        if (existingIndex >= 0) {
          customTemplates[existingIndex] = template;
        } else {
          customTemplates.push(template);
        }

        localStorage.setItem('ds-arch-custom-templates', JSON.stringify(customTemplates));
      }
      return true;
    } catch (error) {
      console.error('Error saving custom template:', error);
      return false;
    }
  }

  // Load custom templates
  loadCustomTemplates(): void {
    // Only run on client side
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const customTemplates = JSON.parse(localStorage.getItem('ds-arch-custom-templates') || '[]');
      customTemplates.forEach((template: FacilityTemplate) => {
        this.templates.set(template.id, template);
      });
    } catch (error) {
      console.error('Error loading custom templates:', error);
    }
  }

  // Search templates
  searchTemplates(query: string): FacilityTemplate[] {
    const searchTerm = query.toLowerCase();
    return Array.from(this.templates.values()).filter(template =>
      template.name.toLowerCase().includes(searchTerm) ||
      template.description.toLowerCase().includes(searchTerm) ||
      template.type.toLowerCase().includes(searchTerm) ||
      template.category.toLowerCase().includes(searchTerm)
    );
  }

  // Get template compliance information
  getTemplateCompliance(templateId: string): string[] {
    const template = this.getTemplate(templateId);
    return template?.complianceStandards || [];
  }

  // Validate template requirements
  validateTemplate(template: FacilityTemplate): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!template.name || template.name.trim().length === 0) {
      errors.push('Template name is required');
    }

    if (!template.rooms || template.rooms.length === 0) {
      errors.push('At least one room is required');
    }

    if (template.squareFootage <= 0) {
      errors.push('Square footage must be positive');
    }

    // Validate medical gas requirements
    template.rooms.forEach((room, index) => {
      if (room.area <= 0) {
        errors.push(`Room ${index + 1}: Area must be positive`);
      }

      const totalOutlets = room.oxygenOutlets + room.airOutlets + room.vacuumOutlets +
                          room.co2Outlets + room.n2oOutlets;
      if (totalOutlets === 0) {
        errors.push(`Room ${index + 1}: At least one medical gas outlet is recommended`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export const templateService = new TemplateService();

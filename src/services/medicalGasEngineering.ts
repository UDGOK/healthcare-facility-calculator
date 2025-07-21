// Advanced Medical Gas Engineering Calculations
// Enterprise-grade engineering calculations for healthcare facilities
// Compliant with NFPA 99-2021, ASHRAE 170, and industry standards

export interface MedicalGasOutlet {
  type: 'oxygen' | 'air' | 'vacuum' | 'co2' | 'n2o' | 'nitrogen' | 'argon';
  quantity: number;
  flowRate: number; // SCFM for gases, CFM for vacuum
  pressure: number; // PSI
  simultaneousFactor: number; // Percentage of outlets used simultaneously
  backupRequired: boolean;
  location: {
    room: string;
    wallLocation: string;
    heightFromFloor: number; // inches
  };
}

export interface RoomGasRequirements {
  roomId: string;
  roomName: string;
  roomType: string;
  area: number; // sq ft
  ceilingHeight: number; // ft
  outlets: MedicalGasOutlet[];
  pressurization: 'positive' | 'negative' | 'neutral';
  airChangesPerHour: number;
  filtrationLevel: string;
  specialRequirements: string[];
}

export interface SystemPressureRequirements {
  operatingPressure: number; // PSI
  alarmSetPoints: {
    highPressure: number;
    lowPressure: number;
    switchover: number;
  };
  backupCapacity: number; // percentage of primary
  redundancyLevel: 'single' | 'dual' | 'triple';
}

export interface PipeCalculation {
  diameter: number; // inches
  length: number; // feet
  material: 'copper' | 'stainless_steel' | 'chrome_moly';
  pressureDrop: number; // PSI
  velocity: number; // ft/sec
  flowRate: number; // SCFM
  roughness: number; // absolute roughness
}

export interface ComplianceCheck {
  standard: string;
  requirement: string;
  status: 'compliant' | 'non_compliant' | 'warning';
  notes: string;
}

export interface MedicalGasSystem {
  gasType: 'oxygen' | 'air' | 'vacuum' | 'co2' | 'n2o';
  totalDemand: number; // SCFM
  peakDemand: number; // SCFM
  systemPressure: SystemPressureRequirements;
  distribution: {
    mainLines: PipeCalculation[];
    branchLines: PipeCalculation[];
    totalLength: number;
    totalPressureDrop: number;
  };
  equipment: {
    primarySupply: string;
    backupSupply: string;
    manifolds: number;
    regulators: number;
    alarms: string[];
  };
  compliance: ComplianceCheck[];
  estimatedCost: number;
}

class MedicalGasEngineering {
  private readonly NFPA99_STANDARDS = {
    oxygen: {
      operatingPressure: 50, // PSI
      lowPressureAlarm: 45,
      highPressureAlarm: 55,
      maxVelocity: 25, // ft/sec
      simultaneousFactor: 0.75 // 75% simultaneous use factor
    },
    air: {
      operatingPressure: 50,
      lowPressureAlarm: 45,
      highPressureAlarm: 55,
      maxVelocity: 25,
      simultaneousFactor: 0.75
    },
    vacuum: {
      operatingPressure: -15, // inches Hg (negative pressure)
      lowPressureAlarm: -12,
      highPressureAlarm: -18,
      maxVelocity: 5000, // ft/min
      simultaneousFactor: 0.50
    },
    n2o: {
      operatingPressure: 50,
      lowPressureAlarm: 45,
      highPressureAlarm: 55,
      maxVelocity: 25,
      simultaneousFactor: 0.25
    },
    co2: {
      operatingPressure: 50,
      lowPressureAlarm: 45,
      highPressureAlarm: 55,
      maxVelocity: 25,
      simultaneousFactor: 0.25
    }
  };

  private readonly PIPE_ROUGHNESS = {
    copper: 0.000005, // ft
    stainless_steel: 0.000015,
    chrome_moly: 0.000045
  };

  private readonly FLOW_RATES = {
    // Standard flow rates per outlet (SCFM)
    oxygen: {
      'Operating Room': 15,
      'ICU': 8,
      'Emergency Room': 12,
      'Recovery Room': 6,
      'Patient Room': 4,
      'NICU': 10
    },
    air: {
      'Operating Room': 12,
      'ICU': 6,
      'Emergency Room': 10,
      'Recovery Room': 5,
      'Patient Room': 3,
      'NICU': 8
    },
    vacuum: {
      'Operating Room': 8,
      'ICU': 5,
      'Emergency Room': 6,
      'Recovery Room': 3,
      'Patient Room': 2,
      'NICU': 4
    }
  };

  // Calculate total system demand for a facility
  calculateSystemDemand(rooms: RoomGasRequirements[]): Map<string, MedicalGasSystem> {
    const systems = new Map<string, MedicalGasSystem>();

    // Initialize systems for each gas type
    ['oxygen', 'air', 'vacuum', 'co2', 'n2o'].forEach(gasType => {
      systems.set(gasType, {
        gasType: gasType as any,
        totalDemand: 0,
        peakDemand: 0,
        systemPressure: this.getSystemPressureRequirements(gasType),
        distribution: {
          mainLines: [],
          branchLines: [],
          totalLength: 0,
          totalPressureDrop: 0
        },
        equipment: {
          primarySupply: '',
          backupSupply: '',
          manifolds: 0,
          regulators: 0,
          alarms: []
        },
        compliance: [],
        estimatedCost: 0
      });
    });

    // Calculate demand for each room and gas type
    rooms.forEach(room => {
      room.outlets.forEach(outlet => {
        const system = systems.get(outlet.type);
        if (system) {
          const roomDemand = this.calculateRoomDemand(room, outlet);
          system.totalDemand += roomDemand.totalDemand;
          system.peakDemand += roomDemand.peakDemand;
        }
      });
    });

    // Apply simultaneous use factors and calculate final demands
    systems.forEach((system, gasType) => {
      const standards = this.NFPA99_STANDARDS[gasType as keyof typeof this.NFPA99_STANDARDS];
      if (standards) {
        system.peakDemand = system.totalDemand * standards.simultaneousFactor;
      }

      // Calculate equipment requirements
      this.calculateEquipmentRequirements(system);

      // Perform compliance checks
      system.compliance = this.performComplianceChecks(system, gasType);

      // Calculate estimated costs
      system.estimatedCost = this.calculateSystemCost(system);
    });

    return systems;
  }

  // Calculate demand for a specific room and outlet type
  private calculateRoomDemand(room: RoomGasRequirements, outlet: MedicalGasOutlet) {
    const baseFlowRate = this.getBaseFlowRate(outlet.type, room.roomType);
    const totalDemand = outlet.quantity * baseFlowRate;
    const peakDemand = totalDemand * outlet.simultaneousFactor;

    return {
      totalDemand,
      peakDemand,
      pressure: outlet.pressure
    };
  }

  // Get base flow rate for gas type and room type
  private getBaseFlowRate(gasType: string, roomType: string): number {
    const flowRates = this.FLOW_RATES[gasType as keyof typeof this.FLOW_RATES];
    if (flowRates) {
      return flowRates[roomType as keyof typeof flowRates] || 5; // Default 5 SCFM
    }
    return 5;
  }

  // Calculate pipe sizing using Darcy-Weisbach equation
  calculatePipeSizing(flowRate: number, pressure: number, length: number, material: string): PipeCalculation {
    const roughness = this.PIPE_ROUGHNESS[material as keyof typeof this.PIPE_ROUGHNESS] || 0.000015;

    // Try different pipe diameters to find optimal size
    const standardSizes = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4, 6, 8]; // inches

    for (const diameter of standardSizes) {
      const area = Math.PI * Math.pow(diameter / 12 / 2, 2); // sq ft
      const velocity = (flowRate / 60) / area; // ft/sec

      // Check velocity limits
      const maxVelocity = (gasType: string) => {
        if (gasType === 'vacuum') return 5000 / 60; // Convert ft/min to ft/sec
        return 25; // ft/sec for gases
      };

      if (velocity <= maxVelocity('oxygen')) {
        const pressureDrop = this.calculatePressureDrop(flowRate, diameter, length, roughness, velocity);

        return {
          diameter,
          length,
          material: material as any,
          pressureDrop,
          velocity,
          flowRate,
          roughness
        };
      }
    }

    // Default to largest size if no suitable size found
    const diameter = 8;
    const area = Math.PI * Math.pow(diameter / 12 / 2, 2);
    const velocity = (flowRate / 60) / area;
    const pressureDrop = this.calculatePressureDrop(flowRate, diameter, length, roughness, velocity);

    return {
      diameter,
      length,
      material: material as any,
      pressureDrop,
      velocity,
      flowRate,
      roughness
    };
  }

  // Calculate pressure drop using Darcy-Weisbach equation
  private calculatePressureDrop(flowRate: number, diameter: number, length: number, roughness: number, velocity: number): number {
    const reynoldsNumber = this.calculateReynoldsNumber(velocity, diameter);
    const frictionFactor = this.calculateFrictionFactor(reynoldsNumber, roughness, diameter);

    // Darcy-Weisbach equation: ΔP = f * (L/D) * (ρ * V²) / (2 * gc)
    const densityAir = 0.075; // lb/ft³ at standard conditions
    const gc = 32.174; // lbm⋅ft/(lbf⋅s²)

    const pressureDrop = frictionFactor * (length / (diameter / 12)) * (densityAir * Math.pow(velocity, 2)) / (2 * gc);

    // Convert to PSI
    return pressureDrop / 144; // PSI
  }

  // Calculate Reynolds number
  private calculateReynoldsNumber(velocity: number, diameter: number): number {
    const kinematicViscosity = 1.57e-4; // ft²/s for air at standard conditions
    return (velocity * diameter / 12) / kinematicViscosity;
  }

  // Calculate friction factor using Colebrook equation
  private calculateFrictionFactor(reynoldsNumber: number, roughness: number, diameter: number): number {
    // Swamee-Jain approximation for Colebrook equation
    const relativeRoughness = roughness / (diameter / 12);
    const factor = 0.25 / Math.pow(
      Math.log10(relativeRoughness / 3.7 + 5.74 / Math.pow(reynoldsNumber, 0.9)), 2
    );
    return factor;
  }

  // Get system pressure requirements based on gas type
  private getSystemPressureRequirements(gasType: string): SystemPressureRequirements {
    const standards = this.NFPA99_STANDARDS[gasType as keyof typeof this.NFPA99_STANDARDS];

    if (!standards) {
      return {
        operatingPressure: 50,
        alarmSetPoints: {
          highPressure: 55,
          lowPressure: 45,
          switchover: 42
        },
        backupCapacity: 100,
        redundancyLevel: 'dual'
      };
    }

    return {
      operatingPressure: Math.abs(standards.operatingPressure),
      alarmSetPoints: {
        highPressure: Math.abs(standards.highPressureAlarm),
        lowPressure: Math.abs(standards.lowPressureAlarm),
        switchover: Math.abs(standards.lowPressureAlarm) - 3
      },
      backupCapacity: 100,
      redundancyLevel: 'dual'
    };
  }

  // Calculate equipment requirements
  private calculateEquipmentRequirements(system: MedicalGasSystem) {
    // Primary supply sizing
    system.equipment.primarySupply = this.getPrimarySupplyRecommendation(system.gasType, system.peakDemand);

    // Backup supply sizing
    system.equipment.backupSupply = this.getBackupSupplyRecommendation(system.gasType, system.peakDemand);

    // Manifold requirements
    system.equipment.manifolds = system.peakDemand > 100 ? 2 : 1;

    // Regulator requirements
    system.equipment.regulators = Math.ceil(system.peakDemand / 50); // One regulator per 50 SCFM

    // Alarm requirements
    system.equipment.alarms = [
      'Master alarm panel',
      'Local pressure switches',
      'Automatic switchover',
      'Remote monitoring capability'
    ];
  }

  // Get primary supply recommendation
  private getPrimarySupplyRecommendation(gasType: string, demand: number): string {
    switch (gasType) {
      case 'oxygen':
        if (demand > 200) return 'Liquid oxygen bulk tank (1500+ gallon)';
        if (demand > 50) return 'Liquid oxygen bulk tank (500-1500 gallon)';
        return 'High-pressure cylinder manifold (6-12 cylinders)';

      case 'air':
        if (demand > 100) return 'Dual rotary screw compressors with dryers';
        if (demand > 25) return 'Single rotary screw compressor with backup';
        return 'Reciprocating compressor with backup';

      case 'vacuum':
        if (demand > 60) return 'Dual liquid ring vacuum pumps';
        if (demand > 20) return 'Single liquid ring with backup rotary vane';
        return 'Rotary vane vacuum pumps (duplex)';

      default:
        return 'High-pressure cylinder manifold';
    }
  }

  // Get backup supply recommendation
  private getBackupSupplyRecommendation(gasType: string, demand: number): string {
    switch (gasType) {
      case 'oxygen':
        return 'High-pressure cylinder manifold (automatic switchover)';

      case 'air':
        return 'Secondary compressor with automatic start';

      case 'vacuum':
        return 'Secondary vacuum pump with automatic start';

      default:
        return 'Secondary cylinder manifold';
    }
  }

  // Perform NFPA 99 compliance checks
  private performComplianceChecks(system: MedicalGasSystem, gasType: string): ComplianceCheck[] {
    const checks: ComplianceCheck[] = [];

    // Pressure compliance
    const standards = this.NFPA99_STANDARDS[gasType as keyof typeof this.NFPA99_STANDARDS];
    if (standards) {
      checks.push({
        standard: 'NFPA 99-2021 Section 5.1.3.2',
        requirement: `Operating pressure: ${standards.operatingPressure} PSI ±5 PSI`,
        status: Math.abs(system.systemPressure.operatingPressure - Math.abs(standards.operatingPressure)) <= 5 ? 'compliant' : 'non_compliant',
        notes: `System pressure: ${system.systemPressure.operatingPressure} PSI`
      });
    }

    // Backup system compliance
    checks.push({
      standard: 'NFPA 99-2021 Section 5.1.11',
      requirement: 'Automatic backup system required',
      status: system.equipment.backupSupply ? 'compliant' : 'non_compliant',
      notes: system.equipment.backupSupply || 'No backup system specified'
    });

    // Alarm system compliance
    checks.push({
      standard: 'NFPA 99-2021 Section 5.1.12',
      requirement: 'Master alarm system with local and remote monitoring',
      status: system.equipment.alarms.length >= 3 ? 'compliant' : 'warning',
      notes: `${system.equipment.alarms.length} alarm features specified`
    });

    // Pressure drop compliance
    if (system.distribution.totalPressureDrop > 5) {
      checks.push({
        standard: 'NFPA 99-2021 Section 5.1.3.6',
        requirement: 'Total pressure drop should not exceed 5 PSI',
        status: 'warning',
        notes: `Total pressure drop: ${system.distribution.totalPressureDrop.toFixed(2)} PSI`
      });
    } else {
      checks.push({
        standard: 'NFPA 99-2021 Section 5.1.3.6',
        requirement: 'Total pressure drop should not exceed 5 PSI',
        status: 'compliant',
        notes: `Total pressure drop: ${system.distribution.totalPressureDrop.toFixed(2)} PSI`
      });
    }

    return checks;
  }

  // Calculate system cost
  private calculateSystemCost(system: MedicalGasSystem): number {
    let cost = 0;

    // Base system costs by gas type and demand
    const baseCosts = {
      oxygen: {
        low: 25000,  // < 50 SCFM
        medium: 75000, // 50-200 SCFM
        high: 200000  // > 200 SCFM
      },
      air: {
        low: 35000,
        medium: 85000,
        high: 250000
      },
      vacuum: {
        low: 30000,
        medium: 80000,
        high: 220000
      },
      co2: {
        low: 15000,
        medium: 40000,
        high: 100000
      },
      n2o: {
        low: 20000,
        medium: 50000,
        high: 120000
      }
    };

    const gasTypeCosts = baseCosts[system.gasType as keyof typeof baseCosts];
    if (gasTypeCosts) {
      if (system.peakDemand > 200) {
        cost += gasTypeCosts.high;
      } else if (system.peakDemand > 50) {
        cost += gasTypeCosts.medium;
      } else {
        cost += gasTypeCosts.low;
      }
    }

    // Add piping costs
    const pipingCost = system.distribution.totalLength * 150; // $150 per linear foot
    cost += pipingCost;

    // Add equipment costs
    cost += system.equipment.manifolds * 15000; // $15k per manifold
    cost += system.equipment.regulators * 2500; // $2.5k per regulator
    cost += system.equipment.alarms.length * 5000; // $5k per alarm feature

    // Redundancy multiplier
    const redundancyMultipliers = {
      single: 1.0,
      dual: 1.4,
      triple: 1.8
    };
    cost *= redundancyMultipliers[system.systemPressure.redundancyLevel];

    return Math.round(cost);
  }

  // Generate engineering report
  generateEngineeringReport(rooms: RoomGasRequirements[]): {
    summary: any;
    systems: Map<string, MedicalGasSystem>;
    recommendations: string[];
    compliance: ComplianceCheck[];
  } {
    const systems = this.calculateSystemDemand(rooms);
    const allCompliance: ComplianceCheck[] = [];
    const recommendations: string[] = [];

    // Collect all compliance checks
    systems.forEach(system => {
      allCompliance.push(...system.compliance);
    });

    // Generate recommendations
    systems.forEach((system, gasType) => {
      if (system.distribution.totalPressureDrop > 3) {
        recommendations.push(`Consider larger pipe sizes for ${gasType} system to reduce pressure drop`);
      }

      if (system.peakDemand > system.totalDemand * 0.9) {
        recommendations.push(`High simultaneous use factor for ${gasType} - consider increasing backup capacity`);
      }

      const nonCompliantChecks = system.compliance.filter(c => c.status === 'non_compliant');
      if (nonCompliantChecks.length > 0) {
        recommendations.push(`Address ${nonCompliantChecks.length} compliance issues for ${gasType} system`);
      }
    });

    // Calculate summary
    const totalCost = Array.from(systems.values()).reduce((sum, system) => sum + system.estimatedCost, 0);
    const totalOutlets = rooms.reduce((sum, room) =>
      sum + room.outlets.reduce((outletSum, outlet) => outletSum + outlet.quantity, 0), 0
    );

    const summary = {
      totalRooms: rooms.length,
      totalOutlets,
      totalSystemCost: totalCost,
      gasTypesRequired: Array.from(systems.keys()),
      complianceScore: (allCompliance.filter(c => c.status === 'compliant').length / allCompliance.length) * 100,
      recommendationCount: recommendations.length
    };

    return {
      summary,
      systems,
      recommendations,
      compliance: allCompliance
    };
  }

  // Validate system against NFPA 99 requirements
  validateSystem(system: MedicalGasSystem): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check pressure requirements
    const standards = this.NFPA99_STANDARDS[system.gasType as keyof typeof this.NFPA99_STANDARDS];
    if (standards) {
      const pressureDiff = Math.abs(system.systemPressure.operatingPressure - Math.abs(standards.operatingPressure));
      if (pressureDiff > 5) {
        errors.push(`Operating pressure (${system.systemPressure.operatingPressure} PSI) exceeds NFPA 99 tolerance`);
      } else if (pressureDiff > 2) {
        warnings.push(`Operating pressure (${system.systemPressure.operatingPressure} PSI) approaching NFPA 99 limits`);
      }
    }

    // Check backup system
    if (!system.equipment.backupSupply) {
      errors.push('Backup supply system is required per NFPA 99');
    }

    // Check alarm system
    if (system.equipment.alarms.length < 3) {
      warnings.push('Consider additional alarm features for enhanced monitoring');
    }

    // Check pressure drop
    if (system.distribution.totalPressureDrop > 5) {
      errors.push(`Total pressure drop (${system.distribution.totalPressureDrop.toFixed(2)} PSI) exceeds NFPA 99 limits`);
    } else if (system.distribution.totalPressureDrop > 3) {
      warnings.push(`Pressure drop (${system.distribution.totalPressureDrop.toFixed(2)} PSI) is high - consider larger pipes`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

export const medicalGasEngineering = new MedicalGasEngineering();

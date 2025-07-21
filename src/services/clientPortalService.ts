// Enterprise Client Portal Service
// Professional client relationship management for healthcare facility projects

export interface ClientUser {
  id: string;
  email: string;
  companyName: string;
  contactName: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  accountType: 'healthcare_provider' | 'contractor' | 'architect' | 'consultant';
  preferences: {
    communicationMethod: 'email' | 'phone' | 'portal';
    timezone: string;
    language: string;
  };
  createdAt: string;
  lastLogin: string;
  status: 'active' | 'inactive' | 'pending_verification';
  projects: string[];
}

export interface ProjectRequest {
  id: string;
  clientId: string;
  title: string;
  description: string;
  facilityType: 'hospital' | 'surgery_center' | 'clinic' | 'emergency' | 'specialty' | 'other';
  projectType: 'new_construction' | 'renovation' | 'expansion' | 'upgrade';
  timeline: {
    requestedStartDate: string;
    estimatedDuration: number; // months
    criticalMilestones: string[];
  };
  budget: {
    estimatedRange: string;
    fundingSource: 'internal' | 'loan' | 'grant' | 'insurance' | 'mixed';
    approvalRequired: boolean;
  };
  scope: {
    squareFootage: number;
    numberOfRooms: number;
    specialtyAreas: string[];
    medicalGasRequired: boolean;
    hvacUpgrade: boolean;
    electricalUpgrade: boolean;
    structuralWork: boolean;
  };
  compliance: {
    regulatoryRequirements: string[];
    certificationNeeded: string[];
    inspectionRequired: boolean;
  };
  attachments: FileAttachment[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
  assignedTeam: string[];
  createdAt: string;
  lastModified: string;
  dueDate: string;
}

export interface ProjectStatus {
  projectId: string;
  currentPhase: 'planning' | 'design' | 'estimation' | 'approval' | 'construction' | 'testing' | 'completion';
  overallProgress: number; // 0-100
  phases: ProjectPhase[];
  nextMilestone: {
    name: string;
    date: string;
    description: string;
  };
  recentUpdates: ProjectUpdate[];
  teamMembers: TeamMember[];
  documents: ProjectDocument[];
  communications: Communication[];
}

export interface ProjectPhase {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'on_hold' | 'delayed';
  progress: number;
  dependencies: string[];
  deliverables: string[];
  assignedTo: string[];
}

export interface ProjectUpdate {
  id: string;
  timestamp: string;
  author: string;
  type: 'progress' | 'milestone' | 'issue' | 'document' | 'communication';
  title: string;
  description: string;
  attachments?: FileAttachment[];
  visibility: 'client' | 'internal' | 'team';
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  phone?: string;
  expertise: string[];
  avatar?: string;
}

export interface ProjectDocument {
  id: string;
  name: string;
  type: 'estimate' | 'drawing' | 'specification' | 'permit' | 'report' | 'contract' | 'other';
  version: string;
  uploadDate: string;
  uploadedBy: string;
  fileSize: number;
  downloadUrl: string;
  accessLevel: 'public' | 'client' | 'team' | 'admin';
  description?: string;
}

export interface Communication {
  id: string;
  timestamp: string;
  from: string;
  to: string[];
  subject: string;
  message: string;
  type: 'email' | 'note' | 'meeting' | 'call';
  attachments?: FileAttachment[];
  priority: 'low' | 'medium' | 'high';
  status: 'sent' | 'read' | 'replied';
}

export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadDate: string;
  url: string;
}

export interface Notification {
  id: string;
  clientId: string;
  projectId?: string;
  type: 'project_update' | 'milestone_reached' | 'document_shared' | 'message_received' | 'payment_due' | 'system_alert';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionRequired: boolean;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high';
}

export interface ClientDashboardData {
  client: ClientUser;
  activeProjects: ProjectStatus[];
  recentNotifications: Notification[];
  upcomingMilestones: {
    projectId: string;
    projectName: string;
    milestone: string;
    date: string;
  }[];
  quickStats: {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    totalValue: number;
  };
  recentDocuments: ProjectDocument[];
  teamContacts: TeamMember[];
}

class ClientPortalService {
  private clients: Map<string, ClientUser> = new Map();
  private projects: Map<string, ProjectRequest> = new Map();
  private projectStatuses: Map<string, ProjectStatus> = new Map();
  private notifications: Map<string, Notification[]> = new Map();

  constructor() {
    // Only load data on client side
    if (typeof window !== 'undefined') {
      this.loadData();
    }
  }

  // Client Management
  async registerClient(clientData: Omit<ClientUser, 'id' | 'createdAt' | 'lastLogin' | 'status' | 'projects'>): Promise<{ success: boolean; clientId?: string; error?: string }> {
    try {
      // Check if client already exists
      const existingClient = Array.from(this.clients.values()).find(c => c.email === clientData.email);
      if (existingClient) {
        return { success: false, error: 'Client with this email already exists' };
      }

      const clientId = Math.random().toString(36).substr(2, 9);
      const newClient: ClientUser = {
        ...clientData,
        id: clientId,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        status: 'pending_verification',
        projects: []
      };

      this.clients.set(clientId, newClient);
      this.saveData();

      // Send welcome notification
      await this.addNotification(clientId, {
        type: 'system_alert',
        title: 'Welcome to DS Arch Client Portal',
        message: 'Your account has been created successfully. Please verify your email to access all features.',
        priority: 'medium',
        actionRequired: true,
        actionUrl: '/verify-email'
      });

      return { success: true, clientId };
    } catch (error) {
      return { success: false, error: 'Failed to register client' };
    }
  }

  async authenticateClient(email: string, password: string): Promise<{ success: boolean; client?: ClientUser; error?: string }> {
    try {
      // In a real implementation, this would verify against a secure database
      const client = Array.from(this.clients.values()).find(c => c.email === email);

      if (!client) {
        return { success: false, error: 'Client not found' };
      }

      if (client.status === 'inactive') {
        return { success: false, error: 'Account is inactive' };
      }

      // Update last login
      client.lastLogin = new Date().toISOString();
      this.clients.set(client.id, client);
      this.saveData();

      return { success: true, client };
    } catch (error) {
      return { success: false, error: 'Authentication failed' };
    }
  }

  // Project Request Management
  async submitProjectRequest(clientId: string, request: Omit<ProjectRequest, 'id' | 'clientId' | 'createdAt' | 'lastModified' | 'status' | 'assignedTeam'>): Promise<{ success: boolean; projectId?: string; error?: string }> {
    try {
      const client = this.clients.get(clientId);
      if (!client) {
        return { success: false, error: 'Client not found' };
      }

      const projectId = Math.random().toString(36).substr(2, 9);
      const newRequest: ProjectRequest = {
        ...request,
        id: projectId,
        clientId,
        status: 'submitted',
        assignedTeam: [],
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      };

      this.projects.set(projectId, newRequest);

      // Add to client's projects
      client.projects.push(projectId);
      this.clients.set(clientId, client);

      // Create initial project status
      const initialStatus: ProjectStatus = {
        projectId,
        currentPhase: 'planning',
        overallProgress: 0,
        phases: this.createDefaultPhases(),
        nextMilestone: {
          name: 'Initial Review',
          date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
          description: 'Project team will review your request and provide initial feedback'
        },
        recentUpdates: [{
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toISOString(),
          author: 'System',
          type: 'progress',
          title: 'Project Request Submitted',
          description: 'Your project request has been received and assigned to our team for review.',
          visibility: 'client'
        }],
        teamMembers: [],
        documents: [],
        communications: []
      };

      this.projectStatuses.set(projectId, initialStatus);

      // Send notification
      await this.addNotification(clientId, {
        type: 'project_update',
        title: 'Project Request Submitted',
        message: `Your project "${request.title}" has been submitted successfully and is under review.`,
        priority: 'medium',
        projectId,
        actionRequired: false
      });

      this.saveData();
      return { success: true, projectId };
    } catch (error) {
      return { success: false, error: 'Failed to submit project request' };
    }
  }

  // Project Status Tracking
  async getProjectStatus(projectId: string): Promise<ProjectStatus | null> {
    return this.projectStatuses.get(projectId) || null;
  }

  async updateProjectStatus(projectId: string, update: Partial<ProjectStatus>, updatedBy: string): Promise<boolean> {
    try {
      const currentStatus = this.projectStatuses.get(projectId);
      if (!currentStatus) {
        return false;
      }

      const updatedStatus = { ...currentStatus, ...update };

      // Add update to recent updates
      const newUpdate: ProjectUpdate = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        author: updatedBy,
        type: 'progress',
        title: 'Project Status Updated',
        description: `Project status has been updated to ${updatedStatus.currentPhase}`,
        visibility: 'client'
      };

      updatedStatus.recentUpdates = [newUpdate, ...updatedStatus.recentUpdates.slice(0, 9)]; // Keep last 10 updates

      this.projectStatuses.set(projectId, updatedStatus);

      // Notify client
      const project = this.projects.get(projectId);
      if (project) {
        await this.addNotification(project.clientId, {
          type: 'project_update',
          title: 'Project Update',
          message: newUpdate.description,
          priority: 'medium',
          projectId,
          actionRequired: false
        });
      }

      this.saveData();
      return true;
    } catch (error) {
      console.error('Failed to update project status:', error);
      return false;
    }
  }

  // Document Management
  async addProjectDocument(projectId: string, document: Omit<ProjectDocument, 'id' | 'uploadDate' | 'uploadedBy'>, uploadedBy: string): Promise<boolean> {
    try {
      const status = this.projectStatuses.get(projectId);
      if (!status) {
        return false;
      }

      const newDocument: ProjectDocument = {
        ...document,
        id: Math.random().toString(36).substr(2, 9),
        uploadDate: new Date().toISOString(),
        uploadedBy
      };

      status.documents.push(newDocument);

      // Add update
      const update: ProjectUpdate = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        author: uploadedBy,
        type: 'document',
        title: 'New Document Added',
        description: `Document "${document.name}" has been added to your project`,
        visibility: 'client'
      };

      status.recentUpdates = [update, ...status.recentUpdates.slice(0, 9)];
      this.projectStatuses.set(projectId, status);

      // Notify client
      const project = this.projects.get(projectId);
      if (project) {
        await this.addNotification(project.clientId, {
          type: 'document_shared',
          title: 'New Document Available',
          message: `A new document "${document.name}" has been shared with you`,
          priority: 'medium',
          projectId,
          actionRequired: false
        });
      }

      this.saveData();
      return true;
    } catch (error) {
      console.error('Failed to add project document:', error);
      return false;
    }
  }

  // Communication Management
  async addCommunication(projectId: string, communication: Omit<Communication, 'id' | 'timestamp' | 'status'>): Promise<boolean> {
    try {
      const status = this.projectStatuses.get(projectId);
      if (!status) {
        return false;
      }

      const newCommunication: Communication = {
        ...communication,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        status: 'sent'
      };

      status.communications.push(newCommunication);
      this.projectStatuses.set(projectId, status);

      // Add update
      const update: ProjectUpdate = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        author: communication.from,
        type: 'communication',
        title: 'New Message',
        description: `New ${communication.type}: ${communication.subject}`,
        visibility: 'client'
      };

      status.recentUpdates = [update, ...status.recentUpdates.slice(0, 9)];

      // Notify recipient if it's a client
      const project = this.projects.get(projectId);
      if (project && communication.to.includes(project.clientId)) {
        await this.addNotification(project.clientId, {
          type: 'message_received',
          title: 'New Message',
          message: `You have received a new message regarding "${project.title}"`,
          priority: communication.priority === 'high' ? 'high' : 'medium',
          projectId,
          actionRequired: true,
          actionUrl: `/projects/${projectId}/communications`
        });
      }

      this.saveData();
      return true;
    } catch (error) {
      console.error('Failed to add communication:', error);
      return false;
    }
  }

  // Dashboard Data
  async getClientDashboard(clientId: string): Promise<ClientDashboardData | null> {
    try {
      const client = this.clients.get(clientId);
      if (!client) {
        return null;
      }

      const activeProjects = client.projects
        .map(projectId => this.projectStatuses.get(projectId))
        .filter(status => status && status.currentPhase !== 'completion') as ProjectStatus[];

      const recentNotifications = (this.notifications.get(clientId) || [])
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5);

      const upcomingMilestones = activeProjects
        .map(status => {
          const project = this.projects.get(status.projectId);
          return {
            projectId: status.projectId,
            projectName: project?.title || 'Unknown Project',
            milestone: status.nextMilestone.name,
            date: status.nextMilestone.date
          };
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 3);

      const allProjectStatuses = client.projects
        .map(projectId => this.projectStatuses.get(projectId))
        .filter(Boolean) as ProjectStatus[];

      const quickStats = {
        totalProjects: client.projects.length,
        activeProjects: activeProjects.length,
        completedProjects: allProjectStatuses.filter(s => s.currentPhase === 'completion').length,
        totalValue: 0 // Would be calculated from actual project values
      };

      const recentDocuments = activeProjects
        .flatMap(status => status.documents)
        .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())
        .slice(0, 5);

      const teamContacts = activeProjects
        .flatMap(status => status.teamMembers)
        .filter((member, index, arr) => arr.findIndex(m => m.id === member.id) === index) // Remove duplicates
        .slice(0, 10);

      return {
        client,
        activeProjects,
        recentNotifications,
        upcomingMilestones,
        quickStats,
        recentDocuments,
        teamContacts
      };
    } catch (error) {
      console.error('Failed to get client dashboard:', error);
      return null;
    }
  }

  // Notification Management
  private async addNotification(clientId: string, notification: Omit<Notification, 'id' | 'clientId' | 'timestamp' | 'read'>): Promise<void> {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      clientId,
      timestamp: new Date().toISOString(),
      read: false
    };

    const clientNotifications = this.notifications.get(clientId) || [];
    clientNotifications.unshift(newNotification);

    // Keep only last 50 notifications
    this.notifications.set(clientId, clientNotifications.slice(0, 50));
  }

  async markNotificationAsRead(clientId: string, notificationId: string): Promise<boolean> {
    const notifications = this.notifications.get(clientId) || [];
    const notification = notifications.find(n => n.id === notificationId);

    if (notification) {
      notification.read = true;
      this.notifications.set(clientId, notifications);
      this.saveData();
      return true;
    }

    return false;
  }

  // Default project phases
  private createDefaultPhases(): ProjectPhase[] {
    return [
      {
        id: 'planning',
        name: 'Planning & Review',
        description: 'Initial project review and planning phase',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'in_progress',
        progress: 10,
        dependencies: [],
        deliverables: ['Project scope document', 'Initial timeline'],
        assignedTo: []
      },
      {
        id: 'design',
        name: 'Design Development',
        description: 'Detailed design and engineering phase',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'not_started',
        progress: 0,
        dependencies: ['planning'],
        deliverables: ['Design drawings', 'Engineering specifications'],
        assignedTo: []
      },
      {
        id: 'estimation',
        name: 'Cost Estimation',
        description: 'Detailed cost estimation and proposal preparation',
        startDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'not_started',
        progress: 0,
        dependencies: ['design'],
        deliverables: ['Cost estimate', 'Project proposal'],
        assignedTo: []
      },
      {
        id: 'approval',
        name: 'Client Approval',
        description: 'Client review and approval process',
        startDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'not_started',
        progress: 0,
        dependencies: ['estimation'],
        deliverables: ['Signed contract', 'Project authorization'],
        assignedTo: []
      }
    ];
  }

  // Data persistence
  private saveData(): void {
    // Only run on client side
    if (typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.setItem('ds-arch-clients', JSON.stringify(Array.from(this.clients.entries())));
      localStorage.setItem('ds-arch-client-projects', JSON.stringify(Array.from(this.projects.entries())));
      localStorage.setItem('ds-arch-project-statuses', JSON.stringify(Array.from(this.projectStatuses.entries())));
      localStorage.setItem('ds-arch-client-notifications', JSON.stringify(Array.from(this.notifications.entries())));
    } catch (error) {
      console.error('Failed to save client portal data:', error);
    }
  }

  private loadData(): void {
    // Only run on client side
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const clientsData = localStorage.getItem('ds-arch-clients');
      if (clientsData) {
        this.clients = new Map(JSON.parse(clientsData));
      }

      const projectsData = localStorage.getItem('ds-arch-client-projects');
      if (projectsData) {
        this.projects = new Map(JSON.parse(projectsData));
      }

      const statusesData = localStorage.getItem('ds-arch-project-statuses');
      if (statusesData) {
        this.projectStatuses = new Map(JSON.parse(statusesData));
      }

      const notificationsData = localStorage.getItem('ds-arch-client-notifications');
      if (notificationsData) {
        this.notifications = new Map(JSON.parse(notificationsData));
      }
    } catch (error) {
      console.error('Failed to load client portal data:', error);
    }
  }

  // Public API methods
  getClient(clientId: string): ClientUser | undefined {
    return this.clients.get(clientId);
  }

  getProject(projectId: string): ProjectRequest | undefined {
    return this.projects.get(projectId);
  }

  getClientProjects(clientId: string): ProjectRequest[] {
    const client = this.clients.get(clientId);
    if (!client) return [];

    return client.projects
      .map(projectId => this.projects.get(projectId))
      .filter(Boolean) as ProjectRequest[];
  }

  getClientNotifications(clientId: string): Notification[] {
    return this.notifications.get(clientId) || [];
  }
}

export const clientPortalService = new ClientPortalService();

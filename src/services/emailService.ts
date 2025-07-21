// Email service for sending estimates to clients
// In a production environment, this would integrate with services like SendGrid, Mailgun, or AWS SES

export interface EmailTemplate {
  to: string;
  subject: string;
  htmlContent: string;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType: string;
  }>;
}

export interface EstimateEmailData {
  clientEmail: string;
  clientName: string;
  projectName: string;
  facilityType: string;
  totalCost: number;
  estimateUrl: string;
  senderName: string;
  senderEmail: string;
}

class EmailService {
  private apiKey: string | null = null;
  private baseUrl: string = 'https://api.emailservice.com'; // Mock URL

  constructor() {
    // In production, this would come from environment variables
    this.apiKey = process.env.NEXT_PUBLIC_EMAIL_API_KEY || null;
  }

  async sendEstimateEmail(data: EstimateEmailData): Promise<{ success: boolean; message: string }> {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // In production, this would make a real API call to your email service
      // For demo purposes, we'll simulate a successful send

      const emailTemplate = this.generateEstimateEmailTemplate(data);

      // Mock email sending logic
      if (this.isValidEmail(data.clientEmail)) {
        // Store sent email in localStorage for demo purposes
        const sentEmails = JSON.parse(localStorage.getItem('ds-arch-sent-emails') || '[]');
        sentEmails.push({
          id: Math.random().toString(36).substr(2, 9),
          to: data.clientEmail,
          subject: emailTemplate.subject,
          sentAt: new Date().toISOString(),
          status: 'sent',
          projectName: data.projectName,
          senderName: data.senderName
        });
        localStorage.setItem('ds-arch-sent-emails', JSON.stringify(sentEmails));

        return {
          success: true,
          message: `Estimate successfully sent to ${data.clientEmail}`
        };
      } else {
        return {
          success: false,
          message: 'Invalid email address provided'
        };
      }
    } catch (error) {
      console.error('Email sending failed:', error);
      return {
        success: false,
        message: 'Failed to send email. Please try again later.'
      };
    }
  }

  async sendNotificationEmail(to: string, subject: string, message: string): Promise<{ success: boolean; message: string }> {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (this.isValidEmail(to)) {
        const sentEmails = JSON.parse(localStorage.getItem('ds-arch-sent-emails') || '[]');
        sentEmails.push({
          id: Math.random().toString(36).substr(2, 9),
          to,
          subject,
          sentAt: new Date().toISOString(),
          status: 'sent',
          type: 'notification'
        });
        localStorage.setItem('ds-arch-sent-emails', JSON.stringify(sentEmails));

        return {
          success: true,
          message: `Notification sent to ${to}`
        };
      } else {
        return {
          success: false,
          message: 'Invalid email address'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to send notification'
      };
    }
  }

  private generateEstimateEmailTemplate(data: EstimateEmailData): EmailTemplate {
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Medical Facility Cost Estimate</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            color: white;
            padding: 30px;
            border-radius: 10px;
            text-align: center;
            margin-bottom: 30px;
          }
          .content {
            background: #f8fafc;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
          }
          .estimate-summary {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .total-cost {
            font-size: 28px;
            font-weight: bold;
            color: #2563eb;
            text-align: center;
            padding: 20px;
            background: #eff6ff;
            border-radius: 8px;
            margin: 20px 0;
          }
          .button {
            display: inline-block;
            background: #2563eb;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 10px 0;
          }
          .footer {
            text-align: center;
            color: #6b7280;
            font-size: 14px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
          }
          .project-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin: 20px 0;
          }
          .detail-item {
            padding: 10px;
            background: #f1f5f9;
            border-radius: 6px;
          }
          .detail-label {
            font-weight: bold;
            color: #475569;
            font-size: 12px;
            text-transform: uppercase;
            margin-bottom: 5px;
          }
          .detail-value {
            color: #1e293b;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Medical Facility Cost Estimate</h1>
          <p>Professional facility estimation from DS Arch</p>
        </div>

        <div class="content">
          <h2>Dear ${data.clientName},</h2>

          <p>Thank you for your interest in our medical facility cost estimation services. We've prepared a comprehensive estimate for your project.</p>

          <div class="estimate-summary">
            <h3>Project Summary</h3>

            <div class="project-details">
              <div class="detail-item">
                <div class="detail-label">Project Name</div>
                <div class="detail-value">${data.projectName}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Facility Type</div>
                <div class="detail-value">${data.facilityType}</div>
              </div>
            </div>

            <div class="total-cost">
              Total Project Cost: $${data.totalCost.toLocaleString()}
            </div>

            <p style="text-align: center;">
              <a href="${data.estimateUrl}" class="button">View Detailed Estimate</a>
            </p>
          </div>

          <h3>What's Included</h3>
          <ul>
            <li>Complete equipment and materials pricing</li>
            <li>Professional installation and labor costs</li>
            <li>Medical gas systems configuration</li>
            <li>NFPA 99 and regulatory compliance</li>
            <li>10% project contingency</li>
          </ul>

          <h3>Next Steps</h3>
          <p>This estimate is valid for 30 days. To proceed with your project or discuss any modifications, please contact us at your earliest convenience.</p>

          <p>We look forward to working with you on this important project.</p>

          <p>Best regards,<br>
          <strong>${data.senderName}</strong><br>
          ${data.senderEmail}<br>
          DS Arch Medical Cost Estimator</p>
        </div>

        <div class="footer">
          <p>This estimate was generated by DS Arch Medical Cost Estimator</p>
          <p>Visit <a href="https://dsarch.org" style="color: #2563eb;">dsarch.org</a> for more information</p>
        </div>
      </body>
      </html>
    `;

    return {
      to: data.clientEmail,
      subject: `Medical Facility Cost Estimate - ${data.projectName}`,
      htmlContent
    };
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Get sent emails for admin dashboard
  getSentEmails() {
    return JSON.parse(localStorage.getItem('ds-arch-sent-emails') || '[]');
  }

  // Get email analytics
  getEmailAnalytics() {
    const sentEmails = this.getSentEmails();
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return {
      totalSent: sentEmails.length,
      sentThisWeek: sentEmails.filter((email: any) => new Date(email.sentAt) >= lastWeek).length,
      sentThisMonth: sentEmails.filter((email: any) => new Date(email.sentAt) >= lastMonth).length,
      recentEmails: sentEmails.slice(-10).reverse()
    };
  }
}

export const emailService = new EmailService();

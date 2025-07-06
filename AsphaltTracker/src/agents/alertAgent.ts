// Alert Agent
// Intelligent alert processing, routing, and notification management

import { Agent, step } from "@restackio/ai";

export class AlertAgent extends Agent {
  name = "alertAgent";
  
  constructor() {
    super();
  }

  @step()
  async processAlerts(input: {
    alerts: Array<{
      id: string;
      type: string;
      severity: string;
      title: string;
      description: string;
      cameraId?: string;
      timestamp: string;
    }>;
    notificationRules: any;
  }) {
    console.log(`🚨 Alert Agent: Processing ${input.alerts.length} alerts`);
    
    try {
      const processedAlerts = [];

      for (const alert of input.alerts) {
        // Step 1: Classify and enrich alert
        const enrichedAlert = await this.classifyAndEnrichAlert(alert);
        
        // Step 2: Check for duplicates
        const isDuplicate = await this.checkDuplicateAlert(enrichedAlert);
        
        if (!isDuplicate) {
          // Step 3: Determine recipients
          const recipients = await this.determineRecipients(enrichedAlert, input.notificationRules);
          
          // Step 4: Generate notification messages
          const notifications = await this.generateNotificationMessages(enrichedAlert, recipients);
          
          // Step 5: Send notifications
          await this.sendNotifications(notifications);
          
          // Step 6: Log alert
          await this.logAlert(enrichedAlert);
          
          processedAlerts.push({
            ...enrichedAlert,
            recipients,
            notifications: notifications.length,
            status: "processed"
          });
        } else {
          console.log(`⏭️ Skipping duplicate alert: ${alert.id}`);
          processedAlerts.push({
            ...alert,
            status: "duplicate_skipped"
          });
        }
      }

      // Step 7: Update alert dashboard
      await this.updateAlertDashboard(processedAlerts);

      const result = {
        timestamp: new Date().toISOString(),
        status: "completed",
        summary: {
          totalAlerts: input.alerts.length,
          processedAlerts: processedAlerts.filter(a => a.status === "processed").length,
          duplicatesSkipped: processedAlerts.filter(a => a.status === "duplicate_skipped").length,
          criticalAlerts: processedAlerts.filter(a => a.severity === "critical").length,
          notificationsSent: processedAlerts.reduce((sum, a) => sum + (a.notifications || 0), 0)
        },
        alerts: processedAlerts
      };

      console.log(`✅ Alert Agent: Processed ${result.summary.processedAlerts} alerts, sent ${result.summary.notificationsSent} notifications`);
      return result;

    } catch (error) {
      console.error(`❌ Alert Agent: Error processing alerts:`, error);
      return {
        timestamp: new Date().toISOString(),
        status: "failed",
        error: error.message
      };
    }
  }

  @step()
  async classifyAndEnrichAlert(alert: any) {
    console.log(`🔍 Classifying and enriching alert: ${alert.id}`);
    
    // Classify alert priority and urgency
    const classification = this.classifyAlert(alert);
    
    // Enrich with additional context
    const enrichment = await this.enrichAlertContext(alert);
    
    return {
      ...alert,
      classification,
      enrichment,
      processedAt: new Date().toISOString()
    };
  }

  @step()
  async checkDuplicateAlert(alert: any) {
    console.log(`🔄 Checking for duplicate alert: ${alert.id}`);
    
    // Mock duplicate detection - replace with actual database lookup
    // Check for similar alerts in the last 5 minutes
    const recentAlerts = [
      // Mock recent alerts for demonstration
    ];
    
    const isDuplicate = recentAlerts.some(recent => 
      recent.type === alert.type &&
      recent.cameraId === alert.cameraId &&
      (Date.now() - new Date(recent.timestamp).getTime()) < 5 * 60 * 1000 // 5 minutes
    );
    
    return isDuplicate;
  }

  @step()
  async determineRecipients(alert: any, notificationRules: any) {
    console.log(`👥 Determining recipients for alert: ${alert.id}`);
    
    const recipients = [];
    
    // Determine recipients based on alert severity and type
    switch (alert.severity) {
      case "critical":
        recipients.push(
          { type: "email", address: "safety@asphalttracker.com", role: "safety_manager" },
          { type: "sms", number: "+1234567890", role: "site_supervisor" },
          { type: "push", userId: "supervisor_001", role: "site_supervisor" },
          { type: "webhook", url: "https://alerts.asphalttracker.com/critical", role: "system" }
        );
        break;
        
      case "high":
        recipients.push(
          { type: "email", address: "supervisor@asphalttracker.com", role: "site_supervisor" },
          { type: "push", userId: "supervisor_001", role: "site_supervisor" }
        );
        break;
        
      case "medium":
        recipients.push(
          { type: "email", address: "operations@asphalttracker.com", role: "operations" }
        );
        break;
        
      default:
        recipients.push(
          { type: "dashboard", userId: "all", role: "viewer" }
        );
    }

    // Add location-specific recipients
    if (alert.cameraId) {
      const locationRecipients = this.getLocationRecipients(alert.cameraId);
      recipients.push(...locationRecipients);
    }

    return recipients;
  }

  @step()
  async generateNotificationMessages(alert: any, recipients: any[]) {
    console.log(`📝 Generating notification messages for alert: ${alert.id}`);
    
    const notifications = [];
    
    for (const recipient of recipients) {
      let message;
      
      switch (recipient.type) {
        case "email":
          message = {
            type: "email",
            to: recipient.address,
            subject: `🚨 ${alert.severity.toUpperCase()}: ${alert.title}`,
            body: this.generateEmailBody(alert),
            html: this.generateEmailHTML(alert)
          };
          break;
          
        case "sms":
          message = {
            type: "sms",
            to: recipient.number,
            body: `ALERT: ${alert.title} at ${alert.cameraId || 'Unknown location'}. ${alert.description}`
          };
          break;
          
        case "push":
          message = {
            type: "push",
            userId: recipient.userId,
            title: alert.title,
            body: alert.description,
            data: {
              alertId: alert.id,
              cameraId: alert.cameraId,
              severity: alert.severity
            }
          };
          break;
          
        case "webhook":
          message = {
            type: "webhook",
            url: recipient.url,
            payload: {
              alert,
              timestamp: new Date().toISOString(),
              source: "AsphaltTracker"
            }
          };
          break;
          
        case "dashboard":
          message = {
            type: "dashboard",
            userId: recipient.userId,
            alert: alert
          };
          break;
      }
      
      if (message) {
        notifications.push(message);
      }
    }
    
    return notifications;
  }

  @step()
  async sendNotifications(notifications: any[]) {
    console.log(`📤 Sending ${notifications.length} notifications`);
    
    const results = [];
    
    for (const notification of notifications) {
      try {
        let result;
        
        switch (notification.type) {
          case "email":
            result = await this.sendEmail(notification);
            break;
          case "sms":
            result = await this.sendSMS(notification);
            break;
          case "push":
            result = await this.sendPushNotification(notification);
            break;
          case "webhook":
            result = await this.sendWebhook(notification);
            break;
          case "dashboard":
            result = await this.updateDashboard(notification);
            break;
        }
        
        results.push({
          type: notification.type,
          status: "sent",
          result
        });
        
      } catch (error) {
        console.error(`Failed to send ${notification.type} notification:`, error);
        results.push({
          type: notification.type,
          status: "failed",
          error: error.message
        });
      }
    }
    
    return results;
  }

  @step()
  async logAlert(alert: any) {
    console.log(`📋 Logging alert: ${alert.id}`);
    
    // Mock alert logging - replace with actual database insert
    const logEntry = {
      alertId: alert.id,
      type: alert.type,
      severity: alert.severity,
      title: alert.title,
      description: alert.description,
      cameraId: alert.cameraId,
      timestamp: alert.timestamp,
      processedAt: new Date().toISOString(),
      classification: alert.classification,
      enrichment: alert.enrichment
    };
    
    console.log(`💾 Alert logged:`, logEntry);
    return logEntry;
  }

  @step()
  async updateAlertDashboard(alerts: any[]) {
    console.log(`📊 Updating alert dashboard with ${alerts.length} alerts`);
    
    const dashboardUpdate = {
      timestamp: new Date().toISOString(),
      totalAlerts: alerts.length,
      criticalAlerts: alerts.filter(a => a.severity === "critical").length,
      highAlerts: alerts.filter(a => a.severity === "high").length,
      recentAlerts: alerts.slice(0, 10) // Last 10 alerts
    };
    
    // Mock dashboard update - replace with actual WebSocket broadcast
    console.log(`📡 Broadcasting dashboard update:`, dashboardUpdate);
    
    return dashboardUpdate;
  }

  // Helper methods
  private classifyAlert(alert: any) {
    const urgency = this.calculateUrgency(alert);
    const impact = this.calculateImpact(alert);
    
    return {
      urgency,
      impact,
      priority: this.calculatePriority(urgency, impact),
      category: this.categorizeAlert(alert.type),
      escalationLevel: this.determineEscalationLevel(alert.severity)
    };
  }

  private async enrichAlertContext(alert: any) {
    // Mock enrichment - replace with actual context gathering
    return {
      location: {
        name: "Construction Site A",
        coordinates: { lat: 40.7128, lng: -74.0060 },
        weather: "Clear, 72°F"
      },
      equipment: alert.cameraId ? [`Equipment near ${alert.cameraId}`] : [],
      personnel: ["Site Supervisor", "Safety Officer"],
      relatedAlerts: 0,
      historicalFrequency: "Low"
    };
  }

  private calculateUrgency(alert: any): string {
    const severityMap = {
      critical: "high",
      high: "medium", 
      medium: "low",
      low: "low"
    };
    return severityMap[alert.severity] || "low";
  }

  private calculateImpact(alert: any): string {
    if (alert.type.includes("safety") || alert.type.includes("ppe")) {
      return "high";
    }
    if (alert.type.includes("equipment") || alert.type.includes("proximity")) {
      return "medium";
    }
    return "low";
  }

  private calculatePriority(urgency: string, impact: string): number {
    const matrix = {
      "high-high": 1,
      "high-medium": 2,
      "high-low": 3,
      "medium-high": 2,
      "medium-medium": 3,
      "medium-low": 4,
      "low-high": 3,
      "low-medium": 4,
      "low-low": 5
    };
    return matrix[`${urgency}-${impact}`] || 5;
  }

  private categorizeAlert(type: string): string {
    if (type.includes("safety") || type.includes("ppe")) return "safety";
    if (type.includes("equipment")) return "equipment";
    if (type.includes("proximity")) return "proximity";
    if (type.includes("quality")) return "quality";
    return "general";
  }

  private determineEscalationLevel(severity: string): number {
    const levels = { critical: 3, high: 2, medium: 1, low: 0 };
    return levels[severity] || 0;
  }

  private getLocationRecipients(cameraId: string) {
    // Mock location-based recipients
    return [
      { type: "push", userId: `supervisor_${cameraId}`, role: "location_supervisor" }
    ];
  }

  private generateEmailBody(alert: any): string {
    return `
Alert Details:
- Type: ${alert.type}
- Severity: ${alert.severity}
- Location: ${alert.cameraId || 'Unknown'}
- Time: ${alert.timestamp}
- Description: ${alert.description}

Please take immediate action if required.

AsphaltTracker Safety System
    `.trim();
  }

  private generateEmailHTML(alert: any): string {
    return `
<html>
<body>
<h2>🚨 Safety Alert</h2>
<p><strong>Type:</strong> ${alert.type}</p>
<p><strong>Severity:</strong> <span style="color: red;">${alert.severity}</span></p>
<p><strong>Location:</strong> ${alert.cameraId || 'Unknown'}</p>
<p><strong>Time:</strong> ${alert.timestamp}</p>
<p><strong>Description:</strong> ${alert.description}</p>
<hr>
<p><em>AsphaltTracker Safety System</em></p>
</body>
</html>
    `.trim();
  }

  private async sendEmail(notification: any) {
    console.log(`📧 Sending email to ${notification.to}`);
    return { messageId: `email_${Date.now()}`, status: "sent" };
  }

  private async sendSMS(notification: any) {
    console.log(`📱 Sending SMS to ${notification.to}`);
    return { messageId: `sms_${Date.now()}`, status: "sent" };
  }

  private async sendPushNotification(notification: any) {
    console.log(`🔔 Sending push notification to ${notification.userId}`);
    return { messageId: `push_${Date.now()}`, status: "sent" };
  }

  private async sendWebhook(notification: any) {
    console.log(`🔗 Sending webhook to ${notification.url}`);
    return { messageId: `webhook_${Date.now()}`, status: "sent" };
  }

  private async updateDashboard(notification: any) {
    console.log(`📊 Updating dashboard for ${notification.userId}`);
    return { messageId: `dashboard_${Date.now()}`, status: "updated" };
  }
}

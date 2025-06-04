/**
 * Organization detector module for Granola client
 * 
 * This module provides functionality to determine which organization a meeting belongs to
 * based on various signals in the meeting data.
 */

/**
 * Configuration interface for organization detection
 */
export interface OrganizationConfig {
  /** Organization name */
  name: string;
  
  /** Keywords to look for in meeting titles */
  titleKeywords: string[];
  
  /** Email domains associated with this organization */
  emailDomains: string[];
  
  /** Specific email addresses associated with this organization */
  emailAddresses?: string[];
  
  /** Company names associated with this organization */
  companyNames?: string[];
}

/**
 * Configuration for the organization detector
 */
export interface OrganizationDetectorConfig {
  /** List of organizations to detect */
  organizations: OrganizationConfig[];
  
  /** Default organization to use if no match is found */
  defaultOrganization?: string;
  
  /** Whether to use calendar data for detection (default: true) */
  useCalendarData?: boolean;
  
  /** Whether to use people data for detection (default: true) */
  usePeopleData?: boolean;
  
  /** Whether to use title keywords for detection (default: true) */
  useTitleKeywords?: boolean;
}

/**
 * Default/example configuration that can be checked into source control
 * Actual implementations should load their own configuration
 */
export const DEFAULT_CONFIG: OrganizationDetectorConfig = {
  organizations: [
    {
      name: "Organization1",
      titleKeywords: ["org1", "organization1"],
      emailDomains: ["org1.com", "organization1.com"],
      emailAddresses: ["admin@org1.com"],
      companyNames: ["Organization One, Inc."]
    },
    {
      name: "Organization2",
      titleKeywords: ["org2", "organization2"],
      emailDomains: ["org2.org", "organization2.org"],
      emailAddresses: ["admin@org2.org"],
      companyNames: ["Organization Two, LLC"]
    }
  ],
  defaultOrganization: "Unknown",
  useCalendarData: true,
  usePeopleData: true,
  useTitleKeywords: true
};

/**
 * Class for detecting organization affiliation of meetings
 */
export class OrganizationDetector {
  private config: OrganizationDetectorConfig;
  
  /**
   * Create a new OrganizationDetector
   * @param config Configuration for organization detection
   */
  constructor(config: OrganizationDetectorConfig = DEFAULT_CONFIG) {
    this.config = config;
  }
  
  /**
   * Determine the organization for a meeting
   * @param meeting Meeting data object
   * @returns Organization name or undefined if not detected
   */
  public detectOrganization(meeting: any): string | undefined {
    if (!meeting) return this.config.defaultOrganization;
    
    // Detection methods in priority order
    const detectionMethods: {method: () => string | undefined, enabled: boolean}[] = [
      // Calendar data (highest priority)
      { 
        method: () => this.detectFromCalendarData(meeting.google_calendar_event),
        enabled: this.config.useCalendarData !== false 
      },
      // Title-based detection (second priority)
      { 
        method: () => this.detectFromTitle(meeting.title),
        enabled: this.config.useTitleKeywords !== false 
      },
      // People data (lowest priority)
      { 
        method: () => this.detectFromPeopleData(meeting.people),
        enabled: this.config.usePeopleData !== false 
      }
    ];
    
    // Try each method in order of priority
    for (const { method, enabled } of detectionMethods) {
      if (enabled) {
        const org = method();
        if (org) return org;
      }
    }
    
    // Default organization if none detected
    return this.config.defaultOrganization;
  }
  
  /**
   * Detect organization from meeting title
   * @param title Meeting title
   * @returns Organization name or undefined if not detected
   * @private
   */
  private detectFromTitle(title?: string): string | undefined {
    if (!title) return undefined;
    
    const titleLower = title.toLowerCase();
    
    for (const org of this.config.organizations) {
      for (const keyword of org.titleKeywords) {
        if (titleLower.includes(keyword.toLowerCase())) {
          return org.name;
        }
      }
    }
    
    return undefined;
  }
  
  /**
   * Detect organization from calendar data
   * @param calendarEvent Calendar event data
   * @returns Organization name or undefined if not detected
   * @private
   */
  private detectFromCalendarData(calendarEvent?: any): string | undefined {
    if (!calendarEvent) return undefined;
    
    // Check calendar creator email
    if (calendarEvent.creator?.email) {
      const creatorEmail = calendarEvent.creator.email.toLowerCase();
      
      // Check for direct email matches
      for (const org of this.config.organizations) {
        if (org.emailAddresses?.some(email => email.toLowerCase() === creatorEmail)) {
          return org.name;
        }
      }
      
      // Check email domain
      const domain = creatorEmail.split('@')[1];
      for (const org of this.config.organizations) {
        if (org.emailDomains.some(d => domain.includes(d.toLowerCase()))) {
          return org.name;
        }
      }
    }
    
    // Check attendee domains if creator didn't give us a match
    if (Array.isArray(calendarEvent.attendees) && calendarEvent.attendees.length > 0) {
      const domainCounts: Record<string, number> = {};
      
      // Count domains by organization
      for (const attendee of calendarEvent.attendees) {
        if (attendee.email) {
          const email = attendee.email.toLowerCase();
          const domain = email.split('@')[1];
          
          for (const org of this.config.organizations) {
            if (org.emailDomains.some(d => domain.includes(d.toLowerCase()))) {
              domainCounts[org.name] = (domainCounts[org.name] || 0) + 1;
            }
          }
        }
      }
      
      // Find organization with most attendees
      let maxCount = 0;
      let primaryOrg = undefined;
      
      for (const [org, count] of Object.entries(domainCounts)) {
        if (count > maxCount) {
          maxCount = count;
          primaryOrg = org;
        }
      }
      
      if (primaryOrg) return primaryOrg;
    }
    
    return undefined;
  }
  
  /**
   * Detect organization from people data
   * @param people People data from meeting
   * @returns Organization name or undefined if not detected
   * @private
   */
  private detectFromPeopleData(people?: any): string | undefined {
    if (!people) return undefined;
    
    // Check creator's company
    if (people.creator?.details?.company?.name) {
      const companyName = people.creator.details.company.name.toLowerCase();
      
      for (const org of this.config.organizations) {
        if (org.companyNames?.some(name => companyName.includes(name.toLowerCase()))) {
          return org.name;
        }
      }
    }
    
    // Check creator email
    if (people.creator?.email) {
      const creatorEmail = people.creator.email.toLowerCase();
      
      // Check for direct email matches
      for (const org of this.config.organizations) {
        if (org.emailAddresses?.some(email => email.toLowerCase() === creatorEmail)) {
          return org.name;
        }
      }
      
      // Check email domain
      const domain = creatorEmail.split('@')[1];
      for (const org of this.config.organizations) {
        if (org.emailDomains.some(d => domain.includes(d.toLowerCase()))) {
          return org.name;
        }
      }
    }
    
    // Count attendee domains
    if (Array.isArray(people.attendees) && people.attendees.length > 0) {
      const domainCounts: Record<string, number> = {};
      
      // Count domains by organization
      for (const attendee of people.attendees) {
        if (attendee.email) {
          const email = attendee.email.toLowerCase();
          const domain = email.split('@')[1];
          
          for (const org of this.config.organizations) {
            if (org.emailDomains.some(d => domain.includes(d.toLowerCase()))) {
              domainCounts[org.name] = (domainCounts[org.name] || 0) + 1;
            }
          }
        }
      }
      
      // Find organization with most attendees
      let maxCount = 0;
      let primaryOrg = undefined;
      
      for (const [org, count] of Object.entries(domainCounts)) {
        if (count > maxCount) {
          maxCount = count;
          primaryOrg = org;
        }
      }
      
      if (primaryOrg) return primaryOrg;
    }
    
    return undefined;
  }
  
  /**
   * Load configuration from a file
   * @param filePath Path to configuration file
   * @returns New OrganizationDetector with loaded configuration
   * @static
   */
  public static fromFile(filePath: string): OrganizationDetector {
    try {
      // In a Node.js environment:
      if (typeof require === 'function') {
        const fs = require('fs');
        const config = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        return new OrganizationDetector(config);
      }
      
      // In a browser/Bun environment:
      if (typeof Bun !== 'undefined') {
        const file = Bun.file(filePath);
        const config = JSON.parse(file.toString());
        return new OrganizationDetector(config);
      }
      
      console.warn(`Could not load configuration from ${filePath}, using default config`);
      return new OrganizationDetector();
    } catch (error) {
      console.error(`Error loading organization config: ${error}`);
      return new OrganizationDetector();
    }
  }
}

export default OrganizationDetector;
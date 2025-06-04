import { describe, test, expect, beforeEach, mock } from "bun:test";
import { OrganizationDetector, OrganizationDetectorConfig } from "../src/organization-detector";

// Sample test configuration with generic names
const TEST_CONFIG: OrganizationDetectorConfig = {
  organizations: [
    {
      name: "OrgA",
      titleKeywords: ["orga", "organization a"],
      emailDomains: ["orga.com", "organization-a.com"],
      emailAddresses: ["admin@orga.com"],
      companyNames: ["Organization A, Inc."]
    },
    {
      name: "OrgB",
      titleKeywords: ["orgb", "organization b"],
      emailDomains: ["orgb.org", "organization-b.org"],
      emailAddresses: ["admin@orgb.org"],
      companyNames: ["Organization B, LLC"]
    }
  ],
  defaultOrganization: "Unknown",
  useCalendarData: true,
  usePeopleData: true,
  useTitleKeywords: true
};

describe("OrganizationDetector", () => {
  let detector: OrganizationDetector;
  
  beforeEach(() => {
    detector = new OrganizationDetector(TEST_CONFIG);
  });
  
  test("should detect organization from title", () => {
    const meeting = {
      id: "meeting-1",
      title: "Weekly Meeting for Organization A Team"
    };
    
    expect(detector.detectOrganization(meeting)).toBe("OrgA");
  });
  
  test("should detect organization from calendar creator email", () => {
    const meeting = {
      id: "meeting-2",
      title: "Generic Meeting Title",
      google_calendar_event: {
        creator: {
          email: "admin@orga.com"
        }
      }
    };
    
    expect(detector.detectOrganization(meeting)).toBe("OrgA");
  });
  
  test("should detect organization from calendar creator email domain", () => {
    const meeting = {
      id: "meeting-3",
      title: "Generic Meeting Title",
      google_calendar_event: {
        creator: {
          email: "user@organization-a.com"
        }
      }
    };
    
    expect(detector.detectOrganization(meeting)).toBe("OrgA");
  });
  
  test("should detect organization from calendar attendee domains", () => {
    const meeting = {
      id: "meeting-4",
      title: "Generic Meeting Title",
      google_calendar_event: {
        creator: {
          email: "someone@gmail.com" // Non-matching domain
        },
        attendees: [
          { email: "person1@gmail.com" },
          { email: "person2@orgb.org" },
          { email: "person3@orgb.org" },
          { email: "person4@organization-b.org" }
        ]
      }
    };
    
    expect(detector.detectOrganization(meeting)).toBe("OrgB");
  });
  
  test("should detect organization from creator company name", () => {
    const meeting = {
      id: "meeting-5",
      title: "Generic Meeting Title",
      people: {
        creator: {
          name: "John Doe",
          email: "john@gmail.com", // Non-matching domain
          details: {
            company: {
              name: "Organization A, Inc."
            }
          }
        }
      }
    };
    
    expect(detector.detectOrganization(meeting)).toBe("OrgA");
  });
  
  test("should detect organization from people data attendee domains", () => {
    const meeting = {
      id: "meeting-6",
      title: "Generic Meeting Title",
      people: {
        creator: {
          name: "John Doe",
          email: "john@gmail.com" // Non-matching domain
        },
        attendees: [
          { name: "Person 1", email: "person1@gmail.com" },
          { name: "Person 2", email: "person2@orga.com" },
          { name: "Person 3", email: "person3@orga.com" },
          { name: "Person 4", email: "person4@organization-a.com" }
        ]
      }
    };
    
    expect(detector.detectOrganization(meeting)).toBe("OrgA");
  });
  
  test("should use default organization when no match is found", () => {
    const meeting = {
      id: "meeting-7",
      title: "Generic Meeting Title",
      people: {
        creator: {
          name: "John Doe",
          email: "john@gmail.com"
        },
        attendees: [
          { name: "Person 1", email: "person1@gmail.com" },
          { name: "Person 2", email: "person2@outlook.com" }
        ]
      }
    };
    
    expect(detector.detectOrganization(meeting)).toBe("Unknown");
  });
  
  test("should respect detection priority order", () => {
    const meeting = {
      id: "meeting-8",
      // Title would suggest OrgA
      title: "Meeting for Organization A",
      // But calendar data suggests OrgB (higher priority)
      google_calendar_event: {
        creator: {
          email: "admin@orgb.org"
        }
      },
      // And people data would suggest OrgA
      people: {
        creator: {
          name: "John Doe",
          email: "john@orga.com"
        }
      }
    };
    
    // Calendar data should take precedence
    expect(detector.detectOrganization(meeting)).toBe("OrgB");
  });
  
  test("should allow disabling detection methods", () => {
    // Create detector with calendar detection disabled
    const customDetector = new OrganizationDetector({
      ...TEST_CONFIG,
      useCalendarData: false
    });
    
    const meeting = {
      id: "meeting-9",
      // Title would suggest OrgA
      title: "Meeting for Organization A",
      // Calendar data suggests OrgB, but calendar detection is disabled
      google_calendar_event: {
        creator: {
          email: "admin@orgb.org"
        }
      },
      // People data suggests OrgA
      people: {
        creator: {
          name: "John Doe",
          email: "john@orga.com"
        }
      }
    };
    
    // With calendar detection disabled, people data or title should determine
    expect(customDetector.detectOrganization(meeting)).toBe("OrgA");
  });
});
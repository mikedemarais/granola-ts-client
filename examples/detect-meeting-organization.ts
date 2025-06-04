import { PanelClient } from "../src/panel-client";
import { OrganizationDetector } from "../src/organization-detector";

/**
 * Example showing how to detect organization for meetings
 * Uses the organization detector with custom configuration
 */
async function detectMeetingOrganization() {
  try {
    console.log("Detecting organization for recent meetings...");
    
    // Initialize client
    const client = new PanelClient();
    
    // Create organization detector with custom configuration
    // In a real application, load this from a private config file
    const detector = new OrganizationDetector({
      organizations: [
        {
          name: "Organization1", // Example - replace with your actual organizations
          titleKeywords: ["org1", "team1"],
          emailDomains: ["org1.com"],
          emailAddresses: ["admin@org1.com"]
        },
        {
          name: "Organization2",
          titleKeywords: ["org2", "team2"],
          emailDomains: ["org2.org"],
          emailAddresses: ["admin@org2.org"]
        }
      ],
      defaultOrganization: "Unknown"
    });
    
    // Load private config if available
    let privateDetector: OrganizationDetector | undefined;
    try {
      privateDetector = OrganizationDetector.fromFile('./organization-config.private.json');
      console.log("Loaded private organization configuration");
    } catch (error) {
      console.log("Using default organization configuration");
    }
    
    // Get recent documents
    const documents = await client.getDocuments({ limit: 10 });
    console.log(`Found ${documents.docs?.length || 0} documents`);
    
    if (!documents.docs?.length) {
      console.log("No documents found");
      return;
    }
    
    // Process each meeting
    for (const doc of documents.docs) {
      console.log(`\n=== ${doc.title} (${doc.id}) ===`);
      
      // Detect using example configuration
      const organization = detector.detectOrganization(doc);
      console.log(`Example config detection: ${organization}`);
      
      // If private config is available, use it too
      if (privateDetector) {
        const privateOrg = privateDetector.detectOrganization(doc);
        console.log(`Private config detection: ${privateOrg}`);
      }
      
      // Show detection signals
      console.log("\nDetection signals:");
      
      // Title
      if (doc.title) {
        console.log(`- Title: ${doc.title}`);
      }
      
      // Calendar data
      if (doc.google_calendar_event?.creator?.email) {
        console.log(`- Calendar creator: ${doc.google_calendar_event.creator.email}`);
      }
      
      // Creator data
      if (doc.people?.creator) {
        console.log(`- Creator: ${doc.people.creator.name} <${doc.people.creator.email}>`);
        if (doc.people.creator.details?.company?.name) {
          console.log(`- Creator company: ${doc.people.creator.details.company.name}`);
        }
      }
      
      // Attendee data - count domains
      if (Array.isArray(doc.people?.attendees) && doc.people.attendees.length > 0) {
        const domainCounts: Record<string, number> = {};
        
        for (const attendee of doc.people.attendees) {
          if (attendee.email) {
            const domain = attendee.email.split('@')[1];
            domainCounts[domain] = (domainCounts[domain] || 0) + 1;
          }
        }
        
        console.log("- Attendee domains:");
        Object.entries(domainCounts).forEach(([domain, count]) => {
          console.log(`  - ${domain}: ${count} attendee(s)`);
        });
      }
    }
    
  } catch (error) {
    console.error("Error detecting organization:", error);
  }
}

// Run the example
detectMeetingOrganization();
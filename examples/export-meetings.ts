import GranolaClient from './src/index';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';

interface MeetingData {
  id: string;
  title: string;
  created_at: string;
  notes: {
    markdown?: string;
    plain?: string;
  };
  attendees: Array<{
    name: string;
    email?: string;
  }>;
  transcript: string;
}

async function exportMeetings(outputDir = join(homedir(), 'meetings'), force = false) {
  try {
    // Initialize Granola client
    const client = new GranolaClient();
    
    // Ensure output directory exists
    await mkdir(outputDir, { recursive: true });

    // Get all workspaces
    const workspaces = await client.getWorkspaces();
    if (!workspaces.workspaces?.length) {
      console.log('No workspaces found');
      return;
    }

    let exportedCount = 0;
    let skippedCount = 0;

    // Process each workspace
    for (const workspaceData of workspaces.workspaces) {
      if (!workspaceData.workspace?.workspace_id) continue;
      
      const workspaceId = workspaceData.workspace.workspace_id;
      console.log(`\nProcessing workspace: ${workspaceId}`);

      // Get all documents (meetings) from the workspace
      // Note: We'll need to handle pagination if there are many documents
      const docs = await client.getDocuments({ workspace_id: workspaceId, limit: 100 });
      
      if (!docs.docs?.length) {
        console.log('No documents found in workspace');
        continue;
      }

      // Process each document
      for (const doc of docs.docs) {
        if (!doc.id || !doc.title) continue;

        // Format date for filename
        const meetingDate = new Date(doc.created_at || Date.now());
        const formattedDate = meetingDate.toISOString().split('T')[0];

        // Sanitize title for filename
        const sanitizedTitle = doc.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

        // Generate filename
        const filename = `${formattedDate}-${sanitizedTitle}.json`;
        const filePath = join(outputDir, filename);

        // Handle existing files based on force flag
        if (existsSync(filePath)) {
          if (force) {
            console.log(`Overwriting: ${filename}`);
          } else {
            console.log(`Skipped (already exists): ${filename}`);
            skippedCount++;
            continue;
          }
        }

        // Get metadata and transcript
        const [metadata, transcript] = await Promise.all([
          client.getDocumentMetadata(doc.id),
          client.getDocumentTranscript(doc.id)
        ]);

        // Format transcript as a single string with speaker labels and proper spacing
        const formattedTranscript = transcript
          .sort((a, b) => {
            const aTime = a.start_timestamp ? new Date(a.start_timestamp).getTime() : 0;
            const bTime = b.start_timestamp ? new Date(b.start_timestamp).getTime() : 0;
            return aTime - bTime;
          })
          .map(entry => {
            const speaker = entry.source === 'microphone' ? 'me' : 'them';
            return `${speaker}: ${entry.text || ''}`;
          })
          .join('\n\n');  // Add empty line between entries
        
        // Prepare meeting data
        const meetingData: MeetingData = {
          id: doc.id,
          title: doc.title,
          created_at: doc.created_at || new Date().toISOString(),
          notes: {
            markdown: doc.notes_markdown,
            plain: doc.notes_plain
          },
          attendees: metadata.attendees?.map(person => {
            const attendee: { name: string; email?: string } = {
              name: person.name || person.email || 'Unknown Attendee'
            };
            if (person.email) {
              attendee.email = person.email;
            }
            return attendee;
          }) || [],
          transcript: formattedTranscript || '*No transcript available*'
        };

        // Save JSON file with proper formatting
        await writeFile(
          filePath, 
          JSON.stringify(meetingData, null, 2)
            // Replace escaped newlines with actual newlines in the transcript
            .replace(/\\n/g, '\n')
            // Add additional newline after each transcript entry
            .replace(/"\n/g, '"\n\n'),
          'utf-8'
        );

        console.log(`Exported: ${filename}`);
        exportedCount++;
      }
    }

    console.log(`\nExport Summary:`);
    console.log(`Exported ${exportedCount} meetings`);
    console.log(`Skipped ${skippedCount} meetings`);
    console.log(`Files saved to: ${outputDir}`);

  } catch (error) {
    console.error('Error exporting meetings:', error);
    throw error;
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const force = args.includes('--force') || args.includes('-f');

console.log('Starting meeting export');
console.log(`Force mode: ${force ? 'enabled' : 'disabled'}\n`);

// Call exportMeetings with the force flag
exportMeetings(undefined, force)
  .then(() => console.log('\nExport completed successfully'))
  .catch(console.error); 
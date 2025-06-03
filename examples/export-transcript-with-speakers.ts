// examples/export-transcript-with-speakers.ts
import { TranscriptClient } from '../src/transcript-client';

/**
 * Example demonstrating how to use the TranscriptClient to export a transcript
 * with speaker identification and deduplication.
 */
async function exportTranscriptWithSpeakers() {
  // Create a new instance of the TranscriptClient
  // Token will be automatically retrieved from local Granola app if not provided
  const client = new TranscriptClient();
  
  try {
    // Get a list of documents
    console.log("Getting documents...");
    const documents = await client.getDocuments();
    
    if (!documents.docs || documents.docs.length === 0) {
      console.log("No documents found");
      return;
    }
    
    // Print out the first 10 documents
    console.log(`Found ${documents.docs.length} documents`);
    for (let i = 0; i < Math.min(10, documents.docs.length); i++) {
      const doc = documents.docs[i];
      console.log(`  ${i+1}. ${doc.title} (ID: ${doc.document_id || doc.id})`);
    }
    
    // Find a document with "OMAI LAB MTG" in the title, or use the first document
    let docIndex = documents.docs.findIndex(doc => doc.title?.includes("OMAI LAB MTG"));
    
    // Fallback to first document if target not found
    if (docIndex === -1) {
      docIndex = 0;
      console.log("\nTarget document not found, using first document");
    } else {
      console.log(`\nFound target document at index ${docIndex+1}`);
    }
    
    // Get the selected document
    const selectedDoc = documents.docs[docIndex];
    console.log(`\nUsing document: ${selectedDoc.title} (ID: ${selectedDoc.document_id || selectedDoc.id})`);
    
    // Configure export settings
    const deduplicate = true;
    const similarityThreshold = 0.68;
    const timeWindow = 4.5;
    
    console.log(`\nDeduplication: ${deduplicate ? 'enabled' : 'disabled'}`);
    if (deduplicate) {
      console.log(`  Similarity threshold: ${similarityThreshold}`);
      console.log(`  Time window: ${timeWindow} seconds`);
    }
    
    // Export the transcript with speaker identification
    const outputFile = `${selectedDoc.title?.replace(/\s+/g, '_') || 'transcript'}_grouped.md`;
    console.log(`\nExporting transcript to ${outputFile}...`);
    
    await client.exportTranscriptMarkdown(
      selectedDoc.document_id || selectedDoc.id!,
      outputFile,
      {
        deduplicate,
        similarityThreshold,
        timeWindowSeconds: timeWindow
      }
    );
    
    console.log(`\nTranscript exported successfully!`);
    console.log(`You can now view the transcript with speakers in ${outputFile}`);
    
    // Demonstrate getting transcript data directly
    console.log("\nRetrieving transcript with speaker information...");
    const transcriptWithSpeakers = await client.getDocumentTranscriptWithSpeakers(
      selectedDoc.document_id || selectedDoc.id!
    );
    
    // Display a sample of the transcript
    console.log(`\nRetrieved ${transcriptWithSpeakers.length} transcript segments with speaker info`);
    console.log("\nSample of transcript segments:");
    
    // Display up to 5 segments
    const sampleSize = Math.min(5, transcriptWithSpeakers.length);
    for (let i = 0; i < sampleSize; i++) {
      const segment = transcriptWithSpeakers[i];
      console.log(`  [${segment.speaker}]: ${segment.text.substring(0, 60)}${segment.text.length > 60 ? "..." : ""}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the example
exportTranscriptWithSpeakers();
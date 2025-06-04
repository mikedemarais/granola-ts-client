// src/transcript-client.ts
import GranolaClient from './client';
import type { components } from './schema';
import type { TranscriptSegmentWithSpeaker } from './transcript-types';

type TranscriptSegment = components['schemas']['TranscriptSegment'];
type DocumentMetadata = components['schemas']['DocumentMetadata'];

/**
 * Specialized client for advanced transcript processing capabilities.
 * 
 * This class extends the base GranolaClient with features for:
 * - Automatic speaker identification based on audio source
 * - Transcript deduplication to remove duplicate speech segments
 * - Dialog coherence heuristics to improve speaker assignment
 * - Transcript formatting and export to markdown with speakers grouped
 * 
 * @example
 * ```ts
 * // Initialize the transcript client
 * const client = new TranscriptClient();
 * 
 * // Get transcript with speaker identification
 * const transcript = await client.getDocumentTranscriptWithSpeakers('document-id');
 * 
 * // Export transcript to markdown with speakers grouped
 * await client.exportTranscriptMarkdown('document-id', 'output.md');
 * ```
 */
export class TranscriptClient extends GranolaClient {
  /**
   * Calculate the similarity between two text strings.
   * Uses a simple character-based similarity calculation that approximates
   * the behavior of Python's difflib.SequenceMatcher.
   * 
   * @param text1 First text string
   * @param text2 Second text string
   * @returns Similarity score between 0.0 and 1.0
   * @private
   */
  private _calculateTextSimilarity(text1: string, text2: string): number {
    // Normalize the strings to lowercase for case-insensitive comparison
    const s1 = text1.toLowerCase();
    const s2 = text2.toLowerCase();
    
    // If either string is empty, special handling
    if (s1.length === 0 && s2.length === 0) return 1.0;
    if (s1.length === 0 || s2.length === 0) return 0.0;
    
    // For exact matches, return 1.0
    if (s1 === s2) return 1.0;
    
    // Special case for string containment (prefix/suffix matches)
    // Important for cases like "Hello" and "Hello there"
    if (s1.includes(s2) || s2.includes(s1)) {
      const minLen = Math.min(s1.length, s2.length);
      const maxLen = Math.max(s1.length, s2.length);
      // Return a similarity score based on the ratio of the shorter text to the longer one
      // This ensures that "Hello" and "Hello there" have high similarity
      return minLen / maxLen + 0.2; // Add a bonus for containment (capped at 1.0)
    }
    
    // Find the longest common subsequence (simplified approach)
    const longestCommonSubsequence = this._longestCommonSubsequence(s1, s2);
    
    // Calculate similarity as the ratio of common characters to total characters
    const maxLen = Math.max(s1.length, s2.length);
    return Math.min(1.0, longestCommonSubsequence / maxLen);
  }
  
  /**
   * Helper method to calculate longest common subsequence length.
   * This is a simplified approach for string similarity.
   * 
   * @param s1 First string
   * @param s2 Second string
   * @returns Length of the longest common subsequence
   * @private
   */
  private _longestCommonSubsequence(s1: string, s2: string): number {
    // Create a matrix to store lengths of common subsequences
    const matrix: number[][] = Array(s1.length + 1)
      .fill(null)
      .map(() => Array(s2.length + 1).fill(0));
    
    // Fill the matrix
    for (let i = 1; i <= s1.length; i++) {
      for (let j = 1; j <= s2.length; j++) {
        if (s1[i - 1] === s2[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1] + 1;
        } else {
          matrix[i][j] = Math.max(matrix[i - 1][j], matrix[i][j - 1]);
        }
      }
    }
    
    // Return the length of the LCS
    return matrix[s1.length][s2.length];
  }

  /**
   * Deduplicate segments by identifying similar text within a time window.
   * 
   * @param segments List of transcript segments with speaker info
   * @param similarityThreshold Minimum similarity score to consider as duplicate
   * @param timeWindowSeconds Maximum time difference to consider for deduplication
   * @returns Deduplicated list of segments
   * @private
   */
  private _deduplicateSegments(
    segments: TranscriptSegmentWithSpeaker[],
    similarityThreshold: number,
    timeWindowSeconds: number
  ): TranscriptSegmentWithSpeaker[] {
    if (!segments.length) return [];
    
    // Sort segments by start time
    const sortedSegments = [...segments].sort(
      (a, b) => a.start_time!.getTime() - b.start_time!.getTime()
    );
    
    // Keep track of segments to remove
    const segmentsToRemove = new Set<number>();
    
    // For each segment, check if there are similar segments within the time window
    for (let i = 0; i < sortedSegments.length; i++) {
      if (segmentsToRemove.has(i)) continue;
      
      const segment = sortedSegments[i];
      
      // Define the time window
      const windowEnd = new Date(
        segment.start_time!.getTime() + timeWindowSeconds * 1000
      );
      
      // Check subsequent segments within the time window
      for (let j = i + 1; j < sortedSegments.length; j++) {
        if (segmentsToRemove.has(j)) continue;
        
        const other = sortedSegments[j];
        
        // If we're outside the time window, break
        if (other.start_time!.getTime() > windowEnd.getTime()) break;
        
        // Calculate similarity between the two segments
        const similarity = this._calculateTextSimilarity(
          segment.text || '', 
          other.text || ''
        );
        
        // If similar enough, mark the duplicate for removal
        if (similarity >= similarityThreshold) {
          // Determine which one to keep - prefer keeping "microphone" source
          if (segment.source === "microphone" && other.source === "system") {
            segmentsToRemove.add(j);
          } else if (segment.source === "system" && other.source === "microphone") {
            segmentsToRemove.add(i);
            break; // Stop checking this segment since it's being removed
          } else {
            // If both have same source, keep the one with more text
            // In case of exact match or very high similarity (>0.95), remove the second instance
            if (similarity > 0.95 || (segment.text?.length || 0) >= (other.text?.length || 0)) {
              segmentsToRemove.add(j);
            } else {
              segmentsToRemove.add(i);
              break; // Stop checking this segment
            }
          }
        }
      }
    }
    
    // Create the deduplicated list
    return sortedSegments.filter((_, i) => !segmentsToRemove.has(i));
  }

  /**
   * Improve speaker assignment using dialog coherence heuristics.
   * 
   * @param segments List of transcript segments with speaker info
   * @returns List of segments with improved speaker assignment
   * @private
   */
  private _improveSpeakerAssignment(
    segments: TranscriptSegmentWithSpeaker[]
  ): TranscriptSegmentWithSpeaker[] {
    if (!segments.length) return [];
    
    // Sort by start time
    const sortedSegments = [...segments].sort(
      (a, b) => a.start_time!.getTime() - b.start_time!.getTime()
    );
    
    // First pass: identify short segments that are likely continuations
    for (let i = 1; i < sortedSegments.length; i++) {
      const prev = sortedSegments[i-1];
      const curr = sortedSegments[i];
      
      // Check if there's a very short pause between segments
      const timeDiff = (curr.start_time!.getTime() - prev.end_time!.getTime()) / 1000;
      
      // Very short segments with very short pauses are often from the same speaker
      if ((curr.text?.length || 0) < 8 && timeDiff < 0.5) {
        curr.speaker = prev.speaker;
        curr.confidence = 0.8;  // Higher confidence for very short segments
      }
    }
    
    // Second pass: Apply dialog coherence - people typically take turns speaking
    for (let i = 1; i < sortedSegments.length; i++) {
      const prev = sortedSegments[i-1];
      const curr = sortedSegments[i];
      
      // If sources don't match but the text is very similar, they might be duplicates
      // that weren't caught by the deduplication step
      if (prev.source !== curr.source) {
        const similarity = this._calculateTextSimilarity(prev.text || '', curr.text || '');
        if (similarity > 0.65) {  // More aggressive similarity for post-deduplication
          // Prefer keeping "microphone" source
          if (curr.source === "system" && prev.source === "microphone") {
            curr.speaker = "SKIP";  // Mark for removal later
            continue;
          } else if (curr.source === "microphone" && prev.source === "system") {
            prev.speaker = "SKIP";  // Mark for removal later
            continue;
          }
        } else {
          continue;  // If not similar enough, trust the original source assignment
        }
      }
      
      // Check if there's a long pause between segments (indicating possible speaker change)
      const timeDiff = (curr.start_time!.getTime() - prev.end_time!.getTime()) / 1000;
      if (timeDiff > 2.0) {  // More than 2.0 seconds pause might indicate speaker change
        continue;
      }
      
      // If the previous 2 segments had the same speaker, and this is a continuation
      // with short pause, it's likely the same speaker
      if (i >= 2 && sortedSegments[i-2].speaker === prev.speaker && timeDiff < 1.5) {
        curr.speaker = prev.speaker;
        curr.confidence = 0.75;
        continue;
      }
      
      // Apply turn-taking heuristic - alternate speakers in a conversation
      // But only if the source is "system" for both (as we trust "microphone" source)
      if (prev.source === "system" && curr.source === "system") {
        // Short segments with short pauses are often from the same speaker
        if ((curr.text?.length || 0) < 15 && timeDiff < 1.0) {
          curr.speaker = prev.speaker;
          curr.confidence = 0.7;  // Lower confidence for this heuristic
        }
        // Otherwise alternate speakers for natural conversation flow
        else if (prev.speaker === "Them" && timeDiff < 1.2) {
          curr.speaker = "Them";  // Maintain the same speaker for system source
        }
      }
    }
    
    // Remove segments marked for skipping
    return sortedSegments.filter(s => s.speaker !== "SKIP");
  }

  /**
   * Get a document transcript with speaker identification.
   * 
   * This method extends the standard getDocumentTranscript method by adding speaker information
   * based on the source field in the transcript data and the metadata of the document.
   * It also performs deduplication to remove repeated segments that are likely the same speech
   * captured from different sources.
   * 
   * @param documentId The ID of the document to get the transcript for
   * @param deduplicate Whether to deduplicate segments (default: true)
   * @param similarityThreshold Minimum text similarity to consider as duplicate (0.0-1.0)
   * @param timeWindowSeconds Maximum time difference between segments to check for duplicates
   * @returns A list of TranscriptSegmentWithSpeaker objects containing the transcript with speaker identification
   */
  public async getDocumentTranscriptWithSpeakers(
    documentId: string,
    deduplicate: boolean = true,
    similarityThreshold: number = 0.68,
    timeWindowSeconds: number = 4.5
  ): Promise<TranscriptSegmentWithSpeaker[]> {
    // Get the raw transcript data
    const transcriptSegments = await this.getDocumentTranscript(documentId);
    
    // Get the document metadata for creator information
    const metadata = await this.getDocumentMetadata(documentId);
    
    // Extract creator information
    const creatorName = metadata.creator?.name || "Me";
    
    // First pass: convert to TranscriptSegmentWithSpeaker objects
    const segmentsWithSpeakers: TranscriptSegmentWithSpeaker[] = transcriptSegments.map(segment => {
      // Parse timestamps
      const startTime = new Date(segment.start_timestamp || '');
      const endTime = new Date(segment.end_timestamp || '');
      
      // Check if this segment has source information
      const source = segment.source || '';
      let speaker = "Unknown";
      
      // If the source is "microphone", it's the creator speaking
      if (source === "microphone") {
        speaker = "Me";
      }
      // If the source is "system", it's potentially someone else
      else if (source === "system") {
        speaker = "Them";  // We'll refine this in the deduplication step
      }
      
      // Add the segment with speaker info
      return {
        ...segment,
        speaker,
        document_id: segment.document_id || documentId,
        source,
        start_time: startTime,
        end_time: endTime,
        confidence: 1.0  // Initial confidence
      };
    });
    
    // Sort by start time
    segmentsWithSpeakers.sort((a, b) => a.start_time!.getTime() - b.start_time!.getTime());
    
    // Deduplication step
    if (deduplicate) {
      const deduplicatedSegments = this._deduplicateSegments(
        segmentsWithSpeakers,
        similarityThreshold,
        timeWindowSeconds
      );
      
      // Apply dialog coherence heuristics to improve speaker assignment
      const finalSegments = this._improveSpeakerAssignment(deduplicatedSegments);
      return finalSegments;
    }
    
    return segmentsWithSpeakers;
  }

  /**
   * Export a transcript to a markdown file with speaker identification.
   * Groups text by speaker instead of labeling each line.
   * Uses Bun.write for file operations.
   * 
   * @param documentId The ID of the document to export
   * @param outputPath The path to save the markdown file to
   * @param options Configuration options
   * @param options.deduplicate Whether to deduplicate segments
   * @param options.similarityThreshold Minimum similarity for deduplication
   * @param options.timeWindowSeconds Time window for deduplication
   */
  public async exportTranscriptMarkdown(
    documentId: string,
    outputPath: string,
    options: {
      deduplicate?: boolean;
      similarityThreshold?: number;
      timeWindowSeconds?: number;
    } = {}
  ): Promise<void> {
    // Get the transcript with speakers
    const transcript = await this.getDocumentTranscriptWithSpeakers(
      documentId,
      options.deduplicate ?? true,
      options.similarityThreshold ?? 0.68,
      options.timeWindowSeconds ?? 4.5
    );
    
    // Prepare content for the markdown file
    let content = " \n";  // Start with a blank line like the example
    
    let currentSpeaker: string | null = null;
    let currentText: string[] = [];
    
    for (const segment of transcript) {
      // If speaker changes or this is the first segment, write the accumulated text
      if (currentSpeaker !== null && currentSpeaker !== segment.speaker) {
        // Write the accumulated text for the previous speaker
        content += `${currentSpeaker}:  \n`;
        for (const textLine of currentText) {
          content += `${textLine || ''}  \n`;
        }
        content += "\n";  // Add a blank line between speaker sections
        
        // Reset for the new speaker
        currentText = [];
      }
      
      // Update current speaker and add this text
      currentSpeaker = segment.speaker;
      currentText.push(segment.text || '');
    }
    
    // Write the final speaker's text
    if (currentSpeaker !== null && currentText.length) {
      content += `${currentSpeaker}:  \n`;
      for (const textLine of currentText) {
        content += `${textLine || ''}  \n`;
      }
    }
    
    // Write to the markdown file using Bun's native API
    await Bun.write(outputPath, content);
    
    console.log(`Transcript exported to ${outputPath}`);
  }
}
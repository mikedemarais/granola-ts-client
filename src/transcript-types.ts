// src/transcript-types.ts
import type { components } from './schema';
type TranscriptSegment = components['schemas']['TranscriptSegment'];

/**
 * Extended transcript segment that includes speaker information and additional metadata.
 * 
 * This interface extends the base TranscriptSegment from the Granola API with
 * fields that are useful for speaker identification, deduplication, and
 * conversation analysis.
 * 
 * @example
 * ```ts
 * const segmentWithSpeaker: TranscriptSegmentWithSpeaker = {
 *   text: "Hello there",
 *   start_timestamp: "2023-01-01T10:00:00.000Z",
 *   end_timestamp: "2023-01-01T10:00:05.000Z",
 *   speaker: "Me",
 *   source: "microphone",
 *   start_time: new Date("2023-01-01T10:00:00.000Z"),
 *   end_time: new Date("2023-01-01T10:00:05.000Z"),
 *   confidence: 1.0
 * };
 * ```
 */
export interface TranscriptSegmentWithSpeaker extends TranscriptSegment {
  /** 
   * Speaker identifier (e.g., "Me" or "Them").
   * "Me" typically represents the local user (microphone source),
   * while "Them" represents remote participants (system source).
   */
  speaker: string;
  
  /** 
   * Document ID this segment belongs to.
   * Used to track which document the segment is associated with.
   */
  document_id?: string;
  
  /** 
   * Source of the transcript (e.g., "microphone" or "system").
   * "microphone" indicates audio captured from the local microphone,
   * while "system" indicates audio from remote participants.
   */
  source?: string;
  
  /** 
   * Parsed start timestamp as Date object.
   * Provides a native Date object for easier time-based operations.
   */
  start_time?: Date;
  
  /** 
   * Parsed end timestamp as Date object.
   * Provides a native Date object for easier time-based operations.
   */
  end_time?: Date;
  
  /** 
   * Confidence score for speaker assignment (0.0-1.0).
   * Higher values indicate more confidence in the speaker attribution.
   * Used primarily by the dialog coherence algorithms.
   */
  confidence?: number;
}
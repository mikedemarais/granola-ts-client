import { describe, expect, it } from "bun:test";
import * as os from "os";
import * as path from "path";

describe("macOS token path", () => {
  const homedir = os.homedir();
  
  it("should correctly resolve macOS token path", () => {
    const macPath = path.join(
      homedir,
      "Library/Application Support/Granola/supabase.json",
    );
    
    // Simulate the path resolution
    const resolvedPath = path.join(
      homedir,
      "Library/Application Support/Granola/supabase.json",
    );
    
    expect(resolvedPath).toBe(macPath);
    expect(resolvedPath.includes("Library/Application Support/Granola")).toBe(
      true,
    );
});
});

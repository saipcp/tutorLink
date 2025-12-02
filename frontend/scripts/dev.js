#!/usr/bin/env node

import { spawn } from "child_process";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import process from "process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Function to kill processes using a specific port (cross-platform)
function killPort(port) {
  try {
    // Try multiple methods to find and kill processes
    const platform = process.platform;

    if (platform === "darwin" || platform === "linux") {
      // macOS/Linux
      try {
        const command = `lsof -ti:${port} | xargs -r kill -9`;
        execSync(command, { stdio: "pipe" });
        console.log(`✓ Cleaned up processes on port ${port}`);
      } catch {
        // Try alternative method
        try {
          execSync(`pkill -f "vite.*${port}"`, { stdio: "pipe" });
        } catch {
          // Ignore if no processes found
        }
      }
    } else if (platform === "win32") {
      // Windows
      try {
        execSync(`netstat -ano | findstr :${port} | findstr LISTENING`, {
          stdio: "pipe",
        });
        execSync(
          `for /f "tokens=5" %a in ('netstat -ano ^| findstr :${port} ^| findstr LISTENING') do taskkill /PID %a /F`,
          { stdio: "pipe" }
        );
        console.log(`✓ Cleaned up processes on port ${port}`);
      } catch {
        // Port was already free
      }
    }
  } catch (error) {
    // Port was already free or no processes found
  }
}

// Function to check if port is in use (cross-platform)
function isPortInUse(port) {
  try {
    const platform = process.platform;

    if (platform === "darwin" || platform === "linux") {
      execSync(`lsof -i:${port}`, { stdio: "pipe" });
    } else if (platform === "win32") {
      execSync(`netstat -an | findstr :${port}`, { stdio: "pipe" });
    }
    return true;
  } catch {
    return false;
  }
}

console.log("🚀 Starting TutorLink development server...");

// Clean up ports before starting
const ports = [5173, 5174]; // Main port and HMR port
ports.forEach((port) => {
  if (isPortInUse(port)) {
    console.log(`📝 Port ${port} is in use, cleaning up...`);
    killPort(port);
  }
});

// Start the Vite development server
const viteProcess = spawn("vite", ["--host", "0.0.0.0"], {
  cwd: join(__dirname, ".."),
  stdio: "inherit",
  shell: true,
});

// Handle process termination
process.on("SIGINT", () => {
  console.log("\n🛑 Received SIGINT, shutting down gracefully...");

  // Kill the Vite process
  if (viteProcess && !viteProcess.killed) {
    viteProcess.kill("SIGTERM");

    // Give it a moment to shut down gracefully
    setTimeout(() => {
      if (!viteProcess.killed) {
        viteProcess.kill("SIGKILL");
      }
      // Clean up ports after shutdown
      ports.forEach((port) => killPort(port));
      process.exit(0);
    }, 2000);
  } else {
    ports.forEach((port) => killPort(port));
    process.exit(0);
  }
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Received SIGTERM, shutting down...");
  if (viteProcess && !viteProcess.killed) {
    viteProcess.kill("SIGTERM");
  }
  ports.forEach((port) => killPort(port));
  process.exit(0);
});

// Handle Vite process events
viteProcess.on("close", (code) => {
  console.log(`\n📝 Vite process exited with code ${code}`);
  ports.forEach((port) => killPort(port));
  process.exit(code);
});

viteProcess.on("error", (err) => {
  console.error("❌ Error starting Vite:", err);
  ports.forEach((port) => killPort(port));
  process.exit(1);
});

console.log("✅ Development server starting...");
console.log("📱 Hot reload enabled");
console.log("🌐 Server will be available at http://localhost:5173");
console.log("🔄 Press Ctrl+C to stop and cleanup ports");

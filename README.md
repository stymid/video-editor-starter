🎬 Video Editor Starter

A lightweight self-hosted video processing platform built with pure Node.js (no heavy frameworks).
Features include user authentication, video uploading & streaming, thumbnail generation, audio extraction, and a custom job queue with cluster support.

⸻

🚀 Overview

This project demonstrates how to build a scalable video processing backend from scratch using Node.js core modules and FFmpeg.
It is designed to handle:
• Secure user login & session management
• Large video uploads with streaming and file system handling
• Automatic thumbnail generation and dimension detection
• Audio extraction (AAC) from videos
• Video resizing with custom job queue
• Cluster mode with graceful job recovery and controlled resource usage

This system avoids heavy frameworks and shows deep understanding of Node.js internals, Unix, and networking.

⸻

🛠️ Tech Stack
• Node.js Core: HTTP, Streams, Buffers, File System, EventEmitter, Cluster
• FFmpeg / FFprobe: Video processing (thumbnails, resizing, audio extraction)
• JavaScript (ES6+), TypeScript (on some front-end work)
• Unix fundamentals (process management, low-level networking)
• Front-End: React, Next.js, TailwindCSS, Framer Motion, HeroUI
• Validation & Forms: React Hook Form, Zod
• Other Tools: Axios, Git & GitHub, npm, Vercel/Netlify

⸻

✨ Features
• 🔑 User Authentication: Simple cookie-based sessions (no external auth library)
• 📹 Video Uploading: Stream large files directly to storage without blocking the event loop
• 🖼 Thumbnail Generation: Automatic preview images using FFmpeg
• 🎵 Audio Extraction: Convert video to AAC audio in one click
• 📏 Video Resizing: On-demand video resizing with FFmpeg
• ⚡ Custom Job Queue: Ensures only one heavy video processing job runs at a time
• 🧩 Cluster Mode: Supports multi-worker setup while controlling CPU-heavy jobs
• 🗄️ Lightweight JSON DB: Simple file-based database for users, sessions, and videos
• 🛡 Error Handling & Cleanup: Removes incomplete files if upload or processing fails

⸻

⚡ Key Challenges & Learnings
• Handling large file uploads using stream.pipeline without blocking Node’s event loop.
• Managing FFmpeg processes with child_process.spawn and collecting metadata.
• Designing a custom job queue for CPU-heavy video resizing tasks.
• Implementing session authentication manually using cookies & tokens.
• Understanding Unix & Node Cluster to scale workers efficiently.
• Building a backend without Express, only with Node core modules.

⸻

🌐 API Endpoints

User Routes

POST /api/login → Log a user in and create session token
DELETE /api/logout → Logout and clear session
GET /api/user → Fetch current user info
PUT /api/user → Update user info

Video Routes

GET /api/videos → List user videos
POST /api/upload-video → Upload a new video file
GET /get-video-asset → Get video (original, thumbnail, audio, or resized)
PUT /api/video/resize → Request video resizing job
PATCH /api/video/extract-audio → Extract audio from a video

⸻

🏃 Getting Started

git clone https://github.com/stymid/video-editor-starter
cd video-editor-starter
npm install
npm run start # Start in single-process mode
npm run cluster # Start in cluster mode

Requirements:
• Node.js >= 18
• FFmpeg & FFprobe installed and available in PATH

⸻

🧪 Future Improvements
• Switch to a real database (PostgreSQL or MongoDB)
• Distributed job queue (handle multiple servers/machines)
• Add password hashing (bcrypt/argon2) & stronger security
• Unit & integration testing
• Support resumable uploads (chunked upload already implemented)

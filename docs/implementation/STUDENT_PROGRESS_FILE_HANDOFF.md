# Student Progress File Handoff – Pitch Brief

## Purpose
- Allow students to transmit exported progress spreadsheets (CSV/XLSX) directly to chairpersons without persisting course-level data in the primary database.
- Enable chairpersons to download submissions for later batch evaluation (graduation criteria checks, backlog processing, etc.).

## Value Proposition (Client-Facing Talking Points)
- **Privacy-first workflow:** No academic records written to long-term storage—files move through an isolated handoff channel.
- **Faster graduation reviews:** Chairpersons receive standardized artifacts that plug into existing offline/Excel review processes.
- **Minimal scope creep:** Adds a controlled sharing mechanism without redesigning the broader approval/analytics pipeline.

## High-Level Flow
1. Student selects "Send to Chairperson" on the progress page and uploads (or auto-attaches) the latest exported file.
2. Frontend requests a short-lived upload URL from the backend and streams the file directly to object storage.
3. Backend stores lightweight metadata (uploader, filename, expiry, download count) for chairperson visibility.
4. Chairperson dashboard lists pending submissions and generates presigned download links.
5. Scheduled cleanup purges expired files and metadata, ensuring regulatory compliance.

## Recommended Tech Stack
- **Frontend:** Next.js App Router (existing stack) + `FormData` uploads.
- **API Layer:** Route handlers or serverless functions generating presigned URLs.
- **Storage:** S3-compatible bucket (AWS S3, Azure Blob, or MinIO) configured for private objects.
- **Metadata Store:** Prisma-backed table or Redis hash solely for tracking file descriptors and expiry timestamps.
- **Background Tasks:** Cron/queue (Vercel Cron, Azure Functions Timer, etc.) for periodic garbage collection.

## Implementation Snapshot
- Effort: ~1.5–2 sprints (incl. QA, security review, chairperson UI polish).
- Dependencies: object storage credentials, RBAC check for chairperson routes, basic file size/type validations.
- Security: presigned URLs capped at 10–15 minutes; server enforces MIME/size limits; uploads tagged by student ID for audit trail.
- UX Considerations: progress page confirmation toast with tracking ID; chairperson list sortable/filterable; bulk-download option for future phases.

## Risks & Mitigations
- **Large uploads:** Streamed uploads via presigned URLs prevent Next.js servers from bottlenecking.
- **Retention compliance:** Automatic expiration (e.g., 30 days) plus manual purge controls.
- **Process drift:** Provide chairperson-side status indicators (new/downloaded/expired) to keep workflow transparent.

## Next Steps
1. Confirm storage provider + retention policy with stakeholders.
2. Draft API contract for `POST /api/student/uploads/presign` and `GET /api/chairperson/uploads`.
3. Build student UI prototype to validate UX and file-size expectations.
4. Demo chairperson list + download flow with mocked storage keys before full integration.

## Quick Summary (for presentation)
- Students upload their exported progress files through the portal; nothing is stored in the main DB.
- Backend hands out presigned URLs so files stream directly into secure object storage.
- Minimal metadata (who/what/when) is tracked so chairpersons can see pending submissions.
- Chairpersons log in, view the queue, and download each file via short-lived links.
- Automatic expiry/cleanup keeps storage light and compliant.

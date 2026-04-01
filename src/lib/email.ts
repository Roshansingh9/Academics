import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  requireTLS: Number(process.env.SMTP_PORT) !== 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Leafclutch Academics";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail({ to, subject, html }: SendEmailOptions) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    html,
  });
}

function fire(fn: Promise<void>) {
  fn.catch((err) => console.error("[Email] failed:", err));
}

// ── Welcome / Credentials ─────────────────────────────────────────────────────
export function sendWelcomeEmail(
  email: string,
  name: string,
  userId: string,
  initialPassword: string,
  role: "MENTOR" | "STUDENT"
) {
  const roleLabel = role === "MENTOR" ? "Mentor" : "Student";
  const dashboard = role === "MENTOR" ? "/mentor" : "/student";
  fire(
    sendEmail({
      to: email,
      subject: `Welcome to ${APP_NAME} — Your Account Credentials`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto">
          <h2 style="color:#1e293b">Welcome to ${APP_NAME}</h2>
          <p>Hi ${name},</p>
          <p>Your <strong>${roleLabel}</strong> account has been created. Here are your login credentials:</p>
          <table style="border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;background:#f8fafc;width:100%;border-collapse:collapse">
            <tr><td style="padding:6px 0;color:#64748b;width:140px">Login ID</td><td style="padding:6px 0;font-family:monospace;font-weight:600;color:#1e293b">${userId}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b">Email</td><td style="padding:6px 0;color:#1e293b">${email}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b">Password</td><td style="padding:6px 0;font-family:monospace;font-weight:600;color:#dc2626">${initialPassword}</td></tr>
          </table>
          <p style="color:#dc2626;font-size:13px">You will be required to change your password on first login.</p>
          <p>
            <a href="${APP_URL}${dashboard}" style="background:#6366f1;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">
              Login to ${APP_NAME}
            </a>
          </p>
          <p style="color:#94a3b8;font-size:12px">Please keep these credentials secure and do not share them.</p>
        </div>
      `,
    })
  );
}

// ── Messages ──────────────────────────────────────────────────────────────────
export function sendMessageEmail(
  studentEmail: string,
  studentName: string,
  mentorName: string,
  preview: string
) {
  fire(
    sendEmail({
      to: studentEmail,
      subject: `New message from ${mentorName} — ${APP_NAME}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto">
          <h2 style="color:#1e293b">You have a new message</h2>
          <p>Hi ${studentName},</p>
          <p>Your mentor <strong>${mentorName}</strong> sent you a message:</p>
          <blockquote style="border-left:4px solid #6366f1;padding:8px 16px;background:#f8fafc;color:#475569">
            ${preview}
          </blockquote>
          <p>
            <a href="${APP_URL}/student/messages" style="background:#6366f1;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">
              View Message
            </a>
          </p>
          <p style="color:#94a3b8;font-size:12px">You are receiving this because you are enrolled in ${APP_NAME}.</p>
        </div>
      `,
    })
  );
}

export function sendMentorMessageEmail(
  mentorEmail: string,
  mentorName: string,
  studentName: string,
  preview: string
) {
  fire(
    sendEmail({
      to: mentorEmail,
      subject: `New message from ${studentName} — ${APP_NAME}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto">
          <h2 style="color:#1e293b">Your mentee sent you a message</h2>
          <p>Hi ${mentorName},</p>
          <p>Your student <strong>${studentName}</strong> sent you a message:</p>
          <blockquote style="border-left:4px solid #10b981;padding:8px 16px;background:#f8fafc;color:#475569">
            ${preview}
          </blockquote>
          <p>
            <a href="${APP_URL}/mentor/messages" style="background:#6366f1;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">
              View Message
            </a>
          </p>
          <p style="color:#94a3b8;font-size:12px">You are receiving this because you are a mentor on ${APP_NAME}.</p>
        </div>
      `,
    })
  );
}

// ── Notifications ─────────────────────────────────────────────────────────────
export function sendNotificationEmail(
  studentEmail: string,
  studentName: string,
  mentorName: string,
  title: string,
  body: string
) {
  fire(
    sendEmail({
      to: studentEmail,
      subject: `Notification: ${title} — ${APP_NAME}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto">
          <h2 style="color:#1e293b">New Notification</h2>
          <p>Hi ${studentName},</p>
          <p>Your mentor <strong>${mentorName}</strong> sent you a notification:</p>
          <h3 style="color:#1e293b">${title}</h3>
          <p style="color:#475569">${body}</p>
          <p>
            <a href="${APP_URL}/student/notifications" style="background:#6366f1;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">
              View Notification
            </a>
          </p>
          <p style="color:#94a3b8;font-size:12px">You are receiving this because you are enrolled in ${APP_NAME}.</p>
        </div>
      `,
    })
  );
}

// ── Assignments ───────────────────────────────────────────────────────────────
export function sendAssignmentEmail(
  studentEmail: string,
  studentName: string,
  mentorName: string,
  assignmentTitle: string,
  dueDate: Date
) {
  const dueDateStr = new Date(dueDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  fire(
    sendEmail({
      to: studentEmail,
      subject: `New Assignment: ${assignmentTitle} — ${APP_NAME}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto">
          <h2 style="color:#1e293b">New Assignment</h2>
          <p>Hi ${studentName},</p>
          <p>Your mentor <strong>${mentorName}</strong> has assigned you a new task:</p>
          <h3 style="color:#1e293b">${assignmentTitle}</h3>
          <p style="color:#475569">Due date: <strong>${dueDateStr}</strong></p>
          <p>
            <a href="${APP_URL}/student/assignments" style="background:#6366f1;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">
              View Assignment
            </a>
          </p>
          <p style="color:#94a3b8;font-size:12px">You are receiving this because you are enrolled in ${APP_NAME}.</p>
        </div>
      `,
    })
  );
}

// ── Warnings ──────────────────────────────────────────────────────────────────
export function sendWarningEmail(
  studentEmail: string,
  studentName: string,
  mentorName: string,
  title: string,
  reason: string
) {
  fire(
    sendEmail({
      to: studentEmail,
      subject: `Warning Issued: ${title} — ${APP_NAME}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto">
          <h2 style="color:#dc2626">Warning Notice</h2>
          <p>Hi ${studentName},</p>
          <p>Your mentor <strong>${mentorName}</strong> has issued a formal warning:</p>
          <div style="border:1px solid #fca5a5;border-radius:8px;padding:16px;background:#fef2f2">
            <h3 style="color:#dc2626;margin:0 0 8px">${title}</h3>
            <p style="color:#475569;margin:0">${reason}</p>
          </div>
          <p>
            <a href="${APP_URL}/student/warnings" style="background:#6366f1;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">
              View Warnings
            </a>
          </p>
          <p style="color:#94a3b8;font-size:12px">If you believe this is an error, please contact your mentor directly.</p>
        </div>
      `,
    })
  );
}

// ── Submission Reviewed ───────────────────────────────────────────────────────
export function sendSubmissionReviewedEmail(
  studentEmail: string,
  studentName: string,
  mentorName: string,
  assignmentTitle: string,
  status: "REVIEWED" | "ACCEPTED",
  mentorComment?: string | null
) {
  const isAccepted = status === "ACCEPTED";
  fire(
    sendEmail({
      to: studentEmail,
      subject: `Assignment ${isAccepted ? "Accepted" : "Reviewed"}: ${assignmentTitle} — ${APP_NAME}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto">
          <h2 style="color:#1e293b">Your Submission Has Been ${isAccepted ? "Accepted" : "Reviewed"}</h2>
          <p>Hi ${studentName},</p>
          <p>Your mentor <strong>${mentorName}</strong> has ${isAccepted ? "accepted" : "reviewed"} your submission for <strong>${assignmentTitle}</strong>.</p>
          ${
            isAccepted
              ? `<div style="border:1px solid #86efac;border-radius:8px;padding:12px 16px;background:#f0fdf4;color:#166534"><strong>Status: Accepted</strong> — Great work!</div>`
              : `<div style="border:1px solid #fde68a;border-radius:8px;padding:12px 16px;background:#fffbeb;color:#92400e"><strong>Status: Reviewed</strong> — Please check the feedback and resubmit if needed.</div>`
          }
          ${mentorComment ? `<div style="margin-top:12px"><p style="font-weight:600">Mentor Feedback:</p><p style="color:#475569;border-left:3px solid #6366f1;padding-left:12px">${mentorComment}</p></div>` : ""}
          <p style="margin-top:16px">
            <a href="${APP_URL}/student/assignments" style="background:#6366f1;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">
              View Assignment
            </a>
          </p>
          <p style="color:#94a3b8;font-size:12px">You are receiving this because you are enrolled in ${APP_NAME}.</p>
        </div>
      `,
    })
  );
}

// ── Profile Edit Response ─────────────────────────────────────────────────────
export function sendProfileEditResponseEmail(
  studentEmail: string,
  studentName: string,
  status: "APPROVED" | "REJECTED",
  adminNote?: string | null
) {
  const isApproved = status === "APPROVED";
  fire(
    sendEmail({
      to: studentEmail,
      subject: `Profile Edit ${isApproved ? "Approved" : "Rejected"} — ${APP_NAME}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto">
          <h2 style="color:#1e293b">Profile Edit ${isApproved ? "Approved" : "Rejected"}</h2>
          <p>Hi ${studentName},</p>
          ${
            isApproved
              ? `<p>Your profile edit request has been <strong style="color:#16a34a">approved</strong>. Your profile has been updated.</p>`
              : `<p>Your profile edit request has been <strong style="color:#dc2626">rejected</strong> by the admin.</p>`
          }
          ${adminNote ? `<p style="color:#475569;border-left:3px solid #6366f1;padding-left:12px"><em>Admin note: ${adminNote}</em></p>` : ""}
          <p>
            <a href="${APP_URL}/student/profile" style="background:#6366f1;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">
              View Profile
            </a>
          </p>
          <p style="color:#94a3b8;font-size:12px">You are receiving this because you are enrolled in ${APP_NAME}.</p>
        </div>
      `,
    })
  );
}

// utils/emailTemplates.ts
export function welcomeEmailHtml(params: { name?: string; empId?: string; joiningDate?: string; team?: string }) {
  const { name = "Team member", empId = "", joiningDate = "", team = "" } = params;
  return `
  <div style="font-family: Arial, sans-serif; color: #111; line-height:1.5;">
    <h2 style="color:#1f2937;">Welcome to Company Name, ${name} 👋</h2>
    <p>Hi ${name},</p>
    <p>Congratulations and welcome aboard! We're glad to have you join the ${team || "team"}.</p>
    <p><strong>Employee ID:</strong> ${empId || "—"}</p>
    <p><strong>Joining Date:</strong> ${joiningDate || "—"}</p>
    <p>Here's a quick start — you'll receive further instructions from People Ops with your account access and induction schedule.</p>
    <p>Warmly,<br/>Company Name</p>
    <hr/>
    <small style="color:#6b7280;">If you didn't expect this email, please contact HR.</small>
  </div>
  `;
}

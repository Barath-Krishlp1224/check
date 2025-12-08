interface Asset {
  _id: string;
  name: string;
  empId: string;
  selectedTeamCategory?: string;
  team?: string;
  designation?: string;
  deviceType?: string;
  laptopModel?: string;
  serialNumber?: string;
  yearOfMake?: string;
  macAddress?: string;
  processor?: string;
  storage?: string;
  ram?: string;
  os?: string;
  antivirus?: string;
  purchaseDate?: string;
  standardAccessories?: string[];
  otherAccessoriesText?: string;
  allAccessories?: string[];
}

function escapeHtml(unsafe?: string) {
  if (!unsafe) return "";
  return String(unsafe)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getFormattedDate(): string {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const year = today.getFullYear();
  return `${day}-${month}-${year}`;
}

export function renderPreviewHtml(asset: Asset, forPrint = false) {
  const todayDate = getFormattedDate();

  const logoUrl = "/logo hd.png";
  const addressLine1 = "No. 303, Kamaraj Salai, Pillaithottam, Pondicherry - 605 013";
  const addressLine2 = "CIN: U62099PY2023PTC009018";

  const employeeName = escapeHtml(asset.name ?? "");
  const employeeDesignation = escapeHtml(asset.designation ?? "N/A");
  const employeeTeam = escapeHtml(asset.team ?? "N/A");
  const combinedTeamDisplay = escapeHtml(
    asset.selectedTeamCategory && asset.team
      ? `${asset.selectedTeamCategory} - ${asset.team}`
      : asset.team ?? "N/A"
  );

  let reportingManagerName: string;
  const teamString = `${asset.selectedTeamCategory ?? ""} ${asset.team ?? ""}`.toLowerCase();

  if (
    teamString.includes("tech") ||
    teamString.includes("technology") ||
    teamString.includes("development") ||
    teamString.includes("engineering")
  ) {
    reportingManagerName = "RAMESH V";
  } else if (teamString.includes("accounts") || teamString.includes("account")) {
    reportingManagerName = "BALAMURUGAN J";
  } else {
    reportingManagerName = "BALAMURUGAN J";
  }

  const styles = `
    @page { size: A4; margin: 20mm; }

    html, body {
      height: 100%;
      margin: 0;
      padding: 0;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      box-sizing: border-box;
    }

    body {
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      flex-direction: column; 
      align-items: center; 
      padding: 20px;
    }

    .a4-sheet {
      width: 210mm;
      min-height: 297mm;
      background: #fff;
      box-sizing: border-box;
      padding: 18mm;
      position: relative;
      overflow: visible;
      page-break-after: always;
      margin-bottom: 20px; 
    }
    
    .a4-sheet:last-child {
        page-break-after: auto; 
        margin-bottom: 0;
    }

    .a4-sheet::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image: url('${logoUrl}'); 
      background-repeat: no-repeat;
      background-position: center;
      background-size: 60%;
      opacity: 0.08;
      z-index: 0;
      pointer-events: none;
    }

    .a4-sheet > * {
      position: relative;
      z-index: 2;
    }

    .header { margin-bottom: 8px; }
    .logo-row { display: flex; align-items: flex-start; gap: 12px; }
    .hlogo { width: 35%; display: inline-block; }
    .title-row { width: 100%; margin-top: 5%; text-align: center; }
    .main-heading { font-size: 14px; margin: 0; font-weight: 800; letter-spacing: 0.4px; }

    .content-body { padding-top: 12px; margin-bottom: 20mm; }
    .section-title, .section-title-7, .hr-section-title {
      font-size: 14px;
      font-weight: 700;
      margin-top: 14px;
      color: #000;
      padding-bottom: 6px;
    }

    .content-body p, .hr-policy-content p {
      font-size: 12px;
      line-height: 1.45;
      margin: 6px 0;
      color: #000;
      text-align: justify;
    }

    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
      margin-bottom: 20px;
    }

    .info-table td {
      border: 1px solid #ccc;
      padding: 10px;
      vertical-align: top;
    }

    .info-table h4 {
      font-size: 12px;
      font-weight: 700;
      margin: 0 0 6px 0;
      color: #000;
      text-decoration: underline;
    }
    
    .info-table p {
      font-size: 12px;
      margin: 4px 0;
      color: #000;
      line-height: 1.4;
    }
    
    .data-separator {
      border: none;
      border-top: 1px solid #aaa;
      margin: 15px 0;
    }

    .data-section { 
      margin-bottom: 10px; 
    }
    .data-row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      margin-bottom: 3px;
      padding: 1px 0; 
      border-bottom: 1px solid #eee;
    }
    .data-label {
      font-weight: 600;
      padding-right: 15px;
    }
    .data-value {
      text-align: right;
      word-break: break-all;
    }

    .acknowledgment-block {
      margin-top: 30px;
    }
      
    .signature-row {
      display: flex;
      justify-content: space-between;
      margin-top: 40px;
    }
    .signature-column {
      width: 45%;
      padding-top: 5px;
      font-size: 12px;
      font-weight: bold;
      text-align: center;
      margin-top: 20%;
    }
    .table{
      margin-top: 10%;
    }
        
    .hr-policy-sheet {
        padding-top: 10mm; 
    }
    .hr-acknowledgement-declaration {
        margin-bottom: 20px;
        font-size: 12px;
        line-height: 1.5;
    }
    .hr-acknowledgement-declaration strong {
        font-weight: 700;
    }
    .hr-policy-content {
        margin-bottom: 20px;
    }
    .hr-policy-content h3 {
        font-size: 13px;
        font-weight: 700;
        margin: 10px 0 5px 0;
        text-decoration: underline;
    }
    .hr-policy-content h4 {
        font-size: 12px;
        font-weight: 600;
        margin: 8px 0 3px 0;
    }
    .hr-policy-content ul {
        list-style-type: none;
        padding-left: 0;
        margin: 5px 0 10px 0;
    }
    .hr-policy-content li {
        margin-bottom: 4px;
        font-size: 12px;
        line-height: 1.4;
    }
    .hr-termination-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 10px;
        font-size: 12px;
    }
    .hr-termination-table th, .hr-termination-table td {
        border: 1px solid #ddd;
        padding: 5px 8px;
        text-align: left;
        vertical-align: top;
    }
    .hr-termination-table th {
        background-color: #f2f2f2;
        font-weight: 700;
    }
    .hr-signature-block {
        margin-top: 40px;
    }
    .hr-signature-block-row {
        display: flex;
        justify-content: space-between;
        margin-top: 30px;
        font-size: 12px;
    }
    .hr-signature-col {
        width: 45%;
    }
    .hr-signature-line {
        border-top: 1px solid #000;
        padding-top: 5px;
        font-weight: 700;
        text-align: center;
    }
    
    .hr-policy-sheet .hlogo { 
        width: 35%; 
        display: block; 
        margin-top: 20%; 
    }

    @media print {
      body { background: #ffffff; padding: 0; }

      .a4-sheet {
        margin: 0;
        width: 210mm;
        padding: 20mm;
        min-height: auto;
        overflow: visible;
        page-break-after: always;
      }
      
      .a4-sheet:last-child {
          page-break-after: auto;
      }

      .a4-sheet::before {
        position: fixed;
      }
    }

    @media (max-width: 900px) {
      .a4-sheet { width: calc(100% - 40px); padding: 12mm; }
      .logo { width: 90px; }
    }
  `;

  const policyHtml = `
    <div class="section-title">1. Purpose</div>
    <p>• The purpose of this policy is to ensure the proper use, maintenance, and security of Lemonpay laptops used by employees.</p>

    <div class="section-title">2. Scope</div>
    <p>• This policy applies to all employees, and any other individuals granted access to laptops owned by Lemonpay.</p>

    <div class="section-title">3. Responsibilities</div>
    <p>• <strong>Employees:</strong> Employees are responsible for the proper care and use of laptops issued to them. They must adhere to all guidelines outlined in this policy and report any issues or concerns regarding laptop usage.</p>
    <p>• <strong>IT Department:</strong> The IT department is responsible for the provision, configuration, maintenance, and security of laptops. They will ensure that all laptops comply with organizational standards and are regularly updated with necessary software and security patches.</p>

    <div class="section-title">4. Acceptable Use</div>
    <p>• Laptops provided by Lemonpay are to be used solely for Lemonpay work-related purposes. Personal use should be kept to a minimum and should not interfere with job responsibilities.</p>
    <p>• Employees must comply with all applicable laws, regulations, and organizational policies while using laptops.</p>

    <div class="section-title">5. Security</div>
    <p>• Laptops should be protected with a strong password or biometric authentication.</p>
    <p>• Employees must not share their login credentials or leave their laptops unattended in public places.</p>
    <p>• Laptops should be encrypted to protect sensitive data in case of theft or loss.</p>

    <div class="section-title">6. Maintenance and Support</div>
    <p>• Employees must promptly report any issues or malfunctions with their laptops to the IT department.</p>
    <p>• Laptops must be returned to the IT department for repairs or maintenance as instructed.</p>
    
    <div style="text-align: left; margin-top: 30%; margin-bottom: 40px;">
    </div>

    <div class="section-title-7">7. Software Usage</div>
    <p>• Only authorized software provided by the IT department or approved by management should be installed on laptops.</p>
    <p>• Employees should not download or install unauthorized software that could compromise security or violate licensing agreements.</p>

    <div class="section-title">8. Data Backup</div>
    <p>• Employees are responsible for regularly backing up important data stored on their laptops to secure locations designated by the organization.</p>

    <div class="section-title">9. Compliance</div>
    <p>• All employees must comply with this policy. Violations may result in disciplinary action, up to and including termination of employment.</p>

    <div class="section-title">10. Policy Review</div>
    <p>• This policy will be reviewed regularly by the IT department to ensure its effectiveness and relevance. Any necessary updates or revisions will be communicated to all employees.</p>

    <div class="section-title">11. Acknowledgment</div>
    <p>• All employees are required to read and acknowledge their understanding of this policy. Failure to do so may result in restricted access to organisational laptops. Company reserves the rights.</p>

    <div class="section-title">12. Consequences of Breach</div>
    <p>• Any action of the employee that is inconsistent with this Policy shall be treated as serious professional misconduct on the part of the employee, and the employee concerned shall be subject to any disciplinary proceeding, or action, by the Company, which the management of the Company may deem appropriate under the existing circumstances. Such action may also include any rights of termination or any other rights that the Company may have under the terms of the employment agreement entered into by the Company with the employee concerned.</p>
    <p>• Employees are further advised that in the event any such employee fails to adhere to the requirements of laptop usage and restrictions on usage of Confidential Information, he or she shall be subject to any penal liability under the provisions of the Information Technology Act, 2000 (the “Act”), including but not limited to Section 43 of the Act.</p>
    <p>• The Company shall bear expenses for laptop maintenance and repairs arising out of the normal wear and tear. However, in the event of any damage to the laptop arising out of the negligence, misuse or abuse of the laptop by the employee, the employee shall be solely liable to make the payment for all the expenses arising therefrom. The Company shall have the right to reclaim such expenses and deduct the same from your monthly salary.</p>
  `;
  
  const assetInfoTableHtml = `
    <table class="info-table">
      <tr>
      <h4 style="margin-top: 50%; padding: 0;">Asset & Employee Details</h4>
        <td colspan="2">
          <div class="data-section">
            <h4>Employee Details</h4>
            <div class="data-row"><div class="data-label">Name:</div><div class="data-value">${employeeName}</div></div>
            <div class="data-row"><div class="data-label">Employee ID:</div><div class="data-value">${escapeHtml(asset.empId)}</div></div>
            <div class="data-row"><div class="data-label">Designation:</div><div class="data-value">${employeeDesignation}</div></div>
            <div class="data-row"><div class="data-label">Team:</div><div class="data-value">${employeeTeam}</div></div>
          </div>
          
          <hr class="data-separator" />
          
          <div class="data-section">
            <h4>Asset Details</h4>
            <div class="data-row"><div class="data-label">Device Type:</div><div class="data-value">${escapeHtml(asset.deviceType)}</div></div>
            <div class="data-row"><div class="data-label">Model:</div><div class="data-value">${escapeHtml(asset.laptopModel ?? "N/A")}</div></div>
            <div class="data-row"><div class="data-label">Serial Number:</div><div class="data-value">${escapeHtml(asset.serialNumber ?? "N/A")}</div></div>
            <div class="data-row"><div class="data-label">MAC Address:</div><div class="data-value">${escapeHtml(asset.macAddress ?? "N/A")}</div></div>
            <div class="data-row"><div class="data-label">Purchase Date:</div><div class="data-value">${escapeHtml(asset.purchaseDate ?? "N/A")}</div></div>
            <div class="data-row"><div class="data-label">Accessories:</div><div class="data-value">${escapeHtml((asset.allAccessories ?? []).join(", ") || "None")}</div></div>
          </div>
        </td>
      </tr>
    </table>
  `;

  const acknowledgmentHtml = `
    <div class="acknowledgment-block">
      <p style="margin-top: 10px; margin-bottom: 20px; font-size: 14px; text-align:center ; color: #000;">
        Lemonpay does provide a laptop to Employees at all career levels. The (PC, Windows Laptop and Apple Mac) are intended for office use only. 
      </p>
      <p style="margin-top: 10px; margin-bottom: 20px; font-size: 14px; text-align: center; color: #000;">
        I hereby declare that I have read & accept the terms & conditions mentioned above.
      </p>

      <div class="signature-row">
        <div class="signature-column">
          Date: ${todayDate}
        </div>
        <div class="signature-column">
          Employee Signature
        </div>
      </div>
    </div>
  `;

  const hrPolicyHtml = `
    <div class="hr-policy-sheet">
        <div class="logo-row">
            <img src="${logoUrl}" alt="Company Logo" class="hlogo" style="margin-top:-15%;" />
        </div>
        <div class="title-row">
            <h1 class="main-heading" style="margin-top:0;">HR POLICY ACKNOWLEDGEMENT & DECLARATION</h1>
        </div>
        
       <div class="hr-acknowledgement-declaration" style="margin-top:5%;">
            I, <span style="font-weight: bold;">${employeeName}</span>, working as <span style="font-weight: bold;">${employeeDesignation}</span> in <span style="font-weight: bold;">${combinedTeamDisplay}</span>, hereby acknowledge that I have read, understood, and agree to abide by the following policies of **Lemonpay Payment Solutions Private Limited**:
        </div>

        <div class="hr-policy-content">
            <div class="hr-section-title">1. INTRODUCTION</div>
            <p>This HR Policy Manual outlines the guidelines, practices, and procedures applicable to all employees of Lemonpay. It aims to create a transparent and structured work environment that supports the company’s growth and employee welfare.</p>

            <div class="hr-section-title">2. EMPLOYMENT TERMS</div>
            <h4>2.1 Probation Policy</h4>
            <p>All newly hired employees shall be placed on a probationary period of **three (3) months** from the date of joining. During this period, the employee’s performance, conduct, and overall suitability for the role will be evaluated. Based on this assessment, the probation period may be extended for up to an additional three (3) months. Employees who successfully complete the probationary period and receive a positive confirmation review will be formally designated as **Confirmed Employees**.</p>
            <h4>2.2 Core Employee Status</h4>
            <p>Employees who complete **three (3) years** of continuous service with Lemonpay will be recognized as **Core Employees**, eligible for long-term benefits and strategic project involvement.</p>

            <div class="hr-section-title">3. WORKING HOURS AND ATTENDANCE</div>
            <h4>3.1 Working Days & Hours</h4>
            <p><strong>Tech Team:</strong> Work days are Monday to Friday. Saturday and Sunday are considered weekly offs. In case of business or project requirements, employees may be requested to work on Saturdays. Such instances will be formally communicated by the respective Team Manager or HR Manager. Employees who work on a Saturday will be eligible for a **Compensatory Off** to be availed within the following weeks.</p>
            <p><strong>Accounts, Operations, IT System Administration Teams:</strong> Work days are Monday to Saturday. Employees who work on any holidays will be eligible for a **Compensatory Off** to be availed within the following weeks.</p>
            <h4>3.2 Work Hours & Breaks</h4>
            <p>Total Working Hours: **9 hours/day** (including 1 Hour/day for lunch and tea breaks).</p>
            <h4>3.3 Attendance & Punctuality</h4>
            <p>Employees are expected to report on time. **Four (4) instances of late arrival in a month** will be treated as **1 day Leave Without Pay (LOP)**.</p>

            <div class="hr-section-title" style="margin-top:20%">4. LEAVE POLICY</div>
            <h4>4.1 Leave Application & Approval Process</h4>
            <p>All leave requests (CL & SL) must be communicated in advance to the Immediate Reporting Manager or HR Manager, either in person or via phone call, prior to applying through the HRMS App. (Greythr/Factohr/Hfactor). Planned long leaves must be intimated to the Reporting Manager/HR Manager at least **7 to 10 days in advance**.</p>
            <h4>4.2 Sandwich Leave Policy</h4>
            <p>Lemonpay follows the **Sandwich Leave Policy**, where weekly offs/public holidays falling between two leave days will also be counted as leave. (Example: Leave on Friday and Monday means Saturday and Sunday are also counted as leave).</p>
            <h4>Work From Home (WFH) Policy</h4>
            <p>Lemonpay does not have a default WFH/Hybrid/Remote work policy. Maximum **12 WFH days per year** are allowed, with no more than **2 days per month**, approved under special circumstances by management.</p>

            <div class="hr-section-title">5. SPECIAL CONDITIONS</div>
            <h4>5.1 Office Closure Compensation</h4>
            <p>In exceptional circumstances (bandhs, natural calamities, emergencies, etc.) where the office is closed, the lost working day(s) will be treated as **compensated leave**. Employees may be required to compensate for such non-working days by working on a designated weekly off or a mutually agreed alternative working day.</p>

            <div class="hr-section-title">6. EXIT POLICY</div>
            <h4>6.1 Notice Period</h4>
            <p><strong>Probationary Employees:</strong> A **30-day notice period** is applicable. The company reserves the right to relieve the employee earlier.</p>
            <p><strong>Confirmed Employees:</strong> A **90-day notice period** must be served. Employees unable to serve the full period are required to compensate the company by paying an amount equivalent to **two (2) months' gross salary**.</p>
            <h4>6.2 Resignation & Exit Process</h4>
            <p>Resignations must first be discussed confidentially with the Immediate Manager or HR Manager prior to the formal email submission. Managers must acknowledge and respond within five (5) working days and initiate retention conversation, if applicable.</p>

            <div class="hr-section-title">7. TERMINATION POLICY</div>
            <p>Lemonpay follows an “At-Will Employment” principle. Either party may terminate the employment relationship at any time, with or without cause, subject to applicable laws.</p>
            <h4>7.1 Grounds for Immediate Termination Include (but are not limited to):</h4>
            <table class="hr-termination-table">
                <thead>
                    <tr>
                        <th>S. No.</th>
                        <th>Grounds for Termination</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td>1</td><td>Providing false or misleading information during recruitment or in any official documents.</td></tr>
                    <tr><td>2</td><td>Poor job performance or failure to carry out assigned responsibilities.</td></tr>
                    <tr><td>3</td><td>Falsifying or failing to complete attendance or time records.</td></tr>
                    <tr><td>4</td><td>Insubordination or refusal to comply with reasonable instructions, including overtime.</td></tr>
                    <tr><td>5</td><td>Negligence causing or likely to cause injury or property damage.</td></tr>
                    <tr><td>6</td><td>Fighting, verbal abuse, threats, or any form of physical altercation at the workplace.</td></tr>
                    <tr><td>7</td><td>Willful damage to company or others' property.</td></tr>
                    <tr><td>8</td><td>Breach of confidentiality or unauthorized disclosure of sensitive company information.</td></tr>
                    <tr><td>9</td><td>Conflict of interest or use of company information/resources for personal gain.</td></tr>
                    <tr><td>10</td><td>Unauthorized use, removal, or theft of company assets or resources.</td></tr>
                    <tr><td>11</td><td>Dishonesty, theft, or fraud.</td></tr>
                    <tr><td>12</td><td>Use, possession, or sale of alcohol/drugs during work hours or on company premises.</td></tr>
                    <tr><td>13</td><td>Possession of firearms or weapons on company property.</td></tr>
                    <tr><td>14</td><td>Habitual tardiness, excessive absenteeism, or absence without proper notice.</td></tr>
                    <tr><td>15</td><td>Engaging in discriminatory behavior, harassment, or sexual misconduct.</td></tr>
                </tbody>
            </table>

            <div class="hr-section-title">8. POSH (Prevention of Sexual Harassment) POLICY</div>
            <p>Lemonpay strictly adheres to the POSH Act, 2013 to ensure a safe, respectful, and inclusive work environment. An Internal Committee (IC) is constituted to investigate complaints. All complaints will be treated with utmost confidentiality, and appropriate disciplinary action will be taken. Employees are encouraged to report any inappropriate behavior to the IC or HR.</p>

            <div class="hr-section-title">9. RETURN OF COMPANY PROPERTY</div>
            <p>Employees must return all company-owned property and assets before the exit date, including Laptops, mobile devices, ID cards, official documents, etc. Any salary advances or loans must be cleared before final settlement.</p>

            <div class="hr-section-title">10. FINAL HANDOVER PROCESS</div>
            <p>A structured final handover is mandatory and must include: completion of work, knowledge transfer, password handovers, and account closures. The **Final Clearance Form** must be signed by the respective Reporting Manager, HR, and relevant departments before initiating the Full & Final Settlement.</p>

            <div class="hr-section-title">11. GENERAL WORKPLACE SAFETY POLICY (FOR IT WORK ENVIRONMENT)</div>
            <p>Lemonpay prioritizes employee health and safety. Measures include: regular fire safety equipment inspection, annual emergency evacuation drills, accessible first aid kits, and ergonomic IT asset maintenance. Employees must report unsafe conditions immediately.</p>

            <div class="hr-section-title">12. NO PARTNERSHIP</div>
            <p>Nothing herein shall or shall be deemed to create any partnership or joint venture between the Employee & Company.</p>

            <div class="hr-section-title">13. POLICY AMENDMENTS</div>
            <p>Lemonpay reserves the right to revise, amend, or withdraw any portion of this policy manual as needed. Employees will be informed of any significant updates in a timely manner.</p>
            
            <p style="margin-top:20%; font-weight: bold;">I, <span>${employeeName}</span>, declare that I have no objection to these terms and will comply fully with the policies stated above. I understand that failure to comply with these policies may result in disciplinary action, up to and including termination or legal recovery, if applicable.</p>
        </div>
        
        <div class="hr-signature-block" style="margin-top:40%;">
            <p><strong>Employee Signature</strong></p>
            
            <p>Designation: <span>${employeeDesignation}</span></p>
            <p>Date: ${todayDate}</p>

            <div class="hr-signature-block-row" style="margin-top:40%;">
                <div class="hr-signature-col">
                    <p style="margin-bottom: 5px;">HR Manager: S SIVAKUMAR</p>
                    <div class="hr-signature-line">Signature</div>
                    <p style="text-align: center;">Date: ${todayDate}</p>
                </div>
                <div class="hr-signature-col">
                    <p style="margin-bottom: 5px;">Reporting Manager: ${reportingManagerName}</p>
                    <div class="hr-signature-line">Signature</div>
                    <p style="text-align: center;">Date: ${todayDate}</p>
                </div>
            </div>
        </div>
        
    </div>
  `;

  const html = `
  <html>
    <head>
      <title>${forPrint ? "Laptop & Asset Policy" : "Preview"} — ${employeeName}</title>
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <style>${styles}</style>
    </head>

    <body>
      <div class="a4-sheet">
        <div class="header">
          <div class="logo-row">
            <img src="${logoUrl}" alt="Company Logo" class="hlogo"/>
          </div>

          <div class="title-row">
            <h1 class="main-heading">Lemonpay - PC, Windows Laptop, and Apple Mac Usage Policy</h1>
            <p style="font-size: 14px; font-weight:bold; margin: 2px 0; color: #000000ff;">${escapeHtml(
              addressLine1
            )}</p>
            <p style="font-size: 14px; margin: 0; color: #000000ff;">${escapeHtml(addressLine2)}</p>
          </div>
        </div>

        <div class="content-body">
          ${policyHtml}
        </div>
        
        <div class="table">${assetInfoTableHtml}</div>      
        <div class="ack">${acknowledgmentHtml}</div>    
        
      </div>
  
      <div class="a4-sheet">
        ${hrPolicyHtml}
      </div>

      ${forPrint ? `<script>setTimeout(()=>{ window.print(); }, 250);</script>` : ""}
    </body>
  </html>
  `;

  return html;
}

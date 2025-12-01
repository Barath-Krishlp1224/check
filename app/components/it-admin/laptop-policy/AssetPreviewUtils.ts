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
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = today.getFullYear();
  return `${day}-${month}-${year}`;
}

export function renderPreviewHtml(asset: Asset, forPrint = false) {
  const logoUrl = "/logo hd.png";
  const addressLine1 = "No. 303, Kamaraj Salai, Pillaithottam, Pondicherry - 605 013";
  const addressLine2 = "CIN: U62099PY2023PTC009018";

  const todayDate = getFormattedDate();

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
      justify-content: center;
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
    }

    .a4-sheet::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image: url('/logo hd.png');
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
    .section-title, .section-title-7 {
      font-size: 14px;
      font-weight: 700;
      margin-top: 14px;
      color: #000;
      padding-bottom: 6px;
      
    }

    .content-body p {
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
        margin-top: 10%;}


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
      <img src="${logoUrl}" alt="Company Logo" class="logo" style="width: 35%; display: inline-block;" />
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
      <h4 style="margin: 0; padding: 0;">Asset & Employee Details</h4>
        <td colspan="2">
        
          <div class="data-section">
            <h4>Employee Details</h4>
            <div class="data-row"><div class="data-label">Name:</div><div class="data-value">${escapeHtml(asset.name)}</div></div>
            <div class="data-row"><div class="data-label">Employee ID:</div><div class="data-value">${escapeHtml(asset.empId)}</div></div>
            <div class="data-row"><div class="data-label">Designation:</div><div class="data-value">${escapeHtml(asset.designation)}</div></div>
            <div class="data-row"><div class="data-label">Team:</div><div class="data-value">${escapeHtml(asset.team)}</div></div>
          </div>
          
          <hr class="data-separator" />
          
          <div class="data-section">
            <h4>Asset Details</h4>
            <div class="data-row"><div class="data-label">Device Type:</div><div class="data-value">${escapeHtml(asset.deviceType)}</div></div>
            <div class="data-row"><div class="data-label">Model:</div><div class="data-value">${escapeHtml(asset.laptopModel ?? 'N/A')}</div></div>
            <div class="data-row"><div class="data-label">Serial Number:</div><div class="data-value">${escapeHtml(asset.serialNumber ?? 'N/A')}</div></div>
            <div class="data-row"><div class="data-label">MAC Address:</div><div class="data-value">${escapeHtml(asset.macAddress ?? 'N/A')}</div></div>
            <div class="data-row"><div class="data-label">Purchase Date:</div><div class="data-value">${escapeHtml(asset.purchaseDate ?? 'N/A')}</div></div>
            <div class="data-row"><div class="data-label">Accessories:</div><div class="data-value">${escapeHtml((asset.allAccessories ?? []).join(", ") || 'None')}</div></div>
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


  const html = `
  <html>
    <head>
      <title>${forPrint ? "Laptop & Asset Policy" : "Preview"} — ${escapeHtml(asset.name ?? "Asset")}</title>
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <style>${styles}</style>
    </head>

    <body>
      <div class="a4-sheet">
        <div class="header">
          <div class="logo-row">
            <img src="${logoUrl}" alt="Company Logo" class="hlogo" />
          </div>

          <div class="title-row">
            <h1 class="main-heading">Lemonpay - PC, Windows Laptop, and Apple Mac Usage Policy</h1>
            <p style="font-size: 14px; font-weight:bold; margin: 2px 0; color: #000000ff;">${escapeHtml(addressLine1)}</p>
            <p style="font-size: 14px; margin: 0; color: #000000ff;">${escapeHtml(addressLine2)}</p>
          </div>
        </div>

        <div class="content-body">
          ${policyHtml}
        </div>
        <div class="logo-row">
            <img src="${logoUrl}" alt="Company Logo" class="hlogo" />
          </div>
        
        <div class="table">${assetInfoTableHtml}</div>        
        <div class="ack"> ${acknowledgmentHtml}</div>    
        
      </div>

      ${forPrint ? `<script>setTimeout(()=>{ window.print(); }, 250);</script>` : ""}
    </body>
  </html>
  `;

  return html;
}
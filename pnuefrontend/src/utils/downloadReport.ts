export interface ReportPrescription {
  medication: string;
  dosage: string;
  instructions: string;
  doctor_notes?: string | null;
  date_issued?: string | null;
}

export interface ReportData {
  patient_name: string;
  patient_email: string;
  patient_age?: number | string | null;
  patient_gender?: string | null;
  patient_blood_group?: string | null;
  patient_contact?: string | null;
  scan_id?: number | string;
  scan_result: string;
  scan_confidence: number;
  scan_image_url?: string | null;
  scan_date: string;
  doctor_remarks?: string | null;
  prescriptions?: ReportPrescription[];
}

export function downloadDiagnosticReport(data: ReportData) {
  const printWindow = window.open("", "_blank", "width=900,height=1000");

  if (!printWindow) {
    alert("Please allow popups to download the diagnostic report.");
    return;
  }

  const confidencePct = (data.scan_confidence * 100).toFixed(1);
  const isPneumonia = data.scan_result.toLowerCase() !== "normal";
  const formattedDate = new Date(data.scan_date).toLocaleString();

  const prescriptionsHtml =
    data.prescriptions && data.prescriptions.length > 0
      ? data.prescriptions
          .map(
            (p, idx) => `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px; font-weight: 600; color: #1e1b4b;">${idx + 1}. ${p.medication}</td>
            <td style="padding: 10px; color: #334155;">${p.dosage}</td>
            <td style="padding: 10px; color: #334155;">${p.instructions}</td>
            <td style="padding: 10px; color: #64748b; font-style: italic;">${p.doctor_notes || "—"}</td>
          </tr>
        `
          )
          .join("")
      : `
        <tr>
          <td colspan="4" style="padding: 16px; text-align: center; color: #64748b; font-style: italic;">
            No specific prescriptions issued for this diagnostic record.
          </td>
        </tr>
      `;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Diagnostic Report & Prescription - ${data.patient_name}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          body {
            font-family: 'Inter', sans-serif;
            margin: 0;
            padding: 40px;
            color: #0f172a;
            background-color: #ffffff;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .brand {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .brand-title {
            font-size: 24px;
            font-weight: 700;
            color: #1e1b4b;
            letter-spacing: -0.5px;
          }
          .brand-sub {
            font-size: 12px;
            color: #64748b;
            font-weight: 500;
          }
          .badge-report {
            background-color: #f1f5f9;
            color: #1e1b4b;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            border: 1px solid #cbd5e1;
          }
          .section-title {
            font-size: 14px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #475569;
            margin-bottom: 12px;
            border-left: 4px solid #4f46e5;
            padding-left: 10px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            background-color: #f8fafc;
            padding: 20px;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            margin-bottom: 30px;
          }
          .info-item label {
            font-size: 11px;
            text-transform: uppercase;
            color: #64748b;
            font-weight: 600;
            display: block;
            margin-bottom: 4px;
          }
          .info-item span {
            font-size: 14px;
            font-weight: 600;
            color: #0f172a;
          }
          .scan-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
            margin-bottom: 30px;
          }
          .scan-image-box {
            background-color: #020617;
            border-radius: 12px;
            padding: 12px;
            text-align: center;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 220px;
          }
          .scan-image-box img {
            max-width: 100%;
            max-height: 250px;
            border-radius: 8px;
            object-fit: contain;
          }
          .result-card {
            background-color: #f8fafc;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            padding: 20px;
            display: flex;
            flex-col;
            justify-content: space-between;
          }
          .result-badge {
            display: inline-block;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 16px;
            font-weight: 700;
            color: white;
            margin-bottom: 10px;
            background-color: ${isPneumonia ? "#dc2626" : "#059669"};
          }
          .remarks-box {
            background-color: #ffffff;
            border: 1px solid #cbd5e1;
            padding: 12px;
            border-radius: 8px;
            font-style: italic;
            font-size: 13px;
            color: #334155;
            margin-top: 10px;
          }
          .prescription-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
            margin-bottom: 30px;
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid #e2e8f0;
          }
          .prescription-table th {
            background-color: #f1f5f9;
            color: #475569;
            text-transform: uppercase;
            font-size: 11px;
            padding: 12px 10px;
            text-align: left;
          }
          .footer {
            border-top: 2px solid #e2e8f0;
            padding-top: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 11px;
            color: #64748b;
          }
          .signature-line {
            border-top: 1px solid #0f172a;
            width: 180px;
            text-align: center;
            padding-top: 6px;
            font-weight: 600;
            color: #0f172a;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">
            <div>
              <div class="brand-title">Pneumonix AI</div>
              <div class="brand-sub">Clinical X-Ray Diagnostic Intelligence Portal</div>
            </div>
          </div>
          <div>
            <div class="badge-report">OFFICIAL CLINICAL REPORT</div>
            <div style="font-size: 11px; color: #64748b; text-align: right; margin-top: 4px;">
              Date: ${formattedDate}
            </div>
          </div>
        </div>

        <div class="section-title">Patient Demographics</div>
        <div class="info-grid">
          <div class="info-item">
            <label>Patient Full Name</label>
            <span>${data.patient_name}</span>
          </div>
          <div class="info-item">
            <label>Contact Email</label>
            <span>${data.patient_email}</span>
          </div>
          <div class="info-item">
            <label>Age / Gender</label>
            <span>${data.patient_age ? `${data.patient_age} yrs` : "N/A"} • ${data.patient_gender || "N/A"}</span>
          </div>
          <div class="info-item">
            <label>Blood Group</label>
            <span>${data.patient_blood_group || "N/A"}</span>
          </div>
          <div class="info-item">
            <label>Contact Phone</label>
            <span>${data.patient_contact || "N/A"}</span>
          </div>
          <div class="info-item">
            <label>Scan Record ID</label>
            <span>#SCAN-${data.scan_id || "REF"}</span>
          </div>
        </div>

        <div class="section-title">Radiograph Diagnostic Scan & Finding</div>
        <div class="scan-container">
          <div class="scan-image-box">
            ${
              data.scan_image_url
                ? `<img src="${data.scan_image_url}" alt="Chest X-Ray" />`
                : `<div style="color: #64748b; font-size: 12px;">X-Ray Radiograph Attached</div>`
            }
          </div>
          <div class="result-card">
            <div>
              <div style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; margin-bottom: 6px;">
                AI Classification Result
              </div>
              <div class="result-badge">${data.scan_result}</div>
              <div style="font-size: 13px; font-weight: 600; color: #1e1b4b; margin-top: 8px;">
                Confidence Score: ${confidencePct}%
              </div>
            </div>

            <div>
              <div style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; margin-top: 14px;">
                Attending Practitioner Remarks
              </div>
              <div class="remarks-box">
                "${data.doctor_remarks || "No additional clinical remarks logged."}"
              </div>
            </div>
          </div>
        </div>

        <div class="section-title">Prescription & Medication Protocol</div>
        <table class="prescription-table">
          <thead>
            <tr>
              <th>Medication Name</th>
              <th>Dosage</th>
              <th>Instructions for Use</th>
              <th>Clinical Notes</th>
            </tr>
          </thead>
          <tbody>
            ${prescriptionsHtml}
          </tbody>
        </table>

        <div class="footer">
          <div>
            <div><strong>Pneumonix AI System Verification</strong></div>
            <div>HIPAA Compliant Diagnostic Summary Report</div>
          </div>
          <div class="signature-line">
            Attending Physician Signature
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 600);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

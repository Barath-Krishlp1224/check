import jsPDF from 'jspdf';

export interface Staff {
  _id?: string;
  name: string;
  empId: string;
  role: string;
  salary: number; 
  doj: string;        
  bankAccount: string; 
  displayName?: string;
  department?: string;
  basic?: number;
  hra?: number;
  bonus?: number;
  specialAllowance?: number;
  pf?: number;
  incomeTax?: number;
  healthInsurance?: number;
  professionalTax?: number;
}

const LOGO_IMAGE = "/logo hd.png";
const LOC_ICON = "/loc.png";
const CAL_ICON = "/call.png";
const MAIL_ICON = "/mail.png";

const numberToWords = (num: number): string => {
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const format = (n: number): string => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + format(n % 100) : '');
    if (n < 100000) return format(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + format(n % 1000) : '');
    return n.toString();
  };
  return format(Math.floor(num)) + " Rupees Only";
};

export const generatePayslip = async (person: Staff, action: 'download' | 'view' = 'download', paymentDate?: Date) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Use the passed date or default to current date
  const selectedDate = paymentDate || new Date();
  
  const ICON_SIZE_MM = 8.467; 
  const SMALL_ICON_SIZE = 3.2;
  const DOT_SIZE = 2.91; 

  // --- LOGIC: CALCULATION ---
  const basic = person.basic ?? (person.salary * 0.45);
  const hra = person.hra ?? (person.salary * 0.20);
  const bonus = person.bonus ?? 0;
  const special = person.specialAllowance ?? (person.salary - (basic + hra + bonus)); 
  
  const pf = person.pf ?? 0;
  const pt = person.professionalTax ?? 0;
  const insurance = person.healthInsurance ?? 0;
  const itax = person.incomeTax ?? 0;
  
  const totalEarnings = basic + hra + bonus + special;
  const totalDeductions = pf + pt + insurance + itax;
  const netSalary = totalEarnings - totalDeductions;

  // --- UI HELPERS ---
  const drawGradientText = (text: string, x: number, y: number, colors: string[], fontSize: number, align: 'left' | 'right' = 'left') => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const scale = 4;
    ctx.font = `bold ${fontSize * scale}px Helvetica`;
    const textMetrics = ctx.measureText(text);
    canvas.width = textMetrics.width;
    canvas.height = fontSize * scale * 1.5;
    ctx.font = `bold ${fontSize * scale}px Helvetica`;
    ctx.textBaseline = 'middle';
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(1, colors[1]);
    ctx.fillStyle = gradient;
    ctx.fillText(text, 0, canvas.height / 2);
    const textWidthMM = (textMetrics.width / scale) * 0.264583;
    const textHeightMM = (canvas.height / scale) * 0.264583;
    const finalX = align === 'right' ? x - textWidthMM : x;
    const finalY = y - (textHeightMM / 2);
    doc.addImage(canvas.toDataURL("image/png"), 'PNG', finalX, finalY, textWidthMM, textHeightMM);
  };

  const drawShadow = (x: number, y: number, w: number, h: number, r: number, blur: number = 1.3, opacityFactor: number = 0.25, yOff: number = 0.26) => {
    const shadowSteps = 15;
    for (let i = shadowSteps; i > 0; i--) {
      const opacity = (opacityFactor / shadowSteps) * (1 - i / shadowSteps);
      doc.setGState(new (doc as any).GState({ opacity: opacity }));
      doc.setFillColor(0, 0, 0);
      const spread = (i / shadowSteps) * blur;
      doc.roundedRect(x - spread, y + yOff - spread, w + (spread * 2), h + (spread * 2), r, r, 'F');
    }
    doc.setGState(new (doc as any).GState({ opacity: 1 }));
  };

  const getSvgIconBase64 = (): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(4, 4); ctx.strokeStyle = "#0025FF"; ctx.lineWidth = 2.66; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath(); ctx.roundRect(5.33, 2.66, 21.33, 26.66, 2.66); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(12, 29.33); ctx.lineTo(12, 24); ctx.lineTo(20, 24); ctx.lineTo(20, 29.33); ctx.stroke();
    const windowCoords = [[10.66, 8], [16, 8], [21.33, 8], [10.66, 13.33], [16, 13.33], [21.33, 13.33], [10.66, 18.66], [16, 18.66], [21.33, 18.66]];
    windowCoords.forEach(coord => { ctx.beginPath(); ctx.moveTo(coord[0], coord[1]); ctx.lineTo(coord[0] + 0.01, coord[1]); ctx.stroke(); });
    return canvas.toDataURL("image/png");
  };

  const getCalendarIconBase64 = (): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(4, 4); 
    ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 1.33; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath(); ctx.moveTo(5.33, 1.33); ctx.lineTo(5.33, 4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(10.66, 1.33); ctx.lineTo(10.66, 4); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(2, 2.66, 12, 12, 1.33); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(2, 6.66); ctx.lineTo(14, 6.66); ctx.stroke();
    return canvas.toDataURL("image/png");
  };

  // --- HEADER SECTION ---
  const headerH = 43.4;
  drawShadow(0, 0, pageWidth, headerH, 0, 2.6, 0.25, 1); 
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, headerH, 'F');

  const hBoxX = 15;
  const hBoxY = (headerH / 2) - 7;
  doc.setFillColor(240, 240, 255);
  doc.roundedRect(hBoxX, hBoxY, 14, 14, 2, 2, 'F');
  doc.addImage(getSvgIconBase64(), 'PNG', hBoxX + (14-ICON_SIZE_MM)/2, hBoxY + (14-ICON_SIZE_MM)/2, ICON_SIZE_MM, ICON_SIZE_MM);
  
  const textX = hBoxX + 18;
  doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "bold"); doc.setFontSize(14); 
  doc.text("Lemonpay Payment Solution's Private Limited", textX, hBoxY + 4);
  
  doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(80, 80, 80);
  try { doc.addImage(LOC_ICON, 'PNG', textX, hBoxY + 7.5, SMALL_ICON_SIZE, SMALL_ICON_SIZE); } catch(e){}
  doc.text("4th Floor, Tidel Neo IT Park, Tiruchitrambalam, Villupuram - 605111", textX + 4.5, hBoxY + 10);
  try { doc.addImage(MAIL_ICON, 'PNG', textX, hBoxY + 12.5, SMALL_ICON_SIZE, SMALL_ICON_SIZE); } catch(e){}
  doc.text("hr@lemonpay.tech", textX + 4.5, hBoxY + 15);
  const emailWidth = doc.getTextWidth("hr@lemonpay.tech");
  try { doc.addImage(CAL_ICON, 'PNG', textX + emailWidth + 12.5, hBoxY + 12.5, SMALL_ICON_SIZE, SMALL_ICON_SIZE); } catch(e){}
  doc.text("+91 xx xx xy yy yy", textX + emailWidth + 17, hBoxY + 15);
  try { doc.addImage(LOGO_IMAGE, 'PNG', pageWidth - 50, hBoxY, 35, 10); } catch (e) {}

  // --- CONTENT TITLE ---
  doc.setFontSize(22); doc.setFont("helvetica", "bold"); doc.setTextColor(147, 51, 234);
  doc.text("PAYSLIP", pageWidth / 2, headerH + 15, { align: 'center' });
  doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.setTextColor(100, 100, 100);
  doc.text(`Pay Period: ${selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}`, pageWidth / 2, headerH + 22, { align: 'center' });

  // --- EMPLOYEE CARD ---
  const cardY = headerH + 35;
  const cardHeight = 55;
  const cardWidth = pageWidth - 30;
  drawShadow(15, cardY, cardWidth, cardHeight, 3.5);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(15, cardY, cardWidth, cardHeight, 3.5, 3.5, 'F');
  
  doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(49, 66, 136);
  doc.text("Employee Information", 22, cardY + 10);
  const drawField = (label: string, value: string | number, x: number, y: number) => {
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(140);
    doc.text(label, x, y);
    doc.setFont("helvetica", "bold"); doc.setFontSize(9.5); doc.setTextColor(20);
    doc.text(String(value || ''), x, y + 5);
  };
  drawField("Employee Name", person.name, 22, cardY + 20);
  drawField("Employee ID", person.empId, 110, cardY + 20);
  drawField("Designation", person.role, 22, cardY + 33);
  drawField("Date of Joining", person.doj, 110, cardY + 33);
  drawField("Department", person.department || "Engineering", 22, cardY + 46);
  drawField("Bank Account", person.bankAccount, 110, cardY + 46);

  // --- TABLES SECTION ---
  const sectionY = cardY + cardHeight + 8;
  const boxWidth = (pageWidth - 40) / 2;
  const boxHeight = 85;

  const drawTable = (x: number, y: number, title: string, data: {l: string, v: number}[], accent: string[], isEarning: boolean) => {
    drawShadow(x, y, boxWidth, boxHeight, 3);
    if (isEarning) doc.setFillColor(220, 252, 231); else doc.setFillColor(255, 226, 226);
    doc.roundedRect(x, y, boxWidth, boxHeight, 3, 3, 'F');
    if (isEarning) doc.setFillColor(0, 128, 54); else doc.setFillColor(193, 0, 7);
    doc.ellipse(x + 10, y + 10, DOT_SIZE/2, DOT_SIZE/2, 'F');
    drawGradientText(title, x + 15, y + 10, accent, 13);
    
    data.forEach((item, i) => {
      const rowY = y + 25 + (i * 11);
      doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(60, 60, 60);
      doc.text(item.l, x + 8, rowY);
      doc.setTextColor(20);
      doc.text(`${item.v.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, x + boxWidth - 8, rowY, { align: 'right' });
      doc.setDrawColor(isEarning ? 187 : 220, isEarning ? 220 : 180, isEarning ? 190 : 180); 
      doc.setLineWidth(0.1);
      doc.line(x + 8, rowY + 3, x + boxWidth - 8, rowY + 3);
    });
    
    doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(0, 0, 0);
    doc.text(`Total ${title}`, x + 8, y + boxHeight - 10);
    const total = data.reduce((s, i) => s + i.v, 0);
    drawGradientText(`${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, x + boxWidth - 8, y + boxHeight - 10, accent, 12, 'right');
  };

  drawTable(15, sectionY, "Earnings", [
    { l: "Basic Salary", v: basic }, { l: "HRA", v: hra }, { l: "Performance Bonus", v: bonus }, { l: "Special Allowance", v: special }
  ], ["#008236", "#007A55"], true);

  drawTable(pageWidth - 15 - boxWidth, sectionY, "Deductions", [
    { l: "Income Tax", v: itax }, { l: "Provident Fund", v: pf }, { l: "Health Insurance", v: insurance }, { l: "Professional Tax", v: pt }
  ], ["#C10007", "#CA3500"], false);

  // --- SUMMARY BAR (BLACK BOX) ---
  const summaryY = sectionY + boxHeight + 10;
  const summaryH = 32;
  const outerBoxWidth = pageWidth - 30;
  doc.setFillColor(0, 0, 0);
  doc.roundedRect(15, summaryY, outerBoxWidth, summaryH, 3, 3, 'F');
  
  doc.setTextColor(180, 180, 180); doc.setFontSize(8.5); 
  doc.text(`Net Pay for ${selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}`, 23, summaryY + 8);
  
  doc.setTextColor(255, 255, 255); doc.setFontSize(19); doc.setFont("helvetica", "bold");
  const salaryStr = `Rs. ${netSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  doc.text(salaryStr, 23, summaryY + 17);
  
  const iconX = 23; 
  const iconY = summaryY + 21.5; 
  const iconSize = 3.5;

  try {
    doc.addImage(getCalendarIconBase64(), 'PNG', iconX, iconY, iconSize, iconSize);
  } catch(e){}

  // Using dynamic date here
  const paidText = `Paid on ${selectedDate.toLocaleString('default', { month: 'long' })} ${selectedDate.getDate()}, ${selectedDate.getFullYear()}`;
  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(200, 200, 200);
  doc.text(paidText, iconX + 5, iconY + 2.8);

  const wordBoxW = 88; 
  const wordBoxH = 18; 
  const wordBoxX = pageWidth - 15 - wordBoxW - 5;
  const wordBoxY = summaryY + (summaryH - wordBoxH) / 2;

  doc.setGState(new (doc as any).GState({ opacity: 0.1 })); 
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(wordBoxX, wordBoxY, wordBoxW, wordBoxH, 2, 2, 'F');
  doc.setGState(new (doc as any).GState({ opacity: 0.2 })); 
  doc.setDrawColor(255, 255, 255); doc.setLineWidth(0.1);
  doc.roundedRect(wordBoxX, wordBoxY, wordBoxW, wordBoxH, 2, 2, 'S');
  doc.setGState(new (doc as any).GState({ opacity: 1 }));

  doc.setTextColor(255, 255, 255); doc.setFontSize(7.5);
  const amountWords = numberToWords(netSalary);
  const splitWords = doc.splitTextToSize(amountWords, wordBoxW - 8);
  doc.text(splitWords, wordBoxX + 4, wordBoxY + 7);

  // --- FOOTER ---
  doc.setFontSize(8); doc.setTextColor(150);
  doc.text("This is a computer-generated payslip and does not require a signature.", pageWidth / 2, 285, { align: 'center' });

  const fileName = `${person.name.replace(/\s+/g, '_')}_Payslip.pdf`;
  if (action === 'view') {
    window.open(doc.output('bloburl'), '_blank');
  } else {
    doc.save(fileName);
  }
};
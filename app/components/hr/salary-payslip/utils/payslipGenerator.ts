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

export const generatePayslip = async (person: Staff, action: 'download' | 'view' = 'download') => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const headerHeight = 35;
  const ICON_SIZE_MM = 8.467; 
  const SMALL_ICON_SIZE = 3.2;

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [0, 0, 0];
  };

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

  const drawShadow = (x: number, y: number, w: number, h: number, r: number) => {
    const shadowSteps = 12;
    const shadowBlur = 1.3;
    const shadowOpacity = 0.25;
    const yOffset = 0.26;
    for (let i = shadowSteps; i > 0; i--) {
      const opacity = (shadowOpacity / shadowSteps) * (1 - i / shadowSteps);
      doc.setGState(new (doc as any).GState({ opacity: opacity }));
      doc.setFillColor(0, 0, 0);
      const spread = (i / shadowSteps) * shadowBlur;
      doc.roundedRect(x - spread, y + yOffset - spread, w + (spread * 2), h + (spread * 2), r, r, 'F');
    }
    doc.setGState(new (doc as any).GState({ opacity: 1 }));
  };

  const getSvgIconBase64 = (): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(4, 4);
    ctx.strokeStyle = "#0025FF";
    ctx.lineWidth = 2.66;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.roundRect(5.33, 2.66, 21.33, 26.66, 2.66);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(12, 29.33);
    ctx.lineTo(12, 24);
    ctx.lineTo(20, 24);
    ctx.lineTo(20, 29.33);
    ctx.stroke();
    const windowCoords = [[10.66, 8], [16, 8], [21.33, 8], [10.66, 13.33], [16, 13.33], [21.33, 13.33], [10.66, 18.66], [16, 18.66], [21.33, 18.66]];
    windowCoords.forEach(coord => {
      ctx.beginPath();
      ctx.moveTo(coord[0], coord[1]);
      ctx.lineTo(coord[0] + 0.01, coord[1]);
      ctx.stroke();
    });
    return canvas.toDataURL("image/png");
  };

  const drawGlacierEffect = (x: number, y: number, w: number, h: number) => {
    const canvas = document.createElement('canvas');
    const scale = 4;
    canvas.width = w * scale * 3.78;
    canvas.height = h * scale * 3.78;
    const ctx = canvas.getContext('2d')!;
    
    const gradient = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, 0,
      canvas.width / 2, canvas.height / 2, canvas.width * 0.5
    );
    
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.25)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.15)');
    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.08)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    doc.addImage(canvas.toDataURL("image/png"), 'PNG', x, y, w, h);
  };

  const basic = person.salary * 0.45;
  const hra = person.salary * 0.20;
  const bonus = person.salary * 0.10;
  const special = person.salary - (basic + hra + bonus); 
  const pf = basic * 0.12;
  const pt = 200;
  const insurance = 500;
  const itax = person.salary > 50000 ? person.salary * 0.05 : 0;
  const totalEarnings = basic + hra + bonus + special;
  const totalDeductions = pf + pt + insurance + itax;
  const netSalary = totalEarnings - totalDeductions;

  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, headerHeight, 'F');

  const hBoxX = 15;
  const hBoxY = (headerHeight - 15) / 2;
  doc.setFillColor(240, 240, 255);
  doc.roundedRect(hBoxX, hBoxY, 14, 14, 2, 2, 'F');
  const iconOffset = (14 - ICON_SIZE_MM) / 2;
  doc.addImage(getSvgIconBase64(), 'PNG', hBoxX + iconOffset, hBoxY + iconOffset, ICON_SIZE_MM, ICON_SIZE_MM);
  const textX = hBoxX + 18;
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14); 
  doc.text("Lemonpay Payment Solution's Private Limited", textX, hBoxY + 4);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  try { doc.addImage(LOC_ICON, 'PNG', textX, hBoxY + 7.5, SMALL_ICON_SIZE, SMALL_ICON_SIZE); } catch(e){}
  doc.text("4th Floor, Tidel Neo IT Park, Tiruchitrambalam, Villupuram - 605111", textX + 4.5, hBoxY + 10);
  try { doc.addImage(MAIL_ICON, 'PNG', textX, hBoxY + 12.5, SMALL_ICON_SIZE, SMALL_ICON_SIZE); } catch(e){}
  doc.text("hr@lemonpay.tech", textX + 4.5, hBoxY + 15);
  const emailWidth = doc.getTextWidth("hr@lemonpay.tech");
  const phoneX = textX + 4.5 + emailWidth + 8; 
  try { doc.addImage(CAL_ICON, 'PNG', phoneX, hBoxY + 12.5, SMALL_ICON_SIZE, SMALL_ICON_SIZE); } catch(e){}
  doc.text("+91 xx xx xy yy yy", phoneX + 4.5, hBoxY + 15);
  try { doc.addImage(LOGO_IMAGE, 'PNG', pageWidth - 50, hBoxY, 35, 10); } catch (e) {}

  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(147, 51, 234);
  doc.text("PAYSLIP", pageWidth / 2, headerHeight + 15, { align: 'center' });
  const now = new Date();
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`Pay Period: ${now.toLocaleString('default', { month: 'long', year: 'numeric' })}`, pageWidth / 2, headerHeight + 22, { align: 'center' });
  doc.setFontSize(8);
  doc.text(`Payslip ID: PAY-${now.getFullYear()}-${Math.floor(100 + Math.random() * 900)}`, pageWidth / 2, headerHeight + 27, { align: 'center' });

  const cardY = headerHeight + 35;
  const cardHeight = 55;
  const cardWidth = pageWidth - 30;
  const cardX = 15;
  const radius = 3.5; 

  drawShadow(cardX, cardY, cardWidth, cardHeight, radius);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(cardX, cardY, cardWidth, cardHeight, radius, radius, 'F');
  doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(49, 66, 136);
  doc.text("Employee Information", 22, cardY + 10);
  const drawField = (label: string, value: string | number, x: number, y: number) => {
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(140);
    doc.text(label, x, y);
    doc.setFont("helvetica", "bold"); doc.setFontSize(9.5); doc.setTextColor(20);
    doc.text(String(value || ''), x, y + 5);
  };
  const col1 = 22, col2 = 110, rowH = 13;
  drawField("Employee Name", person.name, col1, cardY + 20);
  drawField("Employee ID", person.empId, col2, cardY + 20);
  drawField("Designation", person.role, col1, cardY + 20 + rowH);
  drawField("Date of Joining", person.doj, col2, cardY + 20 + rowH);
  drawField("Department", person.department || "Engineering", col1, cardY + 20 + (rowH * 2));
  drawField("Bank Account", person.bankAccount, col2, cardY + 20 + (rowH * 2));

  const sectionY = cardY + cardHeight + 8;
  const boxWidth = (pageWidth - 40) / 2;
  const boxHeight = 85;

  const drawTable = (x: number, y: number, title: string, data: {l: string, v: number}[], accent: string[], isEarning: boolean) => {
    drawShadow(x, y, boxWidth, boxHeight, 3);
    
    if (isEarning) {
      for (let i = 0; i < boxHeight; i += 0.5) {
        const ratio = i / boxHeight;
        const r = Math.floor(240 + (236 - 240) * ratio);
        const g = 253;
        const b = Math.floor(244 + (245 - 244) * ratio);
        doc.setFillColor(r, g, b);
        doc.rect(x, y + i, boxWidth, 0.6, 'F');
      }
      doc.setDrawColor(240, 253, 244);
      doc.roundedRect(x, y, boxWidth, boxHeight, 3, 3, 'S');
    } else {
      doc.setFillColor(255, 240, 240);
      doc.roundedRect(x, y, boxWidth, boxHeight, 3, 3, 'F');
    }

    drawGradientText(title, x + 10, y + 10, accent, 13);
    const rgb = hexToRgb(accent[0]);
    doc.setFillColor(rgb[0], rgb[1], rgb[2]);
    doc.circle(x + 6, y + 10, 1.2, 'F');
    const lineColor = hexToRgb(isEarning ? "#DCFCE7" : "#FFE2E2");
    const rowSpacing = 11;
    data.forEach((item, i) => {
      const rowY = y + 25 + (i * rowSpacing);
      doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(100);
      doc.text(item.l, x + 8, rowY);
      doc.setTextColor(20);
      doc.text(`${item.v.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, x + boxWidth - 8, rowY, { align: 'right' });
      doc.setDrawColor(lineColor[0], lineColor[1], lineColor[2]);
      doc.setLineWidth(0.1);
      doc.line(x + 8, rowY + 3, x + boxWidth - 8, rowY + 3);
    });
    doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(0, 0, 0);
    doc.text(`Total ${title}`, x + 8, y + boxHeight - 10);
    const total = data.reduce((s, i) => s + i.v, 0);
    drawGradientText(`${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, x + boxWidth - 8, y + boxHeight - 10, accent, 12, 'right');
  };

  drawTable(15, sectionY, "Earnings", [{ l: "Basic Salary", v: basic }, { l: "HRA", v: hra }, { l: "Performance Bonus", v: bonus }, { l: "Special Allowance", v: special }], ["#008236", "#007A55"], true);
  drawTable(pageWidth - 15 - boxWidth, sectionY, "Deductions", [{ l: "Income Tax", v: itax }, { l: "Provident Fund", v: pf }, { l: "Health Insurance", v: insurance }, { l: "Professional Tax", v: pt }], ["#C10007", "#CA3500"], false);

  const summaryY = sectionY + boxHeight + 10;
  const outerBoxHeight = 32;
  const outerBoxWidth = pageWidth - 30;
  
  doc.setFillColor(0, 0, 0);
  doc.roundedRect(15, summaryY, outerBoxWidth, outerBoxHeight, 3, 3, 'F');
  
  drawGlacierEffect(15, summaryY, outerBoxWidth, outerBoxHeight);
  
  doc.setTextColor(200); 
  doc.setFontSize(9); 
  doc.text(`Net Pay for ${now.toLocaleString('default', { month: 'long', year: 'numeric' })}`, 23, summaryY + 8);
  doc.setTextColor(255); 
  doc.setFontSize(20); 
  doc.text(`Rs. ${netSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 23, summaryY + 19);
  
  const fullMonth = now.toLocaleString('en-US', { month: 'long' });
  const paidDateFormatted = `Paid on ${fullMonth} ${now.getDate()}, ${now.getFullYear()}`;
  doc.setFontSize(8); 
  doc.setTextColor(180); 
  doc.text(paidDateFormatted, 23, summaryY + 26);

  const glassWidth = 89.5; 
  const glassHeight = 22; 
  const glassX = pageWidth - 15 - glassWidth - 5;
  const glassY = summaryY + (outerBoxHeight - glassHeight) / 2;

  doc.setGState(new (doc as any).GState({ opacity: 0.1 }));
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(glassX, glassY, glassWidth, glassHeight, 2.6, 2.6, 'F');
  doc.setGState(new (doc as any).GState({ opacity: 0.2 }));
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.2);
  doc.roundedRect(glassX, glassY, glassWidth, glassHeight, 2.6, 2.6, 'S');
  doc.setGState(new (doc as any).GState({ opacity: 1 }));
  const rgbF3E8FF = hexToRgb("#F3E8FF");
  doc.setTextColor(rgbF3E8FF[0], rgbF3E8FF[1], rgbF3E8FF[2]);
  doc.setFontSize(10.5); 
  doc.setFont("helvetica", "normal");
  const amountWords = numberToWords(netSalary);
  const paddingX = 4.4; 
  const splitWords = doc.splitTextToSize(amountWords, glassWidth - (paddingX * 2));
  doc.text(splitWords, glassX + glassWidth - paddingX, glassY + 10, { align: 'right', lineHeightFactor: 1.42 });

  const lineY = summaryY + outerBoxHeight + 15;
  const rgbLine = hexToRgb("#E2E8F0");
  doc.setDrawColor(rgbLine[0], rgbLine[1], rgbLine[2]);
  doc.setLineWidth(0.4);
  doc.line(15, lineY, pageWidth - 15, lineY);

  doc.setFontSize(8); doc.setTextColor(150);
  doc.text("This is a computer-generated payslip and does not require a signature. For any queries, please contact the HR department.", pageWidth / 2, 285, { align: 'center' });

  const monthName = now.toLocaleString('default', { month: 'long' });
  const year = now.getFullYear();
  const cleanName = person.name.replace(/\s+/g, '_');
  const fileName = `${cleanName}_${monthName}_${year}_Payslip.pdf`;

  if (action === 'view') {
    doc.setProperties({ title: fileName });
    window.open(doc.output('bloburl'), '_blank');
  } else {
    doc.save(fileName);
  }
};
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Staff {
  name: string;
  empId: string;
  role: string;
  salary: number;
}

export const generatePayslip = (person: Staff, action: 'download' | 'view' = 'download') => {
  const doc = new jsPDF();
  const s = person.salary || 0;
  const hra = s * 0.4;
  const net = s + hra;

  // White background with thin border
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.rect(10, 10, 190, 277, 'S');

  // Header - Simple black text on white
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(26);
  doc.setFont("helvetica", "bold");
  doc.text("Lemonpay", 105, 30, { align: 'center' });
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text("Official Salary Statement", 105, 38, { align: 'center' });

  // Divider line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(20, 45, 190, 45);

  // Employee Information Section
  autoTable(doc, {
    startY: 55,
    head: [[{ 
      content: 'EMPLOYEE INFORMATION', 
      colSpan: 2, 
      styles: { 
        halign: 'left',
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 11,
        cellPadding: { top: 5, bottom: 5, left: 0, right: 0 }
      } 
    }]],
    body: [
      ['Employee Name', person.name],
      ['Employee ID', person.empId],
      ['Designation', person.role],
      ['Pay Period', new Date().toLocaleString('default', { month: 'long', year: 'numeric' })],
    ],
    theme: 'plain',
    styles: { 
      fontSize: 10,
      cellPadding: { top: 4, bottom: 4, left: 0, right: 5 },
      textColor: [0, 0, 0]
    },
    columnStyles: { 
      0: { 
        fontStyle: 'bold',
        cellWidth: 60,
        textColor: [80, 80, 80]
      },
      1: {
        cellWidth: 110
      }
    },
    margin: { left: 20, right: 20 }
  });

  const firstTableBottom = (doc as any).lastAutoTable.finalY;

  // Earnings Section
  autoTable(doc, {
    startY: firstTableBottom + 15,
    head: [[{ 
      content: 'SALARY BREAKDOWN', 
      colSpan: 2, 
      styles: { 
        halign: 'left',
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 11,
        cellPadding: { top: 5, bottom: 5, left: 0, right: 0 }
      } 
    }]],
    body: [
      ['Basic Salary', `₹ ${s.toLocaleString('en-IN')}`],
      ['HRA (House Rent Allowance)', `₹ ${hra.toLocaleString('en-IN')}`],
    ],
    theme: 'plain',
    styles: { 
      fontSize: 10,
      cellPadding: { top: 4, bottom: 4, left: 0, right: 5 },
      textColor: [0, 0, 0]
    },
    columnStyles: { 
      0: { 
        cellWidth: 100,
        textColor: [80, 80, 80]
      },
      1: {
        halign: 'right',
        cellWidth: 70
      }
    },
    margin: { left: 20, right: 20 }
  });

  const secondTableBottom = (doc as any).lastAutoTable.finalY;

  // Divider before total
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(20, secondTableBottom + 5, 190, secondTableBottom + 5);

  // Total Net Payable
  autoTable(doc, {
    startY: secondTableBottom + 10,
    body: [
      [{ 
        content: 'TOTAL NET PAYABLE', 
        styles: { 
          fontStyle: 'bold',
          fontSize: 11,
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          cellPadding: { top: 6, bottom: 6, left: 0, right: 5 }
        } 
      }, 
      { 
        content: `₹ ${net.toLocaleString('en-IN')}`, 
        styles: { 
          fontStyle: 'bold',
          fontSize: 11,
          halign: 'right',
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          cellPadding: { top: 6, bottom: 6, left: 0, right: 5 }
        } 
      }],
    ],
    theme: 'plain',
    columnStyles: { 
      0: { cellWidth: 100 },
      1: { cellWidth: 70 }
    },
    margin: { left: 20, right: 20 }
  });

  // Footer section
  const finalY = (doc as any).lastAutoTable.finalY + 40;
  
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text("This is a computer-generated document and does not require a physical signature.", 105, finalY, { align: 'center' });

  // Signature line
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.3);
  doc.line(130, finalY + 20, 180, finalY + 20);
  
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text("Authorized Signatory", 155, finalY + 26, { align: 'center' });

  // Date at bottom
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 105, 280, { align: 'center' });

  if (action === 'view') {
    window.open(doc.output('bloburl'), '_blank');
  } else {
    doc.save(`Payslip_${person.empId}_${new Date().toLocaleDateString('en-IN').replace(/\//g, '-')}.pdf`);
  }
};
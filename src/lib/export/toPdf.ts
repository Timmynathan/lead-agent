import PDFDocument from "pdfkit";
import type { LeadRow, RunRow } from "@/lib/supabase/types";

const INK = "#0F0F0E";
const MUTED = "#667085";
const BRAND = "#FFC91F";

function heading(doc: PDFKit.PDFDocument, text: string) {
  doc.moveDown(0.6).fontSize(13).fillColor(INK).font("Helvetica-Bold").text(text);
  doc.moveTo(doc.x, doc.y + 2).lineTo(doc.page.width - 50, doc.y + 2).strokeColor("#E5E7EB").stroke();
  doc.moveDown(0.3);
}

function bulletList(doc: PDFKit.PDFDocument, items: string[]) {
  doc.fontSize(10).font("Helvetica").fillColor(INK);
  items.forEach((item) => doc.text(`• ${item}`, { indent: 10 }));
}

function leadSection(doc: PDFKit.PDFDocument, lead: LeadRow) {
  doc.addPage();

  doc.fontSize(17).font("Helvetica-Bold").fillColor(INK).text(lead.company_name, { continued: true });
  doc.font("Helvetica").fontSize(11).fillColor(MUTED).text(`  (${lead.company_domain})`);

  doc.moveDown(0.3).fontSize(10).font("Helvetica-Bold").fillColor(INK).text("Confidence: ", { continued: true });
  doc.font("Helvetica").text(`${Math.round(lead.confidence * 100)}%`);

  if (lead.fit_reasons.length > 0) {
    heading(doc, "Fit reasons");
    bulletList(doc, lead.fit_reasons);
  }

  if (lead.concerns.length > 0) {
    heading(doc, "Concerns");
    bulletList(doc, lead.concerns);
  }

  heading(doc, "Source context");
  doc.fontSize(10).font("Helvetica").fillColor(INK).text(lead.source_summary);
  doc.moveDown(0.2);
  lead.source_urls.forEach((url) => doc.fontSize(9).fillColor("#175CD3").text(url));

  if (lead.outreach_emails) {
    heading(doc, "Outreach sequence");
    lead.outreach_emails.forEach((step, i) => {
      doc
        .moveDown(0.3)
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor(INK)
        .text(`Email ${i + 1}: ${step.subject}`);
      doc.font("Helvetica").fontSize(10).fillColor(INK).text(step.body);
      doc.font("Helvetica-Oblique").fontSize(9).fillColor(MUTED).text(step.personalization_note);
    });
  }

  if (lead.linkedin_message) {
    heading(doc, "LinkedIn message");
    doc.fontSize(10).font("Helvetica").fillColor(INK).text(lead.linkedin_message);
  }
}

export async function buildLeadsPdf(run: RunRow, leads: LeadRow[]): Promise<Buffer> {
  const qualified = leads.filter((l) => l.qualification_status === "qualified");

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, bufferPages: true });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.rect(0, 0, doc.page.width, 90).fill(BRAND);
    doc.fillColor(INK).fontSize(22).font("Helvetica-Bold").text("Scraping Bird", 50, 30);
    doc.fontSize(11).font("Helvetica").text("Qualified Lead List and Outreach Drafts", 50, 58);

    doc.fillColor(INK).fontSize(10).font("Helvetica-Bold").text("Objective", 50, 115);
    doc.font("Helvetica").fontSize(10).text(run.objective, 50, 130, { width: doc.page.width - 100 });

    doc.moveDown(1).font("Helvetica-Bold").text("Qualified leads: ", { continued: true });
    doc.font("Helvetica").text(`${qualified.length}`);

    qualified.forEach((lead) => leadSection(doc, lead));

    doc.end();
  });
}

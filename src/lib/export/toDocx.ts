import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  BorderStyle,
} from "docx";
import type { LeadRow, RunRow } from "@/lib/supabase/types";

function bulletList(items: string[]) {
  return items.map(
    (item) =>
      new Paragraph({
        text: item,
        bullet: { level: 0 },
        spacing: { after: 60 },
      })
  );
}

function leadSection(lead: LeadRow): Paragraph[] {
  const paragraphs: Paragraph[] = [
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 300, after: 100 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "E5E7EB" } },
      children: [
        new TextRun({ text: lead.company_name, bold: true }),
        new TextRun({ text: `  (${lead.company_domain})`, color: "667085" }),
      ],
    }),
    new Paragraph({
      spacing: { after: 120 },
      children: [
        new TextRun({ text: "Confidence: ", bold: true }),
        new TextRun({ text: `${Math.round(lead.confidence * 100)}%` }),
      ],
    }),
  ];

  if (lead.fit_reasons.length > 0) {
    paragraphs.push(
      new Paragraph({ text: "Fit reasons", heading: HeadingLevel.HEADING_4, spacing: { after: 60 } }),
      ...bulletList(lead.fit_reasons)
    );
  }

  if (lead.concerns.length > 0) {
    paragraphs.push(
      new Paragraph({ text: "Concerns", heading: HeadingLevel.HEADING_4, spacing: { before: 120, after: 60 } }),
      ...bulletList(lead.concerns)
    );
  }

  paragraphs.push(
    new Paragraph({ text: "Source context", heading: HeadingLevel.HEADING_4, spacing: { before: 120, after: 60 } }),
    new Paragraph({ text: lead.source_summary, spacing: { after: 60 } }),
    ...lead.source_urls.map(
      (url) => new Paragraph({ text: url, spacing: { after: 40 } })
    )
  );

  if (lead.outreach_emails) {
    paragraphs.push(
      new Paragraph({ text: "Outreach sequence", heading: HeadingLevel.HEADING_4, spacing: { before: 160, after: 80 } })
    );
    lead.outreach_emails.forEach((step, i) => {
      paragraphs.push(
        new Paragraph({
          spacing: { before: 100, after: 40 },
          children: [
            new TextRun({ text: `Email ${i + 1}: `, bold: true }),
            new TextRun({ text: step.subject, bold: true }),
          ],
        }),
        new Paragraph({ text: step.body, spacing: { after: 40 } }),
        new Paragraph({
          spacing: { after: 60 },
          children: [new TextRun({ text: step.personalization_note, italics: true, color: "667085" })],
        })
      );
    });
  }

  if (lead.linkedin_message) {
    paragraphs.push(
      new Paragraph({ text: "LinkedIn message", heading: HeadingLevel.HEADING_4, spacing: { before: 100, after: 60 } }),
      new Paragraph({ text: lead.linkedin_message, spacing: { after: 60 } })
    );
  }

  return paragraphs;
}

export async function buildLeadsDocx(run: RunRow, leads: LeadRow[]): Promise<Buffer> {
  const qualified = leads.filter((l) => l.qualification_status === "qualified");

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ text: "Scraping Bird", heading: HeadingLevel.TITLE }),
          new Paragraph({
            text: "Qualified Lead List and Outreach Drafts",
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 200 },
          }),
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({ text: "Objective: ", bold: true }),
              new TextRun({ text: run.objective }),
            ],
          }),
          new Paragraph({
            spacing: { after: 300 },
            children: [
              new TextRun({ text: "Qualified leads: ", bold: true }),
              new TextRun({ text: `${qualified.length}` }),
            ],
          }),
          ...qualified.flatMap(leadSection),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}

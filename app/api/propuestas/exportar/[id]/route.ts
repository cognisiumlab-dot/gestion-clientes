import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
} from "docx";

interface Seccion {
  titulo: string;
  contenido: string;
}

function parseMarkdown(text: string): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  const lines = text.split("\n");

  for (const line of lines) {
    if (line.trim() === "") {
      paragraphs.push(new Paragraph({ text: "" }));
      continue;
    }

    if (line.startsWith("- ")) {
      const content = line.slice(2);
      paragraphs.push(
        new Paragraph({
          children: parseBold(content),
          bullet: { level: 0 },
          spacing: { after: 60 },
        })
      );
      continue;
    }

    const runs = parseBold(line);
    paragraphs.push(
      new Paragraph({
        children: runs,
        spacing: { after: 80 },
      })
    );
  }

  return paragraphs;
}

function parseBold(text: string): TextRun[] {
  const runs: TextRun[] = [];
  const parts = text.split(/(\*\*[^*]+\*\*)/);
  for (const part of parts) {
    if (part.startsWith("**") && part.endsWith("**")) {
      runs.push(new TextRun({ text: part.slice(2, -2), bold: true, size: 22 }));
    } else if (part) {
      runs.push(new TextRun({ text: part, size: 22 }));
    }
  }
  return runs;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const propuesta = await prisma.propuesta.findUnique({ where: { id } });
  if (!propuesta) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  if (!propuesta.contenido) return NextResponse.json({ error: "La propuesta aún no ha sido generada" }, { status: 400 });

  let secciones: Seccion[] = [];
  try { secciones = JSON.parse(propuesta.contenido); } catch { /* empty */ }

  let servicios: Array<{ nombre: string; precioSetup: number; precioMensual: number }> = [];
  try { servicios = JSON.parse(propuesta.serviciosJson); } catch { /* empty */ }

  const fecha = new Date(propuesta.creadoEn).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const docChildren: (Paragraph | Table)[] = [];

  // Header: Cognisium Lab branding
  docChildren.push(
    new Paragraph({
      children: [new TextRun({ text: "COGNISIUM LAB", bold: true, size: 28, color: "4F46E5" })],
      alignment: AlignmentType.RIGHT,
      spacing: { after: 40 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "Propuesta Comercial", size: 20, color: "888888" })],
      alignment: AlignmentType.RIGHT,
      spacing: { after: 400 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" } },
    })
  );

  // Title
  docChildren.push(
    new Paragraph({
      children: [new TextRun({ text: propuesta.titulo, bold: true, size: 40, color: "111111" })],
      heading: HeadingLevel.TITLE,
      spacing: { after: 160 },
    })
  );

  // Client info
  docChildren.push(
    new Paragraph({
      children: [
        new TextRun({ text: "Para: ", bold: true, size: 24, color: "555555" }),
        new TextRun({ text: propuesta.clienteNombre, size: 24, color: "111111" }),
        propuesta.clienteEmpresa
          ? new TextRun({ text: ` — ${propuesta.clienteEmpresa}`, size: 24, color: "555555" })
          : new TextRun({ text: "" }),
      ],
      spacing: { after: 80 },
    }),
    new Paragraph({
      children: [new TextRun({ text: `Fecha: ${fecha}`, size: 20, color: "888888" })],
      spacing: { after: 600 },
    })
  );

  // Sections
  for (const seccion of secciones) {
    docChildren.push(
      new Paragraph({
        children: [new TextRun({ text: seccion.titulo, bold: true, size: 28, color: "4F46E5" })],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 160 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "E0E7FF" } },
      })
    );
    docChildren.push(...parseMarkdown(seccion.contenido));
  }

  // Pricing summary table (if services selected)
  if (servicios.length > 0) {
    docChildren.push(
      new Paragraph({
        children: [new TextRun({ text: "Resumen de Inversión", bold: true, size: 28, color: "4F46E5" })],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      })
    );

    const tableRows: TableRow[] = [
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Servicio", bold: true, size: 20, color: "FFFFFF" })], alignment: AlignmentType.CENTER })],
            shading: { type: ShadingType.SOLID, color: "4F46E5" },
            width: { size: 5500, type: WidthType.DXA },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Setup (único)", bold: true, size: 20, color: "FFFFFF" })], alignment: AlignmentType.CENTER })],
            shading: { type: ShadingType.SOLID, color: "4F46E5" },
            width: { size: 2000, type: WidthType.DXA },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Mensual", bold: true, size: 20, color: "FFFFFF" })], alignment: AlignmentType.CENTER })],
            shading: { type: ShadingType.SOLID, color: "4F46E5" },
            width: { size: 2000, type: WidthType.DXA },
          }),
        ],
      }),
      ...servicios.map(
        (s) =>
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: s.nombre, size: 20 })] })], width: { size: 5500, type: WidthType.DXA } }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `$${s.precioSetup.toLocaleString()} USD`, size: 20 })], alignment: AlignmentType.CENTER })], width: { size: 2000, type: WidthType.DXA } }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `$${s.precioMensual.toLocaleString()} USD`, size: 20 })], alignment: AlignmentType.CENTER })], width: { size: 2000, type: WidthType.DXA } }),
            ],
          })
      ),
    ];

    const totalSetup = servicios.reduce((a, s) => a + s.precioSetup, 0);
    const totalMensual = servicios.reduce((a, s) => a + s.precioMensual, 0);

    tableRows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "TOTAL", bold: true, size: 22, color: "4F46E5" })] })],
            shading: { type: ShadingType.SOLID, color: "EEF2FF" },
            width: { size: 5500, type: WidthType.DXA },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: `$${totalSetup.toLocaleString()} USD`, bold: true, size: 22, color: "4F46E5" })], alignment: AlignmentType.CENTER })],
            shading: { type: ShadingType.SOLID, color: "EEF2FF" },
            width: { size: 2000, type: WidthType.DXA },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: `$${totalMensual.toLocaleString()} USD/mes`, bold: true, size: 22, color: "4F46E5" })], alignment: AlignmentType.CENTER })],
            shading: { type: ShadingType.SOLID, color: "EEF2FF" },
            width: { size: 2000, type: WidthType.DXA },
          }),
        ],
      })
    );

    docChildren.push(new Table({ rows: tableRows, width: { size: 9500, type: WidthType.DXA } }));
  }

  // Footer
  docChildren.push(
    new Paragraph({
      children: [new TextRun({ text: "© 2026 Cognisium Lab — Todos los derechos reservados", size: 18, color: "AAAAAA" })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 800 },
    })
  );

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
          },
        },
        children: docChildren,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const filename = `Propuesta_${propuesta.clienteNombre.replace(/\s+/g, "_")}_Cognisium_${new Date().getFullYear()}.docx`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

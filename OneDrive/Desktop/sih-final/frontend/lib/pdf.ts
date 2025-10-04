// Simple PDF helpers for exporting generated documents and DOM sections
// Use dynamic imports to keep these client-only and avoid SSR issues

async function getJsPDF() {
  const mod = await import('jspdf')
  // Handle both ESM default export and UMD named export patterns
  const anyMod = mod as any
  return anyMod.jsPDF || anyMod.default || anyMod
}

async function getHtml2Canvas() {
  const mod = await import('html2canvas')
  return (mod as any).default || (mod as any)
}

export interface GeneratedDocSection {
  heading?: string
  title?: string
  content: string
}

export interface GeneratedDocumentLike {
  title: string
  documentType: string
  sections: GeneratedDocSection[]
  metadata?: {
    totalFeedbackAnalyzed?: number
    dateGenerated?: string
    [key: string]: any
  }
}

// Export a DOM element (by id) to PDF via html2canvas screenshot
export async function exportElementToPDF(elementId: string, filename = 'export.pdf') {
  const el = document.getElementById(elementId)
  if (!el) throw new Error(`Element with id ${elementId} not found`)

  const html2canvas = await getHtml2Canvas()
  const canvas = await html2canvas(el as HTMLElement, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
  })
  const imgData = canvas.toDataURL('image/png')
  const JsPDF = await getJsPDF()
  const pdf = new JsPDF('p', 'mm', 'a4')

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()

  const imgWidth = pageWidth
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  let position = 0
  let heightLeft = imgHeight

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
  heightLeft -= pageHeight

  while (heightLeft > 0) {
    position = heightLeft - imgHeight
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight
  }
  pdf.save(filename)
}

// Export a generated document (structured text) to PDF using jsPDF text
export function exportGeneratedDocumentToPDF(doc: GeneratedDocumentLike, filename?: string) {
  // Note: dynamic import inside sync function via immediate invoked async
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  ;(async () => {
    try {
      const JsPDF = await getJsPDF()
      const pdf = new JsPDF('p', 'mm', 'a4')
  const margin = 15
  const maxWidth = pdf.internal.pageSize.getWidth() - margin * 2
  let y = margin

  // Title
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(18)
  const titleLines = pdf.splitTextToSize(doc.title, maxWidth)
  pdf.text(titleLines, margin, y)
  y += titleLines.length * 8 + 4

  // Meta
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(11)
  const meta: string[] = []
  meta.push(`Type: ${doc.documentType}`)
  if (doc.metadata?.dateGenerated) meta.push(`Generated: ${new Date(doc.metadata.dateGenerated).toLocaleString()}`)
  if (doc.metadata?.totalFeedbackAnalyzed != null) meta.push(`Feedback analyzed: ${doc.metadata.totalFeedbackAnalyzed}`)
  const metaText = meta.join('  |  ')
  const metaLines = pdf.splitTextToSize(metaText, maxWidth)
  pdf.text(metaLines, margin, y)
  y += metaLines.length * 6 + 6

  // Sections
  for (const section of doc.sections) {
    const heading = section.heading || section.title || ''
    if (heading) {
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(14)
      const hLines = pdf.splitTextToSize(heading, maxWidth)
      // Page break if needed
      y = ensureSpace(pdf, y, hLines.length * 8 + 4, margin)
      pdf.text(hLines, margin, y)
      y += hLines.length * 8 + 2
    }

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(11)
    const paragraphs = section.content.split('\n\n')
    for (const p of paragraphs) {
      const pLines = pdf.splitTextToSize(p, maxWidth)
      y = ensureSpace(pdf, y, pLines.length * 6 + 4, margin)
      pdf.text(pLines, margin, y)
      y += pLines.length * 6 + 4
    }
    y += 2
  }

      pdf.save(filename || `${sanitize(doc.title)}.pdf`)
    } catch (err) {
      console.error('PDF export failed:', err)
      if (typeof window !== 'undefined') {
        alert('PDF export failed. Please ensure dependencies are installed (npm install) and try again.')
      }
    }
  })()
}

function ensureSpace(pdf: any, y: number, needed: number, margin: number) {
  const pageHeight = pdf.internal.pageSize.getHeight()
  if (y + needed > pageHeight - margin) {
    pdf.addPage()
    return margin
  }
  return y
}

function sanitize(name: string) {
  return name.replace(/[^a-z0-9\-_]+/gi, '_').slice(0, 80)
}

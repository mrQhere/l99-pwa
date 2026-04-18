import { jsPDF } from 'jspdf';
import { CLASS_NAMES, SEVERITY_LABELS, APP_NAME, APP_VERSION, OPERATORS } from '../utils/constants';

/**
 * Generate a clinical PDF report — 3 pages.
 * Page 1: Executive Summary (Patient + Diagnosis + Triage + Plain Language)
 * Page 2: Technical Analysis (Images + Class Probabilities + Model Stats)
 * Page 3: Clinical Context + Referral Letter
 */
export async function generateReport({ scan, patient, heatmapBase64, originalImageBase64, operator }) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const margin = 18;
  const cw = pageWidth - 2 * margin; // content width
  const now = new Date();
  const nowStr = now.toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' });
  const dateStr = now.toISOString().slice(0, 10);

  const severityGrade = scan.severity_grade ?? 0;
  const colors = [
    [0, 220, 120],   // 0 — Green (No DR)
    [0, 200, 255],   // 1 — Cyan (Mild DR)
    [255, 180, 0],   // 2 — Yellow (Moderate DR)
    [255, 60, 120],  // 3 — Magenta (Severe DR)
    [255, 40, 70],   // 4 — Red (Proliferative DR)
    [200, 60, 255],  // 5 — Purple (Cataract)
    [130, 0, 255],   // 6 — Violet (Glaucoma)
    [255, 100, 0],   // 7 — Orange (AMD)
    [255, 0, 0],     // 8 — Bright Red (Hypertensive)
  ];
  const diagColor = colors[severityGrade] || colors[0];
  const triageColor = {
    Routine: [0, 200, 100],
    Priority: [255, 180, 0],
    Urgent: [255, 100, 30],
    Emergency: [255, 30, 30],
  }[scan.triage] || [150, 150, 170];

  const confidence = (scan.confidence || 0) * 100;
  const uncertaintyVal = scan.uncertainty >= 0 ? scan.uncertainty : null;
  const qualityScore = scan.quality_score ?? null;
  const operatorInfo = operator ? OPERATORS[operator.id] || {} : {};

  // ════════════════════════════════════════════════════════
  // PAGE 1 — Executive Clinical Summary
  // ════════════════════════════════════════════════════════

  // Header bar
  doc.setFillColor(8, 8, 18);
  doc.rect(0, 0, pageWidth, 44, 'F');
  doc.setFillColor(...diagColor);
  doc.rect(0, 42, pageWidth, 2, 'F');
  doc.setFillColor(20, 20, 40);
  doc.rect(0, 44, pageWidth, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...diagColor);
  doc.text('L99 Eye Scan — Clinical Diagnostic Report', margin, 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(130, 130, 160);
  doc.text(`Report ID: ${scan.id || 'OFFLINE-' + Date.now()}   |   Generated: ${nowStr}   |   v${APP_VERSION}`, margin, 31);
  doc.text(`Operator: ${scan.operator_id || 'N/A'}  ·  ${operatorInfo.name || 'Clinical Unit'}  ·  ${operatorInfo.role || 'Screener'}`, margin, 37);

  let y = 52;

  // ── Patient Info Block ──────────────────────────────────
  doc.setFillColor(15, 15, 32);
  doc.roundedRect(margin, y, cw, 36, 3, 3, 'F');
  doc.setDrawColor(...diagColor);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, y, 3, 36, 1, 1, 'F');

  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 155);
  doc.setFont('helvetica', 'bold');
  doc.text('PATIENT INFORMATION', margin + 7, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(230, 230, 245);
  doc.text(`${patient?.name || 'Not specified'}`, margin + 7, y + 16);
  doc.setFontSize(8.5);
  doc.setTextColor(170, 170, 200);
  doc.text(`Age: ${patient?.age || 'N/A'}   Gender: ${patient?.gender || 'N/A'}   Contact: ${patient?.contact || 'N/A'}`, margin + 7, y + 23);
  doc.text(`Address: ${patient?.address || 'N/A'}`, margin + 7, y + 29);
  if (patient?.medical_history) {
    const hist = doc.splitTextToSize(`Hx: ${patient.medical_history}`, cw - 14);
    doc.text(hist[0], margin + 7, y + 35);
  }

  y += 44;

  // ── Diagnosis Block ─────────────────────────────────────
  doc.setFillColor(15, 15, 32);
  doc.roundedRect(margin, y, cw, 52, 3, 3, 'F');
  doc.setFillColor(...diagColor);
  doc.roundedRect(margin, y, 3, 52, 1, 1, 'F');

  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 155);
  doc.setFont('helvetica', 'bold');
  doc.text('AI DIAGNOSIS', margin + 7, y + 7);

  doc.setFontSize(18);
  doc.setTextColor(...diagColor);
  doc.setFont('helvetica', 'bold');
  doc.text(scan.diagnosis || 'Pending', margin + 7, y + 20);

  doc.setFontSize(9.5);
  doc.setTextColor(210, 210, 230);
  doc.setFont('helvetica', 'normal');
  doc.text(SEVERITY_LABELS[severityGrade] || 'Unknown Classification', margin + 7, y + 28);

  // Confidence bar
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 155);
  doc.text('CONFIDENCE', margin + 7, y + 36);
  doc.setFillColor(30, 30, 55);
  doc.roundedRect(margin + 7, y + 38, 80, 4, 1, 1, 'F');
  doc.setFillColor(...diagColor);
  doc.roundedRect(margin + 7, y + 38, Math.max(1, 80 * (scan.confidence || 0)), 4, 1, 1, 'F');
  doc.setTextColor(230, 230, 245);
  doc.text(`${confidence.toFixed(1)}%`, margin + 90, y + 42);

  if (uncertaintyVal !== null) {
    doc.setTextColor(120, 120, 155);
    doc.text('UNCERTAINTY (MC DROPOUT)', margin + 110, y + 36);
    const uncColor = uncertaintyVal > 0.15 ? [255, 180, 0] : [0, 200, 100];
    doc.setTextColor(...uncColor);
    doc.text(`${uncertaintyVal.toFixed(4)}  ${uncertaintyVal > 0.15 ? '⚠ High' : '✓ Low'}`, margin + 110, y + 42);
  }

  // Image quality
  if (qualityScore !== null) {
    doc.setTextColor(120, 120, 155);
    doc.text(`IMAGE QUALITY SCORE`, margin + 7, y + 47);
    doc.setTextColor(170, 200, 255);
    doc.text(`${qualityScore.toFixed(3)}  (${qualityScore > 0.7 ? 'Good' : qualityScore > 0.4 ? 'Acceptable' : 'Poor'})`, margin + 50, y + 47);
  }

  y += 60;

  // ── Triage Decision Block ───────────────────────────────
  doc.setFillColor(15, 15, 32);
  doc.roundedRect(margin, y, cw, 30, 3, 3, 'F');
  doc.setFillColor(...triageColor);
  doc.roundedRect(margin, y, 3, 30, 1, 1, 'F');

  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 155);
  doc.setFont('helvetica', 'bold');
  doc.text('TRIAGE DECISION', margin + 7, y + 7);

  doc.setFontSize(14);
  doc.setTextColor(...triageColor);
  doc.text(scan.triage || 'Pending', margin + 7, y + 17);

  doc.setFontSize(8.5);
  doc.setTextColor(210, 210, 230);
  doc.setFont('helvetica', 'normal');
  const triageLines = doc.splitTextToSize(scan.triage_action || getTriageAction(scan.triage), cw - 55);
  doc.text(triageLines[0] || '', margin + 50, y + 12);
  if (triageLines[1]) doc.text(triageLines[1], margin + 50, y + 18);
  doc.setTextColor(130, 130, 160);
  doc.text(`Timeframe: ${scan.triage_timeframe || 'See triage level'}`, margin + 50, y + 25);

  y += 38;

  // ── Plain Language Explanation ──────────────────────────
  const plainText = getPlainLanguage(severityGrade);
  const plainLines = doc.splitTextToSize(plainText, cw - 14);
  const blockH = Math.max(32, plainLines.length * 5 + 14);

  doc.setFillColor(15, 15, 32);
  doc.roundedRect(margin, y, cw, blockH, 3, 3, 'F');

  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 155);
  doc.setFont('helvetica', 'bold');
  doc.text('PLAIN LANGUAGE EXPLANATION', margin + 7, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(210, 210, 230);
  doc.text(plainLines, margin + 7, y + 14);

  y += blockH + 8;

  // ── Recommended Action ──────────────────────────────────
  doc.setFillColor(15, 15, 32);
  doc.roundedRect(margin, y, cw, 20, 3, 3, 'F');

  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 155);
  doc.setFont('helvetica', 'bold');
  doc.text('RECOMMENDED NEXT STEP', margin + 7, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...triageColor);
  const actionText = doc.splitTextToSize(getTriageAction(scan.triage), cw - 14);
  doc.text(actionText[0], margin + 7, y + 14);

  // Page footer
  drawPageFooter(doc, pageWidth, margin, 1, 3, diagColor);

  // ════════════════════════════════════════════════════════
  // PAGE 2 — Technical Analysis
  // ════════════════════════════════════════════════════════
  doc.addPage();
  drawPageHeader(doc, pageWidth, margin, 'Technical Analysis', diagColor, scan, operatorInfo, nowStr);

  y = 50;

  // ── Scan Images ─────────────────────────────────────────
  const hasOriginal = !!originalImageBase64;
  const hasHeatmap = !!heatmapBase64;

  if (hasOriginal || hasHeatmap) {
    doc.setFillColor(15, 15, 32);
    doc.roundedRect(margin, y, cw, 75, 3, 3, 'F');

    doc.setFontSize(7.5);
    doc.setTextColor(120, 120, 155);
    doc.setFont('helvetica', 'bold');
    doc.text('RETINAL SCAN IMAGES', margin + 7, y + 7);

    if (hasOriginal) {
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 180);
      doc.text('Original Fundus Image', margin + 7, y + 14);
      try {
        const imgData = originalImageBase64.startsWith('data:') ? originalImageBase64 : `data:image/jpeg;base64,${originalImageBase64}`;
        doc.addImage(imgData, 'JPEG', margin + 7, y + 17, 65, 52);
      } catch (_) {}
    }

    if (hasHeatmap) {
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 180);
      doc.text('Grad-CAM Activation Map', margin + 80, y + 14);
      doc.setFontSize(6.5);
      doc.setTextColor(110, 110, 140);
      doc.text('Highlighted = model attention zones', margin + 80, y + 19);
      try {
        const heatData = heatmapBase64.startsWith('data:') ? heatmapBase64 : `data:image/png;base64,${heatmapBase64}`;
        doc.addImage(heatData, 'PNG', margin + 80, y + 22, 65, 48);
      } catch (_) {}
    }

    if (!hasHeatmap) {
      doc.setFontSize(7.5);
      doc.setTextColor(100, 100, 130);
      doc.text('Grad-CAM: Available only for cloud inference', margin + 80, y + 35);
      doc.text('(requires HuggingFace Spaces connection)', margin + 80, y + 42);
    }

    y += 83;
  }

  // ── Class Probabilities ─────────────────────────────────
  const probs = scan.probabilities || [];
  const probBlockH = 16 + CLASS_NAMES.length * 9;
  doc.setFillColor(15, 15, 32);
  doc.roundedRect(margin, y, cw, probBlockH, 3, 3, 'F');

  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 155);
  doc.setFont('helvetica', 'bold');
  doc.text('FULL CLASS PROBABILITY BREAKDOWN', margin + 7, y + 7);

  for (let i = 0; i < CLASS_NAMES.length; i++) {
    const prob = probs[i] || 0;
    const barY = y + 12 + i * 9;
    const isTop = i === severityGrade;

    doc.setFont('helvetica', isTop ? 'bold' : 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(isTop ? 230 : 160, isTop ? 230 : 160, isTop ? 245 : 190);
    doc.text(CLASS_NAMES[i], margin + 7, barY + 4);

    // Bar background
    doc.setFillColor(25, 25, 48);
    doc.roundedRect(margin + 58, barY, 90, 5, 1, 1, 'F');
    // Bar fill — highlight top class
    const barColor = isTop ? diagColor : [60, 80, 110];
    doc.setFillColor(...barColor);
    doc.roundedRect(margin + 58, barY, Math.max(0.5, 90 * prob), 5, 1, 1, 'F');
    // Percentage label
    doc.setTextColor(isTop ? 230 : 140, isTop ? 230 : 140, isTop ? 245 : 160);
    doc.setFont('helvetica', 'normal');
    doc.text(`${(prob * 100).toFixed(2)}%`, margin + 152, barY + 4);
  }

  y += probBlockH + 8;

  // ── Model Information ────────────────────────────────────
  doc.setFillColor(15, 15, 32);
  doc.roundedRect(margin, y, cw, 44, 3, 3, 'F');

  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 155);
  doc.setFont('helvetica', 'bold');
  doc.text('MODEL & INFERENCE DETAILS', margin + 7, y + 7);

  const modelFields = [
    [`Model Used:`, scan.model_used || 'N/A'],
    [`Inference Mode:`, scan.is_offline ? 'Offline (MobileNetV3 ONNX / WASM)' : 'Cloud (EfficientNet-B4 Ensemble)'],
    [`MC Dropout Passes:`, scan.mc_passes > 0 ? String(scan.mc_passes) : 'N/A (offline)'],
    [`Epistemic Uncertainty:`, uncertaintyVal !== null ? `${uncertaintyVal.toFixed(4)} ${uncertaintyVal > 0.15 ? '⚠ High — result less certain' : '✓ Acceptable'}` : 'N/A'],
    [`Image Quality Weight:`, qualityScore !== null ? `${qualityScore.toFixed(3)}` : 'N/A'],
    [`Severity Score (raw):`, scan.severity_score != null ? scan.severity_score.toFixed(4) : 'N/A'],
  ];

  const half = Math.ceil(modelFields.length / 2);
  modelFields.forEach(([label, val], i) => {
    const col = i < half ? 0 : 1;
    const row = i < half ? i : i - half;
    const bx = margin + 7 + col * (cw / 2);
    const by = y + 14 + row * 9;
    doc.setFontSize(7.2);
    doc.setTextColor(110, 110, 145);
    doc.setFont('helvetica', 'bold');
    doc.text(label, bx, by);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 200, 225);
    doc.text(val, bx + 38, by);
  });

  y += 52;

  // ── Scan Metadata ────────────────────────────────────────
  doc.setFillColor(15, 15, 32);
  doc.roundedRect(margin, y, cw, 36, 3, 3, 'F');

  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 155);
  doc.setFont('helvetica', 'bold');
  doc.text('SCAN METADATA', margin + 7, y + 7);

  const metaFields = [
    ['Scan ID:', scan.id || 'Not yet synced'],
    ['Operator ID:', scan.operator_id || 'N/A'],
    ['Operator Name:', operatorInfo.name || 'N/A'],
    ['Operator Role:', operatorInfo.role || 'N/A'],
    ['Scan Date:', scan.created_at ? new Date(scan.created_at).toLocaleString('en-IN') : nowStr],
    ['Sync Status:', scan.is_offline ? 'Offline — Queued for sync' : 'Cloud — Synced'],
  ];
  const mhalf = Math.ceil(metaFields.length / 2);
  metaFields.forEach(([label, val], i) => {
    const col = i < mhalf ? 0 : 1;
    const row = i < mhalf ? i : i - mhalf;
    const bx = margin + 7 + col * (cw / 2);
    const by = y + 14 + row * 9;
    doc.setFontSize(7.2);
    doc.setTextColor(110, 110, 145);
    doc.setFont('helvetica', 'bold');
    doc.text(label, bx, by);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 200, 225);
    doc.text(String(val).substring(0, 50), bx + 28, by);
  });

  drawPageFooter(doc, pageWidth, margin, 2, 3, diagColor);

  // ════════════════════════════════════════════════════════
  // PAGE 3 — Clinical Context & Referral Letter
  // ════════════════════════════════════════════════════════
  doc.addPage();
  drawPageHeader(doc, pageWidth, margin, 'Clinical Context & Referral', diagColor, scan, operatorInfo, nowStr);

  y = 50;

  // ── Medical Insights per disease ────────────────────────
  const insights = getMedicalInsights(severityGrade);
  const insightLines = doc.splitTextToSize(insights.detail, cw - 14);
  const insightH = Math.max(40, insightLines.length * 4.5 + 18);

  doc.setFillColor(15, 15, 32);
  doc.roundedRect(margin, y, cw, insightH, 3, 3, 'F');
  doc.setFillColor(...diagColor);
  doc.roundedRect(margin, y, 3, insightH, 1, 1, 'F');

  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 155);
  doc.setFont('helvetica', 'bold');
  doc.text(`CONDITION OVERVIEW — ${CLASS_NAMES[severityGrade] || 'Unknown'}`, margin + 7, y + 7);

  doc.setFontSize(8);
  doc.setTextColor(...diagColor);
  doc.text(insights.headline, margin + 7, y + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(200, 200, 225);
  doc.text(insightLines, margin + 7, y + 21);

  y += insightH + 8;

  // ── Referral Letter ─────────────────────────────────────
  const refLetter = buildReferralLetter(scan, patient, operatorInfo, nowStr, diagColor);
  const refLines = doc.splitTextToSize(refLetter, cw - 14);
  const refH = Math.max(70, refLines.length * 4.5 + 18);

  doc.setFillColor(15, 15, 32);
  doc.roundedRect(margin, y, cw, Math.min(refH, 210 - y - 30), 3, 3, 'F');

  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 155);
  doc.setFont('helvetica', 'bold');
  doc.text('REFERRAL LETTER (For Specialist / Ophthalmologist)', margin + 7, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(210, 210, 235);
  doc.text(refLines.slice(0, 30), margin + 7, y + 14);

  y += Math.min(refH, 210 - y - 30) + 8;

  // ── Next steps checklist ────────────────────────────────
  if (y < 245) {
    const steps = getNextSteps(severityGrade, scan.triage);
    const stepsH = steps.length * 8 + 18;
    doc.setFillColor(15, 15, 32);
    doc.roundedRect(margin, y, cw, stepsH, 3, 3, 'F');

    doc.setFontSize(7.5);
    doc.setTextColor(120, 120, 155);
    doc.setFont('helvetica', 'bold');
    doc.text('PATIENT ACTION CHECKLIST', margin + 7, y + 7);

    steps.forEach((step, i) => {
      const sy = y + 14 + i * 8;
      doc.setFillColor(0, 180, 100);
      doc.roundedRect(margin + 7, sy - 3, 4, 4, 1, 1, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(200, 200, 225);
      doc.text(step, margin + 15, sy);
    });
  }

  // ── Disclaimer ──────────────────────────────────────────
  doc.setFontSize(6.5);
  doc.setTextColor(80, 80, 110);
  const disc = 'DISCLAIMER: This report is AI-generated by the L99 Eye Scan System and is NOT a substitute for professional medical diagnosis or treatment. All findings MUST be reviewed and confirmed by a qualified ophthalmologist before any clinical decisions are made. Confidence scores indicate model certainty — not clinical certainty. The operator bears clinical responsibility for appropriate patient care following this screening.';
  const discLines = doc.splitTextToSize(disc, cw);
  doc.text(discLines, margin, 262);

  drawPageFooter(doc, pageWidth, margin, 3, 3, diagColor);

  // ── Save ─────────────────────────────────────────────────
  const filename = `EyeScan_${patient?.name?.replace(/\s+/g, '_') || 'Patient'}_${dateStr}_${scan.triage || 'Report'}.pdf`;
  doc.save(filename);
  return filename;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function drawPageHeader(doc, pw, margin, title, color, scan, operatorInfo, nowStr) {
  doc.setFillColor(8, 8, 18);
  doc.rect(0, 0, pw, 36, 'F');
  doc.setFillColor(...color);
  doc.rect(0, 34, pw, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...color);
  doc.text(`L99 Eye Scan — ${title}`, margin, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(110, 110, 145);
  doc.text(`Patient: ${scan.patient?.name ?? '—'}   ·   Diagnosis: ${scan.diagnosis ?? '—'}   ·   ${nowStr}`, margin, 27);
}

function drawPageFooter(doc, pw, margin, currentPage, totalPages, color) {
  doc.setFillColor(...color.map(c => Math.floor(c * 0.3)));
  doc.rect(0, 279, pw, 18, 'F');
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 130);
  doc.setFont('helvetica', 'normal');
  doc.text('L99 Eye Scan System  ·  AI-Assisted Ophthalmic Diagnostics  ·  NOT a substitute for clinical judgment', margin, 288);
  doc.text(`Page ${currentPage} of ${totalPages}`, pw - margin - 20, 288);
}

function getPlainLanguage(grade) {
  return [
    'No signs of diabetic retinopathy were detected in this scan. The retina appears healthy with normal vascular architecture. The optic disc and macula appear unremarked. Continue regular annual eye exams and maintain good blood sugar control.',
    'Mild signs of diabetic retinopathy detected. Microaneurysms — tiny bulges in blood vessel walls — may be present. This is the earliest stage and typically does not cause vision symptoms. Strict glycaemic control is essential. Monitor every 6–12 months.',
    'Moderate signs of diabetic retinopathy detected. Blood vessels in the retina show significant changes including exudates or haemorrhages. Vision may be at risk if blood sugar remains uncontrolled. Specialist follow-up within 4–6 weeks is recommended.',
    'Severe non-proliferative diabetic retinopathy detected. Multiple haemorrhages, venous beading, or intraretinal microvascular abnormalities are present. High risk of progression to vision-threatening stage. Urgent referral is required.',
    'Proliferative diabetic retinopathy detected. New, abnormal blood vessels (neovascularisation) are growing on the retina. This is the advanced, sight-threatening stage. Vitreous haemorrhage or retinal detachment is a real risk. IMMEDIATE specialist referral is critical.',
    'Cataract findings detected. Clouding of the crystalline lens is reducing light transmission through the eye. This is typically progressive and correctable with surgery. A surgical consultation is advised for timing and planning.',
    'Optic nerve changes suggestive of glaucoma detected. Increased cup-to-disc ratio or structural changes to the optic nerve head may indicate raised intraocular pressure or nerve damage. Early treatment is vital — vision loss from glaucoma is irreversible.',
    'Macular changes associated with Age-Related Macular Degeneration (AMD) detected. The macula — responsible for sharp central vision — shows signs of drusen or pigment changes. Central vision may be affected. Prompt retinal specialist assessment is required.',
    'Severe retinal vascular changes (Hypertensive Retinopathy) detected. These changes — including A-V nicking, flame haemorrhages, or disc oedema — are strongly associated with systemic hypertension. Blood pressure must be measured and controlled urgently. Cardiovascular evaluation is warranted.',
  ][grade] || 'Analysis complete. Please consult a specialist for interpretation.';
}

function getMedicalInsights(grade) {
  const insights = [
    { headline: 'Retina is healthy — continue monitoring.', detail: 'No diabetic changes were identified. The retinal vasculature, optic disc, and macular area appear normal. Maintaining optimal blood glucose, blood pressure, and cholesterol levels significantly reduces the risk of future retinopathy development.' },
    { headline: 'Earliest stage of DR — glycaemic control is the primary intervention.', detail: 'Mild NPDR is characterised by microaneurysms only. At this stage, there is no visual impairment and no ocular treatment is needed. The focus should be on systemic risk factor control: HbA1c < 7%, BP < 130/80 mmHg, and cholesterol management.' },
    { headline: 'Moderate NPDR — closer surveillance required.', detail: 'More than microaneurysms but less than severe. Hard exudates, haemorrhages, and cotton wool spots appear. Macular oedema may develop. Annual dilated exam may need to increase to every 6 months. Consider pan-retinal photocoagulation if indicated.' },
    { headline: 'Severe NPDR — high risk of progression.', detail: 'Defined by the 4-2-1 rule: haemorrhages in 4 quadrants, venous beading in 2 quadrants, or IRMA in 1 quadrant. 50% chance of progressing to PDR within 1 year. Anti-VEGF or focal laser therapy may be considered.' },
    { headline: 'Proliferative DR — sight-threatening emergency.', detail: 'Neovascularisation signals that the retina is ischaemic and releasing VEGF. Vitreous haemorrhage, tractional retinal detachment, and neovascular glaucoma are direct risks. Pan-retinal photocoagulation (PRP) or intravitreal anti-VEGF (ranibizumab/bevacizumab) are standard treatments.' },
    { headline: 'Cataract — correctable with surgery.', detail: 'Cataracts cause gradually progressive painless vision blurring. Risk factors include diabetes, UV exposure, corticosteroid use, and age. Phacoemulsification is the standard surgical procedure with an excellent visual outcome.' },
    { headline: 'Glaucoma suspect — IOP check and optic nerve evaluation essential.', detail: 'The optic cup appears enlarged relative to the disc, or structural damage is suspected. Glaucoma is the second leading cause of blindness globally. Intraocular pressure >21 mmHg, family history, and myopia are risk factors. Treatment: topical eye drops, laser, or surgery.' },
    { headline: 'AMD — specialist evaluation required to classify subtype.', detail: 'AMD affects central vision and is classified as dry (geographic atrophy) or wet (choroidal neovascularisation). Wet AMD requires urgent anti-VEGF injections. Dry AMD is managed with AREDS2 supplements and lifestyle changes (smoking cessation, diet). Central vision loss is the key functional deficit.' },
    { headline: 'Hypertensive Retinopathy — systemic emergency.', detail: 'The retinal vessels reflect systemic vascular status. Grade III-IV hypertensive retinopathy indicates a risk of hypertensive crisis affecting the brain (stroke), heart (MI), and kidneys. Blood pressure must be controlled urgently. This finding may indicate target organ damage requiring immediate hospitalisation.' },
  ];
  return insights[grade] || insights[0];
}

function buildReferralLetter(scan, patient, operatorInfo, nowStr, diagColor) {
  const triage = scan.triage || 'Priority';
  const urgency = triage === 'Emergency' ? 'URGENTLY' : triage === 'Urgent' ? 'urgently' : 'for assessment';
  return [
    `Date: ${nowStr}`,
    ``,
    `Dear Specialist,`,
    ``,
    `I am writing to refer ${patient?.name || 'the patient'} (Age: ${patient?.age || 'N/A'}, Gender: ${patient?.gender || 'N/A'})`,
    `for ${urgency} ophthalmological evaluation.`,
    ``,
    `CLINICAL SUMMARY:`,
    `This patient was screened using the L99 AI-Assisted Eye Scan System. The AI diagnostic model`,
    `identified: ${scan.diagnosis || 'findings requiring specialist review'}, classified as`,
    `"${SEVERITY_LABELS[scan.severity_grade] || 'Unknown'}" with a model confidence of`,
    `${((scan.confidence || 0) * 100).toFixed(1)}%. The triage level assigned is: ${triage}.`,
    ``,
    `RECOMMENDED SPECIALIST ACTION:`,
    `${getTriageAction(scan.triage)}`,
    ``,
    `Please arrange ${triage === 'Emergency' ? 'emergency' : 'specialist'} consultation ${urgency}.`,
    ``,
    `Screening Operator: ${operatorInfo.name || 'Clinical Unit'} (ID: ${scan.operator_id || 'N/A'})`,
    `Role: ${operatorInfo.role || 'Screener'}`,
    ``,
    `* This screening was performed using AI assistance and MUST be confirmed by a qualified ophthalmologist.`,
    `* Full technical report including class probabilities and model details is included herein.`,
  ].join('\n');
}

function getNextSteps(grade, triage) {
  const base = [
    'Share this report with your ophthalmologist at the next visit',
    'Keep this document for your medical records',
  ];
  const byGrade = [
    ['Continue annual eye screening', 'Maintain blood sugar control (HbA1c < 7%)', 'Monitor blood pressure regularly'],
    ['Schedule review in 6 months', 'Strict glycaemic and blood pressure control', 'Report any visual changes immediately'],
    ['See ophthalmologist within 4-6 weeks', 'Discuss macular oedema risk with doctor', 'Avoid activities that could raise eye pressure'],
    ['Urgent ophthalmology appointment — within 1 week', 'Discuss anti-VEGF or laser therapy eligibility', 'Do not delay — severe DR can progress rapidly'],
    ['EMERGENCY referral — arrange within 24 hours', 'Discuss PRP or anti-VEGF injections urgently', 'Do NOT ignore — vision loss may be imminent'],
    ['Discuss cataract surgery consultation timeline', 'Inform doctor of any driving or vision difficulties', 'Protective eyewear recommended in sunlight'],
    ['IOP (eye pressure) measurement needed', 'Visual field test recommended', 'Begin or review glaucoma medications if prescribed'],
    ['Retinal specialist appointment — prioritise', 'Discuss wet vs dry AMD classification', 'Consider AREDS2 vitamins if appropriate'],
    ['Check blood pressure immediately', 'Visit cardiologist or GP urgently', 'Do not wait — this may indicate a vascular emergency'],
  ];
  return [...base, ...(byGrade[grade] || byGrade[0])];
}

function getTriageAction(triage) {
  return {
    Routine: 'Continue routine annual screening. No immediate action required. Reinforce risk factor control.',
    Priority: 'Schedule a specialist follow-up examination within 4 weeks. Monitor for symptom progression.',
    Urgent: 'Refer to ophthalmologist within 1 week. Escalate if symptoms worsen. Do not delay.',
    Emergency: 'IMMEDIATE referral to ophthalmology department. Patient must be seen within 24 hours. Consider same-day admission if vascular crisis is suspected.',
  }[triage] || 'Please consult a qualified ophthalmologist for further evaluation.';
}

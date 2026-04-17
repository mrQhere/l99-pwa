/**
 * CSV Export utility — export patient or scan data as CSV.
 */

export function exportToCSV(data, filename, columns) {
  if (!data || data.length === 0) return;

  const headers = columns.map(c => c.label).join(',');
  const rows = data.map(row =>
    columns.map(c => {
      let val = row[c.key];
      if (val === null || val === undefined) val = '';
      val = String(val).replace(/"/g, '""');
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        val = `"${val}"`;
      }
      return val;
    }).join(',')
  );

  const csv = [headers, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

/** Pre-defined column configs */
export const PATIENT_COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'age', label: 'Age' },
  { key: 'gender', label: 'Gender' },
  { key: 'contact', label: 'Contact' },
  { key: 'address', label: 'Address' },
  { key: 'medical_history', label: 'Medical History' },
  { key: 'operator_id', label: 'Operator' },
  { key: 'created_at', label: 'Registered' },
];

export const SCAN_COLUMNS = [
  { key: 'diagnosis', label: 'Diagnosis' },
  { key: 'severity_grade', label: 'Severity Grade' },
  { key: 'confidence', label: 'Confidence' },
  { key: 'uncertainty', label: 'Uncertainty' },
  { key: 'triage', label: 'Triage' },
  { key: 'model_used', label: 'Model' },
  { key: 'quality_score', label: 'Quality Score' },
  { key: 'is_offline', label: 'Offline' },
  { key: 'operator_id', label: 'Operator' },
  { key: 'created_at', label: 'Date' },
];

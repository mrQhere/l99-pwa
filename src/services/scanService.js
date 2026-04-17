import { supabase } from './supabase';

/** Save a scan result */
export async function createScan(scan) {
  const { data, error } = await supabase
    .from('scans')
    .insert([scan])
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Get all scans, optionally filtered */
export async function getScans({ operatorId, patientId, limit = 50 } = {}) {
  let query = supabase
    .from('scans')
    .select('*, patients(name, age, gender)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (operatorId) query = query.eq('operator_id', operatorId);
  if (patientId) query = query.eq('patient_id', patientId);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/** Get a single scan */
export async function getScan(id) {
  const { data, error } = await supabase
    .from('scans')
    .select('*, patients(name, age, gender, contact)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

/** Get scan count */
export async function getScanCount() {
  const { count, error } = await supabase
    .from('scans')
    .select('*', { count: 'exact', head: true });
  if (error) return 0;
  return count || 0;
}

/** Get severity distribution for analytics */
export async function getSeverityDistribution() {
  const { data, error } = await supabase
    .from('scans')
    .select('severity_grade');
  if (error) return [0, 0, 0, 0, 0];

  const dist = [0, 0, 0, 0, 0];
  (data || []).forEach(s => {
    if (s.severity_grade >= 0 && s.severity_grade <= 4) {
      dist[s.severity_grade]++;
    }
  });
  return dist;
}

/** Get recent scan stats */
export async function getRecentStats() {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('scans')
    .select('created_at, severity_grade, triage')
    .gte('created_at', weekAgo);

  if (error) return { total: 0, urgent: 0, thisWeek: 0 };

  const urgent = (data || []).filter(s =>
    s.triage === 'Urgent' || s.triage === 'Emergency'
  ).length;

  return { total: data?.length || 0, urgent, thisWeek: data?.length || 0 };
}

/** Delete a scan */
export async function deleteScan(id) {
  const { error } = await supabase.from('scans').delete().eq('id', id);
  if (error) throw error;
}

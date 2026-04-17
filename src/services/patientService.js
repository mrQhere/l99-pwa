import { supabase } from './supabase';

/** Create a new patient */
export async function createPatient(patient) {
  const { data, error } = await supabase
    .from('patients')
    .insert([patient])
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Get all patients for an operator */
export async function getPatients(operatorId = null) {
  let query = supabase.from('patients').select('*').order('created_at', { ascending: false });
  if (operatorId) query = query.eq('operator_id', operatorId);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/** Get a single patient by ID */
export async function getPatient(id) {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

/** Update a patient */
export async function updatePatient(id, updates) {
  const { data, error } = await supabase
    .from('patients')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Delete a patient */
export async function deletePatient(id) {
  const { error } = await supabase.from('patients').delete().eq('id', id);
  if (error) throw error;
}

/** Search patients by name */
export async function searchPatients(query) {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .ilike('name', `%${query}%`)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) throw error;
  return data || [];
}

/** Get patient count */
export async function getPatientCount() {
  const { count, error } = await supabase
    .from('patients')
    .select('*', { count: 'exact', head: true });
  if (error) return 0;
  return count || 0;
}

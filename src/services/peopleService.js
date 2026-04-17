import { supabase } from './supabase';

/** Create a new person (doctor, referral, health worker) */
export async function createPerson(person) {
  const { data, error } = await supabase
    .from('people')
    .insert([person])
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Get all people */
export async function getPeople(operatorId = null) {
  let query = supabase.from('people').select('*').order('created_at', { ascending: false });
  if (operatorId) query = query.eq('operator_id', operatorId);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/** Update a person */
export async function updatePerson(id, updates) {
  const { data, error } = await supabase
    .from('people')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Delete a person */
export async function deletePerson(id) {
  const { error } = await supabase.from('people').delete().eq('id', id);
  if (error) throw error;
}

/** Search people by name */
export async function searchPeople(query) {
  const { data, error } = await supabase
    .from('people')
    .select('*')
    .ilike('name', `%${query}%`)
    .limit(20);
  if (error) throw error;
  return data || [];
}

/** Get people count */
export async function getPeopleCount() {
  const { count, error } = await supabase
    .from('people')
    .select('*', { count: 'exact', head: true });
  if (error) return 0;
  return count || 0;
}

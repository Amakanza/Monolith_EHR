import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { getActiveClinic } from '@/lib/server/clinic/get-active-clinic';
import { z } from 'zod';

export const createTemplateSchema = z.object({
  name: z.string().min(1),
  channel: z.enum(['sms', 'email', 'whatsapp']),
  subject: z.string().optional(),
  body: z.string().min(1),
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;

export async function listTemplates() {
  const { clinicId } = await getActiveClinic();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('message_templates')
    .select('*')
    .eq('clinic_id', clinicId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createTemplate(input: CreateTemplateInput) {
  const { clinicId, user } = await getActiveClinic();
  const supabase = await createClient();

  const parsed = createTemplateSchema.parse(input);

  const { data, error } = await supabase
    .from('message_templates')
    .insert({
      clinic_id: clinicId,
      created_by: user.id,
      name: parsed.name,
      channel: parsed.channel,
      subject: parsed.subject || null,
      body: parsed.body,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
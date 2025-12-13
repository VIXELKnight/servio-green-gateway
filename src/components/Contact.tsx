import React, { useState } from 'react';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

const contactSchema = z.object({
  name: z.string().min(1, { message: 'Please enter your name.' }).max(64, { message: 'Name must be 64 characters or fewer.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }).max(254, { message: 'Email is too long.' }),
  message: z.string().min(10, { message: 'Message must be at least 10 characters.' }).max(1000, { message: 'Message is too long (max 1000).' })
});

type ContactForm = z.infer<typeof contactSchema>;

export default function Contact() {
  const [form, setForm] = useState<ContactForm>({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof ContactForm, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    setSuccessMessage(null);

    const parsed = contactSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof ContactForm, string>> = {};
      parsed.error.errors.forEach(err => {
        const key = err.path[0] as keyof ContactForm | undefined;
        if (key) fieldErrors[key] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('contact_submissions')
        .insert([{ name: form.name.trim(), email: form.email.trim(), message: form.message.trim() }]);

      if (error) {
        console.error('Supabase insert error:', error);
        setServerError('Failed to submit the form. Please try again later.');
      } else {
        setSuccessMessage('Thanks — your message has been submitted!');
        setForm({ name: '', email: '', message: '' });
      }
    } catch (err) {
      console.error(err);
      setServerError('An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div>
        <label htmlFor="name">Name</label>
        <input id="name" name="name" value={form.name} onChange={handleChange} maxLength={64} />
        {errors.name && <p role="alert" style={{ color: 'red' }}>{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" value={form.email} onChange={handleChange} maxLength={254} />
        {errors.email && <p role="alert" style={{ color: 'red' }}>{errors.email}</p>}
      </div>

      <div>
        <label htmlFor="message">Message</label>
        <textarea id="message" name="message" value={form.message} onChange={handleChange} rows={8} maxLength={1000} />
        {errors.message && <p role="alert" style={{ color: 'red' }}>{errors.message}</p>}
      </div>

      {serverError && <p role="alert" style={{ color: 'red' }}>{serverError}</p>}
      {successMessage && <p role="status" style={{ color: 'green' }}>{successMessage}</p>}

      <button type="submit" disabled={submitting}>
        {submitting ? 'Sending…' : 'Send'}
      </button>
    </form>
  );
}

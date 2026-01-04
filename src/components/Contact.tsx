import React, { useState } from 'react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, Mail, MessageSquare, CheckCircle, Loader2 } from 'lucide-react';

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
        setSuccessMessage('Thanks for reaching out! We\'ll get back to you within 24 hours.');
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
    <section id="contact" className="py-24 md:py-32 bg-background relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-1/2 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2" />
      <div className="absolute top-1/2 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2" />
      
      <div className="container px-4 md:px-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold uppercase tracking-wider mb-4">
              <Mail className="w-4 h-4" />
              Get in Touch
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Let's Start a <span className="text-gradient">Conversation</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Have questions about our platform? Want a custom enterprise solution? 
              We'd love to hear from you.
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-8">
            {/* Info Cards */}
            <div className="md:col-span-2 space-y-4">
              <Card className="border-border">
                <CardHeader className="pb-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Sales Inquiries</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Interested in our enterprise plans or custom solutions? Our sales team is ready to help.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader className="pb-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                    <CheckCircle className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Quick Response</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    We typically respond within 24 hours during business days. Priority support for enterprise clients.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <Card className="md:col-span-3 border-primary/20">
              <CardHeader>
                <CardTitle>Send us a Message</CardTitle>
                <CardDescription>Fill out the form below and we'll get back to you shortly.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input 
                        id="name" 
                        name="name" 
                        value={form.name} 
                        onChange={handleChange} 
                        maxLength={64}
                        placeholder="John Doe"
                        className={errors.name ? 'border-destructive' : ''}
                      />
                      {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
                    </div>

                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        name="email" 
                        type="email" 
                        value={form.email} 
                        onChange={handleChange} 
                        maxLength={254}
                        placeholder="john@company.com"
                        className={errors.email ? 'border-destructive' : ''}
                      />
                      {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea 
                      id="message" 
                      name="message" 
                      value={form.message} 
                      onChange={handleChange} 
                      rows={5} 
                      maxLength={1000}
                      placeholder="Tell us about your needs..."
                      className={errors.message ? 'border-destructive' : ''}
                    />
                    {errors.message && <p className="text-xs text-destructive mt-1">{errors.message}</p>}
                  </div>

                  {serverError && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                      <p className="text-sm text-destructive">{serverError}</p>
                    </div>
                  )}
                  
                  {successMessage && (
                    <div className="p-3 rounded-lg bg-green-100 border border-green-200">
                      <p className="text-sm text-green-700 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        {successMessage}
                      </p>
                    </div>
                  )}

                  <Button type="submit" disabled={submitting} className="w-full" size="lg">
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}

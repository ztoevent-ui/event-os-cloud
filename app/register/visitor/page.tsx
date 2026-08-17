'use client';

import React, { useState, FormEvent, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

const CheckIcon = ({ style }: { style?: React.CSSProperties }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const INTEREST_OPTIONS = [
  'General Inquiry',
  'Event Sponsorship',
  'Partnership',
  'Technology Demo',
  'Other'
];

function RegisterForm() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project') ?? null;
  const eventTitle = searchParams.get('event') ?? 'Main Event';

  const [visitorName, setVisitorName] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [interest, setInterest] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const toggleInterest = (val: string) =>
    setInterest(prev => prev.includes(val) ? prev.filter(i => i !== val) : [...prev, val]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('booth_visitors').insert({
        project_id: projectId,       // null if no project param — falls into global pool
        event_title: eventTitle,
        visitor_name: visitorName,
        phone,
        company,
        interest,
      });
      if (error) throw error;
      setIsSuccess(true);
      setTimeout(() => {
        setVisitorName(''); setPhone(''); setCompany(''); setInterest([]);
        setIsSuccess(false); setIsSubmitting(false);
      }, 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#050505',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      fontFamily: 'Urbanist, sans-serif',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 440,
        borderRadius: 24,
        border: '1.5px solid #4169E1',
        background: 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        padding: 32,
      }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4, textAlign: 'center' }}>
          Visitor Registration
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginBottom: 28 }}>
          {eventTitle}
        </p>

        {isSuccess ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '40px 0' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(57,255,20,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckIcon style={{ width: 32, height: 32, stroke: '#39FF14' }} />
            </div>
            <span style={{ fontWeight: 800, color: '#39FF14', fontSize: 22 }}>Success!</span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Ready for next visitor...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {errorMsg && (
              <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, color: '#f87171', fontSize: 13 }}>
                {errorMsg}
              </div>
            )}
            {[
              { label: 'Name', value: visitorName, set: setVisitorName, required: true, placeholder: 'John Doe', type: 'text' },
              { label: 'Phone / WhatsApp', value: phone, set: setPhone, required: true, placeholder: '+60 12 345 6789', type: 'tel' },
              { label: 'Company (Optional)', value: company, set: setCompany, required: false, placeholder: 'Acme Corp', type: 'text' },
            ].map(f => (
              <div key={f.label}>
                <label style={inputLabel}>{f.label}{f.required && <span style={{ color: '#ef4444' }}> *</span>}</label>
                <input
                  type={f.type}
                  required={f.required}
                  value={f.value}
                  onChange={e => f.set(e.target.value)}
                  disabled={isSubmitting}
                  placeholder={f.placeholder}
                  style={inputStyle}
                />
              </div>
            ))}

            <div>
              <label style={{ ...inputLabel, display: 'block', marginBottom: 10 }}>Interested In</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {INTEREST_OPTIONS.map(opt => {
                  const active = interest.includes(opt);
                  return (
                    <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: `1px solid ${active ? '#4169E1' : 'rgba(255,255,255,0.1)'}`, background: active ? 'rgba(65,105,225,0.1)' : 'rgba(255,255,255,0.02)', cursor: isSubmitting ? 'not-allowed' : 'pointer', transition: 'all 0.15s' }}>
                      <input type="checkbox" checked={active} onChange={() => toggleInterest(opt)} disabled={isSubmitting} style={{ display: 'none' }} />
                      <div style={{ width: 16, height: 16, borderRadius: 4, border: `1px solid ${active ? '#4169E1' : 'rgba(255,255,255,0.25)'}`, background: active ? '#4169E1' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {active && <CheckIcon style={{ width: 10, height: 10, stroke: '#fff' }} />}
                      </div>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>{opt}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{ marginTop: 8, padding: '14px', borderRadius: 12, background: '#39FF14', color: '#050505', border: 'none', fontWeight: 800, fontSize: 15, cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.6 : 1, transition: 'opacity 0.2s', fontFamily: 'Urbanist, sans-serif' }}
            >
              {isSubmitting ? 'Submitting...' : 'Register Now'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const inputLabel: React.CSSProperties = {
  display: 'block', fontSize: 10, fontWeight: 700,
  letterSpacing: '0.15em', textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.35)', marginBottom: 8,
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 16px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12, color: '#fff', fontSize: 14,
  outline: 'none', boxSizing: 'border-box',
  fontFamily: 'Urbanist, sans-serif',
};

export default function VisitorRegisterPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#050505' }} />}>
      <RegisterForm />
    </Suspense>
  );
}

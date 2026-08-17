'use client';

import React, { useState, FormEvent } from 'react';
import { supabase } from '@/lib/supabaseClient';

// A simple Check component if lucide is not installed
const CheckIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
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

export default function VisitorRegisterPage() {
  const [visitorName, setVisitorName] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [interest, setInterest] = useState<string[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const toggleInterest = (val: string) => {
    setInterest((prev) =>
      prev.includes(val) ? prev.filter((i) => i !== val) : [...prev, val]
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('booth_visitors')
        .insert({
          event_title: 'Main Event', // Hardcoded or dynamic depending on need
          visitor_name: visitorName,
          phone,
          company,
          interest
        });

      if (error) {
        throw error;
      }

      setIsSuccess(true);
      
      // Clear form after 3 seconds
      setTimeout(() => {
        setVisitorName('');
        setPhone('');
        setCompany('');
        setInterest([]);
        setIsSuccess(false);
        setIsSubmitting(false);
      }, 3000);

    } catch (err: any) {
      console.error('Submission error:', err);
      setErrorMsg(err.message || 'An error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#050505] text-white">
      {/* 
        Frosted glass card backdrop-filter: blur(12px)
        Royal blue border: border-[#4169E1]
        Padding: 32px !important 
      */}
      <div 
        className="w-full max-w-md rounded-2xl border-2 border-[#4169E1] bg-white/5 backdrop-blur-[12px] shadow-2xl relative overflow-hidden"
        style={{ padding: '32px !important' }}
      >
        {/* We need to apply padding via style or className properly. style guarantees !important if needed, but Tailwind p-8 is 32px */}
        <div className="p-[32px] !important" style={{ padding: '32px' }}>
          <h1 className="text-2xl font-bold mb-2 text-center">Visitor Registration</h1>
          <p className="text-sm text-gray-400 mb-6 text-center">
            Scan & Register quickly
          </p>

          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-4 animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 rounded-full bg-[#39FF14]/20 flex items-center justify-center">
                <CheckIcon className="w-8 h-8 text-[#39FF14]" />
              </div>
              <h2 className="text-xl font-semibold text-[#39FF14]">Success</h2>
              <p className="text-sm text-gray-400">Ready for the next person...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in duration-300">
              
              {errorMsg && (
                <div className="p-3 rounded bg-red-500/20 text-red-300 text-sm border border-red-500/50">
                  {errorMsg}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-300 block">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full bg-black/40 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#4169E1] focus:ring-1 focus:ring-[#4169E1] transition-colors"
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-300 block">
                  Phone / WhatsApp <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full bg-black/40 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#4169E1] focus:ring-1 focus:ring-[#4169E1] transition-colors"
                  placeholder="+1 234 567 8900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-300 block">
                  Company (Optional)
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full bg-black/40 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#4169E1] focus:ring-1 focus:ring-[#4169E1] transition-colors"
                  placeholder="Acme Corp"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 block mb-2">
                  Interested In
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {INTEREST_OPTIONS.map((opt) => (
                    <label
                      key={opt}
                      className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        interest.includes(opt)
                          ? 'border-[#4169E1] bg-[#4169E1]/10'
                          : 'border-gray-700 bg-black/40 hover:border-gray-500'
                      } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={interest.includes(opt)}
                        onChange={() => toggleInterest(opt)}
                        disabled={isSubmitting}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                        interest.includes(opt) ? 'border-[#4169E1] bg-[#4169E1]' : 'border-gray-500'
                      }`}>
                        {interest.includes(opt) && <CheckIcon className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-sm">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-4 py-4 rounded-xl font-bold text-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#39FF14' }} // Cyber green solid button
              >
                {isSubmitting ? 'Submitting...' : 'Register Now'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

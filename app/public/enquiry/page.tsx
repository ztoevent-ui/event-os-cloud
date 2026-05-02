'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function EnquiryPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    category: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      if (!result.success) {
        alert('There was an error submitting the form: ' + result.error);
      } else {
        setSubmitted(true);
        // Fire Google Ads Conversion Tracking
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'ads_conversion_Contact_Us_1', {});
        }
      }
    } catch (err: any) {
      alert('Network error. Please try again later.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#050505',
        color: '#fff',
        fontFamily: 'Inter, sans-serif',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Background glow effects */}
      <div
        style={{
          position: 'absolute',
          top: -150,
          left: -100,
          width: 400,
          height: 400,
          background: 'rgba(0, 86, 179, 0.15)',
          filter: 'blur(100px)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -100,
          right: -100,
          width: 500,
          height: 500,
          background: 'rgba(0, 119, 204, 0.1)',
          filter: 'blur(120px)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />

      {/* Nav Link back to Home */}
      <div style={{ padding: '32px 48px', position: 'relative', zIndex: 10 }}>
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            color: '#6BB8FF',
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 500,
            transition: 'color 0.2s',
          }}
        >
          <i className="fa-solid fa-arrow-left" />
          Back to Home
        </Link>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 580,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 24,
            padding: 'clamp(32px, 5vw, 48px)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          }}
        >
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: 'rgba(0, 153, 255, 0.15)',
                  border: '1px solid rgba(0, 153, 255, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px',
                }}
              >
                <i
                  className="fa-solid fa-check"
                  style={{ fontSize: 32, color: '#6BB8FF' }}
                />
              </div>
              <h2
                style={{
                  fontWeight: 800,
                  fontSize: 28,
                  marginBottom: 16,
                  letterSpacing: '-0.5px',
                  background: 'linear-gradient(90deg, #FFFFFF, #6BB8FF)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Request Received
              </h2>
              <p
                style={{
                  color: 'rgba(229,229,229,0.6)',
                  lineHeight: 1.6,
                  fontSize: 15,
                  marginBottom: 32,
                }}
              >
                Thank you for your interest in Zero To One Event. Our production
                team will reach out to you within 24-48 hours.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff',
                  padding: '12px 24px',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')
                }
              >
                Submit Another Request
              </button>
            </div>
          ) : (
            <>
              <div style={{ textAlign: 'center', marginBottom: 40 }}>
                <div
                  style={{
                    display: 'inline-block',
                    background: 'rgba(0,86,179,0.15)',
                    border: '1px solid rgba(0,86,179,0.3)',
                    color: '#6BB8FF',
                    padding: '6px 16px',
                    borderRadius: 100,
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                    marginBottom: 16,
                  }}
                >
                  Project Enquiry
                </div>
                <h1
                  style={{
                    fontWeight: 800,
                    fontSize: 32,
                    letterSpacing: '-1px',
                    marginBottom: 12,
                  }}
                >
                  Start a Project
                </h1>
                <p style={{ color: 'rgba(229,229,229,0.5)', fontSize: 14 }}>
                  Fill in the details below, and our project manager will get
                  back to you shortly.
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
              >
                {/* Contact Name */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'rgba(229,229,229,0.8)',
                    }}
                  >
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. John Doe"
                    style={{
                      width: '100%',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 10,
                      padding: '14px 16px',
                      color: '#fff',
                      fontSize: 15,
                      outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = 'rgba(0,119,204,0.5)')
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')
                    }
                  />
                </div>

                {/* Company Name */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'rgba(229,229,229,0.8)',
                    }}
                  >
                    Company Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                    placeholder="e.g. Acme Corp"
                    style={{
                      width: '100%',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 10,
                      padding: '14px 16px',
                      color: '#fff',
                      fontSize: 15,
                      outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = 'rgba(0,119,204,0.5)')
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')
                    }
                  />
                </div>

                {/* 2-col layout for Email & Phone */}
                <div
                  style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'rgba(229,229,229,0.8)',
                      }}
                    >
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="you@company.com"
                      style={{
                        width: '100%',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 10,
                        padding: '14px 16px',
                        color: '#fff',
                        fontSize: 15,
                        outline: 'none',
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={(e) =>
                        (e.currentTarget.style.borderColor = 'rgba(0,119,204,0.5)')
                      }
                      onBlur={(e) =>
                        (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')
                      }
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'rgba(229,229,229,0.8)',
                      }}
                    >
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="+60 12 345 6789"
                      style={{
                        width: '100%',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 10,
                        padding: '14px 16px',
                        color: '#fff',
                        fontSize: 15,
                        outline: 'none',
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={(e) =>
                        (e.currentTarget.style.borderColor = 'rgba(0,119,204,0.5)')
                      }
                      onBlur={(e) =>
                        (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')
                      }
                    />
                  </div>
                </div>

                {/* Event Category Component */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'rgba(229,229,229,0.8)',
                    }}
                  >
                    Event Category
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    style={{
                      width: '100%',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 10,
                      padding: '14px 16px',
                      color: '#fff',
                      fontSize: 15,
                      outline: 'none',
                      appearance: 'none', // Remove native arrow
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = 'rgba(0,119,204,0.5)')
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')
                    }
                  >
                    <option value="" disabled selected>Select an option</option>
                    <option value="brand_activation" style={{ background: '#050505' }}>Brand Activation & Roadshow</option>
                    <option value="corporate_gala" style={{ background: '#050505' }}>Corporate Gala & Annual Dinner</option>
                    <option value="conference" style={{ background: '#050505' }}>Conference & Summit</option>
                    <option value="concert" style={{ background: '#050505' }}>Concert & Live Entertainment</option>
                    <option value="tournament" style={{ background: '#050505' }}>Tournament & Sports Event</option>
                    <option value="other" style={{ background: '#050505' }}>Other</option>
                  </select>
                </div>

                {/* Notes Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'rgba(229,229,229,0.8)',
                    }}
                  >
                    Additional Notes
                  </label>
                  <textarea
                    placeholder="Tell us a bit about your scale, dates, or specific requirements..."
                    rows={4}
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    style={{
                      width: '100%',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 10,
                      padding: '14px 16px',
                      color: '#fff',
                      fontSize: 15,
                      resize: 'none',
                      outline: 'none',
                      fontFamily: 'inherit',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = 'rgba(0,119,204,0.5)')
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')
                    }
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    background: 'linear-gradient(135deg, #0056B3, #0077CC)',
                    color: '#fff',
                    border: 'none',
                    padding: '16px',
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 0 20px rgba(0,86,179,0.3)',
                    marginTop: 10,
                    transition: 'all 0.2s ease',
                    opacity: isSubmitting ? 0.8 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!isSubmitting) {
                      e.currentTarget.style.boxShadow = '0 0 35px rgba(0,86,179,0.5)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSubmitting) {
                      e.currentTarget.style.boxShadow = '0 0 20px rgba(0,86,179,0.3)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  {isSubmitting ? 'Sending Request...' : 'Submit Enquiry'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

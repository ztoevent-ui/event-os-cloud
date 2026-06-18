'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function AttendeeForm({ attendee, index, eventType }: { attendee: any, index: number, eventType: string }) {
  const [isEditing, setIsEditing] = useState(
    !attendee.attendee_ic || !attendee.tshirt_size || !attendee.attendee_phone
  );
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    attendee_name: attendee.attendee_name || '',
    attendee_email: attendee.attendee_email || '',
    attendee_phone: attendee.attendee_phone || '',
    attendee_ic: attendee.attendee_ic || '',
    tshirt_size: attendee.tshirt_size || ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ticketing/attendee/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendeeId: attendee.id,
          ...formData
        })
      });

      if (!res.ok) throw new Error('Failed to save');
      
      // Update local state to show saved data
      attendee.attendee_name = formData.attendee_name;
      attendee.attendee_email = formData.attendee_email;
      attendee.attendee_phone = formData.attendee_phone;
      attendee.attendee_ic = formData.attendee_ic;
      attendee.tshirt_size = formData.tshirt_size;
      
      setIsEditing(false);
    } catch (err) {
      alert('Failed to save changes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isMarathon = eventType === 'marathon';

  return (
    <div className="zto-card zto-card-sm" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ color: 'var(--zto-lime)', fontSize: '1.1rem', fontWeight: 700 }}>Ticket #{index + 1}</h4>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)} 
            className="zto-btn zto-btn-ghost" 
            style={{ padding: '6px 12px', fontSize: '0.7rem' }}
          >
            Edit Details
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
        {/* QR Code Section */}
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ padding: 12, background: '#fff', borderRadius: 12 }}>
            <QRCodeSVG value={attendee.ticket_code} size={120} />
          </div>
          <div className="zto-label" style={{ userSelect: 'all' }}>{attendee.ticket_code.split('-')[0]}</div>
        </div>

        {/* Details / Form Section */}
        <div style={{ flex: 1, minWidth: 280 }}>
          {isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="zto-label" style={{ display: 'block', marginBottom: 8 }}>Full Name</label>
                <input 
                  type="text" name="attendee_name" value={formData.attendee_name} onChange={handleChange} 
                  className="zto-input" placeholder="e.g. John Doe" 
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label className="zto-label" style={{ display: 'block', marginBottom: 8 }}>Email</label>
                  <input 
                    type="email" name="attendee_email" value={formData.attendee_email} onChange={handleChange} 
                    className="zto-input" placeholder="john@example.com" 
                  />
                </div>
                <div>
                  <label className="zto-label" style={{ display: 'block', marginBottom: 8 }}>Phone Number</label>
                  <input 
                    type="tel" name="attendee_phone" value={formData.attendee_phone} onChange={handleChange} 
                    className="zto-input" placeholder="+60123456789" 
                  />
                </div>
              </div>

              {isMarathon && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label className="zto-label" style={{ display: 'block', marginBottom: 8 }}>IC / Passport Number *</label>
                    <input 
                      type="text" name="attendee_ic" value={formData.attendee_ic} onChange={handleChange} 
                      className="zto-input" placeholder="For race registration" 
                    />
                  </div>
                  <div>
                    <label className="zto-label" style={{ display: 'block', marginBottom: 8 }}>T-Shirt Size *</label>
                    <select 
                      name="tshirt_size" value={formData.tshirt_size} onChange={handleChange} 
                      className="zto-input"
                    >
                      <option value="" disabled>Select Size</option>
                      <option value="XS">XS</option>
                      <option value="S">S</option>
                      <option value="M">M</option>
                      <option value="L">L</option>
                      <option value="XL">XL</option>
                      <option value="XXL">XXL</option>
                      <option value="XXXL">XXXL</option>
                    </select>
                  </div>
                </div>
              )}

              <div style={{ marginTop: 8 }}>
                <button 
                  onClick={handleSave} 
                  disabled={loading || (isMarathon && (!formData.attendee_ic || !formData.tshirt_size))}
                  className="zto-btn zto-btn-primary"
                >
                  {loading ? 'Saving...' : 'Save Details'}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 16px' }}>
              <div>
                <div className="zto-label">Name</div>
                <div style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 600, marginTop: 4 }}>{attendee.attendee_name || '-'}</div>
              </div>
              <div>
                <div className="zto-label">Email</div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', marginTop: 4 }}>{attendee.attendee_email || '-'}</div>
              </div>
              <div>
                <div className="zto-label">Phone</div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', marginTop: 4 }}>{attendee.attendee_phone || '-'}</div>
              </div>
              {isMarathon && (
                <>
                  <div>
                    <div className="zto-label">IC / Passport</div>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', marginTop: 4 }}>{attendee.attendee_ic || '-'}</div>
                  </div>
                  <div>
                    <div className="zto-label">T-Shirt Size</div>
                    <div style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 600, marginTop: 4 }}>{attendee.tshirt_size || '-'}</div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

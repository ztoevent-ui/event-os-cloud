
'use client'

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { submitConsultation } from '../consultation-actions';

interface WizardProps {
    projectId?: string; // Optional for public form
}

export default function ConsultingForm({ projectId }: WizardProps) {
    // Vendor List for Step 3
    const vendorServices = [
        "Venue", "Photography / Videography", "Makeup Artist (MUA)", "Boutique / Gown", "Decor / Florist"
    ];

    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        project_id: projectId || '', // Handle missing projectId
        groom_name: '',
        bride_name: '',
        contact_phone: '',
        contact_email: '',
        contact_time: '',
        wedding_date: '',
        location: '',
        guest_count: '',
        budget_range: '',
        wedding_theme: '',
        booked_vendors: vendorServices.map(service => ({ service, name: '', contact: '', phone: '', isBooked: false })),
        special_features: '',
        important_notes: '',
        love_story: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleVendorChange = (index: number, field: string, value: string | boolean) => {
        const updatedVendors = [...formData.booked_vendors];
        updatedVendors[index] = { ...updatedVendors[index], [field]: value };
        setFormData(prev => ({ ...prev, booked_vendors: updatedVendors }));
    };

    const nextStep = () => setStep(step + 1);
    const prevStep = () => setStep(step - 1);

    const handleSubmit = async () => {
        // Serialize formData for server action
        const data = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
            if (key === 'booked_vendors') {
                const vendors = value as Array<{ service: string, name: string, contact: string, phone: string, isBooked: boolean }>;
                data.append(key, JSON.stringify(vendors.filter((v) => v.isBooked)));
            } else {
                data.append(key, value as string);
            }
        });

        try {
            await submitConsultation(data);
            alert('Consultation submitted successfully! We will contact you shortly.');
            // Reset or Redirect
            window.location.reload();
        } catch (error) {
            alert('Failed to submit. Please try again.');
        }
    };

    // Styling Constants
    const labelStyle = "block text-sm font-semibold text-[#D4AF37] mb-1 tracking-wide font-serif";
    const inputStyle = "w-full bg-white border border-zinc-200 text-zinc-800 p-3 rounded-lg focus:outline-none focus:border-[#D4AF37] transition-colors placeholder:text-zinc-300 font-light";
    const sectionTitle = "text-2xl font-serif text-zinc-900 mb-6 border-b border-[#D4AF37]/30 pb-2";

    return (
        <div className="max-w-3xl mx-auto bg-white shadow-2xl rounded-2xl overflow-hidden border border-zinc-100 min-h-[600px] flex flex-col relative z-0">

            {/* Botanical Background Pattern */}
            <div
                className="absolute inset-0 z-[-1] opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: `url('https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80')`, // Elegant floral/leaf pattern
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    mixBlendMode: 'multiply'
                }}
            ></div>

            {/* Progress Bar */}
            <div className="bg-zinc-50 h-2 w-full relative z-10">
                <div
                    className="h-full bg-[#D4AF37] transition-all duration-500 ease-out"
                    style={{ width: `${(step / 4) * 100}%` }}
                ></div>
            </div>

            <div className="p-8 md:p-12 flex-1 flex flex-col">
                <AnimatePresence mode="wait">

                    {/* STEP 1: THE COUPLE */}
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <h2 className={sectionTitle}>The Couple</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className={labelStyle}>Groom's Full Name</label>
                                    <input name="groom_name" value={formData.groom_name} onChange={handleChange} className={inputStyle} placeholder="Full Name" />
                                </div>
                                <div>
                                    <label className={labelStyle}>Bride's Full Name</label>
                                    <input name="bride_name" value={formData.bride_name} onChange={handleChange} className={inputStyle} placeholder="Full Name" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className={labelStyle}>Contact Number</label>
                                    <input name="contact_phone" value={formData.contact_phone} onChange={handleChange} className={inputStyle} placeholder="+60..." />
                                </div>
                                <div>
                                    <label className={labelStyle}>Email Address</label>
                                    <input name="contact_email" type="email" value={formData.contact_email} onChange={handleChange} className={inputStyle} placeholder="email@example.com" />
                                </div>
                            </div>
                            <div>
                                <label className={labelStyle}>Best Time to Contact</label>
                                <select name="contact_time" value={formData.contact_time} onChange={handleChange} className={inputStyle}>
                                    <option value="">Select a time...</option>
                                    <option value="morning">Morning (9am - 12pm)</option>
                                    <option value="afternoon">Afternoon (12pm - 5pm)</option>
                                    <option value="evening">Evening (5pm - 9pm)</option>
                                    <option value="weekend">Weekends Only</option>
                                </select>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 2: THE BIG DAY */}
                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <h2 className={sectionTitle}>The Big Day</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className={labelStyle}>Wedding Date (Tentative)</label>
                                    <input type="date" name="wedding_date" value={formData.wedding_date} onChange={handleChange} className={inputStyle} />
                                </div>
                                <div>
                                    <label className={labelStyle}>Location / City</label>
                                    <input name="location" value={formData.location} onChange={handleChange} className={inputStyle} placeholder="e.g., Bintulu" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className={labelStyle}>Est. Guest Count</label>
                                    <input type="number" name="guest_count" value={formData.guest_count} onChange={handleChange} className={inputStyle} placeholder="e.g. 500" />
                                </div>
                                <div>
                                    <label className={labelStyle}>Budget Range</label>
                                    <select name="budget_range" value={formData.budget_range} onChange={handleChange} className={inputStyle}>
                                        <option value="">Select Range...</option>
                                        <option value="<30k">Below RM 30k</option>
                                        <option value="30k-50k">RM 30k - RM 50k</option>
                                        <option value="50k-80k">RM 50k - RM 80k</option>
                                        <option value="80k-150k">RM 80k - RM 150k</option>
                                        <option value=">150k">Above RM 150k</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className={labelStyle}>Preferred Theme / Style</label>
                                <input name="wedding_theme" value={formData.wedding_theme} onChange={handleChange} className={inputStyle} placeholder="e.g. Garden, Modern, Traditional..." />
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 3: CURRENT PROGRESS */}
                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6 overflow-y-auto max-h-[500px] pr-2"
                        >
                            <h2 className={sectionTitle}>Current Progress</h2>
                            <p className="text-zinc-500 text-sm mb-4">Have you already booked any services? Check the box and provide details.</p>

                            <div className="space-y-4">
                                {formData.booked_vendors.map((vendor, index) => (
                                    <div key={index} className={`p-4 rounded-xl border transition-all ${vendor.isBooked ? 'border-[#D4AF37] bg-yellow-50/30' : 'border-zinc-200 bg-white'}`}>
                                        <div className="flex items-center gap-3 mb-2">
                                            <input
                                                type="checkbox"
                                                checked={vendor.isBooked}
                                                onChange={(e) => handleVendorChange(index, 'isBooked', e.target.checked)}
                                                className="w-5 h-5 accent-[#D4AF37] cursor-pointer"
                                            />
                                            <span className={`font-serif text-lg ${vendor.isBooked ? 'text-zinc-900' : 'text-zinc-400'}`}>{vendor.service}</span>
                                        </div>

                                        {vendor.isBooked && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                className="grid grid-cols-1 md:grid-cols-3 gap-3 ml-8 mt-3"
                                            >
                                                <input
                                                    value={vendor.name}
                                                    onChange={(e) => handleVendorChange(index, 'name', e.target.value)}
                                                    placeholder="Vendor Name"
                                                    className="bg-white border text-sm p-2 rounded"
                                                />
                                                <input
                                                    value={vendor.contact}
                                                    onChange={(e) => handleVendorChange(index, 'contact', e.target.value)}
                                                    placeholder="Contact Person"
                                                    className="bg-white border text-sm p-2 rounded"
                                                />
                                                <input
                                                    value={vendor.phone}
                                                    onChange={(e) => handleVendorChange(index, 'phone', e.target.value)}
                                                    placeholder="Phone/Email"
                                                    className="bg-white border text-sm p-2 rounded"
                                                />
                                            </motion.div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 4: PERSONAL TOUCHES */}
                    {step === 4 && (
                        <motion.div
                            key="step4"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <h2 className={sectionTitle}>Personal Touches</h2>
                            <div>
                                <label className={labelStyle}>Special Features</label>
                                <textarea
                                    name="special_features"
                                    value={formData.special_features}
                                    onChange={handleChange}
                                    rows={2}
                                    className={inputStyle}
                                    placeholder="e.g. Fireworks, Live Band..."
                                ></textarea>
                            </div>
                            <div>
                                <label className={labelStyle}>Important Notes</label>
                                <textarea
                                    name="important_notes"
                                    value={formData.important_notes}
                                    onChange={handleChange}
                                    rows={2}
                                    className={inputStyle}
                                    placeholder="Allergies, traditions, or restrictions..."
                                ></textarea>
                            </div>
                            <div>
                                <label className={labelStyle}>Your Love Story <span className="text-xs text-zinc-400 font-normal ml-2">(Used for AI summary)</span></label>
                                <textarea
                                    name="love_story"
                                    value={formData.love_story}
                                    onChange={handleChange}
                                    rows={4}
                                    className={inputStyle}
                                    placeholder="Tell us a little about how you met..."
                                ></textarea>
                            </div>
                            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200/50 mt-4">
                                <div className="flex gap-3">
                                    <i className="fa-solid fa-wand-magic-sparkles text-[#D4AF37] mt-1"></i>
                                    <div>
                                        <h4 className="text-sm font-bold text-zinc-800 mb-1">AI Powered Profile</h4>
                                        <p className="text-xs text-zinc-600">Our system will automatically generate a summary of your requirements to help our team serve you better.</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>

                {/* Footer Controls */}
                <div className="mt-auto pt-8 flex justify-between items-center border-t border-zinc-100">
                    <button
                        onClick={prevStep}
                        disabled={step === 1}
                        className={`text-zinc-500 hover:text-zinc-900 font-serif px-4 py-2 transition-colors ${step === 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                    >
                        <i className="fa-solid fa-arrow-left mr-2"></i> Back
                    </button>

                    {step < 4 ? (
                        <button
                            onClick={nextStep}
                            className="bg-[#D4AF37] hover:bg-[#c4a130] text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-[#D4AF37]/20 transition-all transform hover:scale-105"
                        >
                            Next Step <i className="fa-solid fa-arrow-right ml-2"></i>
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            className="bg-zinc-900 hover:bg-black text-white px-8 py-3 rounded-full font-bold shadow-lg transition-all transform hover:scale-105 flex items-center gap-2"
                        >
                            <i className="fa-regular fa-paper-plane"></i> Submit Consultation
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

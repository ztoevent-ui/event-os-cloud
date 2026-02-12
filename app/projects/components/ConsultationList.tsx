'use client';
import { useState } from 'react';
import ConsultationCard from '../../components/ConsultationCard';

export default function ConsultationList({ initialConsultations }: { initialConsultations: any[] }) {
    const [consultations, setConsultations] = useState(initialConsultations);

    const handleDelete = (id: string) => {
        setConsultations(prev => prev.filter(c => c.id !== id));
    };

    const handleUpdate = (updatedC: any) => {
        setConsultations(prev => prev.map(c => c.id === updatedC.id ? updatedC : c));
    };

    if (!consultations || consultations.length === 0) {
        return (
            <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-zinc-100 col-span-full">
                <i className="fa-solid fa-folder-open text-4xl text-zinc-300 mb-4"></i>
                <h3 className="text-xl font-bold text-zinc-700">No Consultations Yet</h3>
                <p className="text-zinc-500">Share the consulting form link to get started.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {consultations.map((c: any) => (
                <ConsultationCard
                    key={c.id}
                    consultation={c}
                    onDelete={handleDelete}
                    onUpdate={handleUpdate}
                />
            ))}
        </div>
    );
}

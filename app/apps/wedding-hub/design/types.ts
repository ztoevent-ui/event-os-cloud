export interface Template {
    id: string;
    name: string;
    description?: string;

    // Visuals
    backgroundColor: string; // Tailwind class or Hex
    backgroundImage?: string;

    // Typography
    fontFamily: string; // 'serif', 'sans', 'mono', etc.
    textColor: string; // Tailwind class or Hex
    accentColor: string; // For buttons, icons

    // Layout/Content configuration could go here
    coverImage: string; // default cover image for this template
}

export const DEFAULT_TEMPLATES: Template[] = [
    {
        id: 'classic',
        name: 'Classic Elegance',
        description: 'Timeless and sophisticated.',
        backgroundColor: 'bg-stone-100',
        fontFamily: 'font-serif',
        textColor: 'text-gray-900',
        accentColor: 'text-stone-600',
        coverImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=300'
    },
    {
        id: 'modern',
        name: 'Modern Minimal',
        description: 'Clean lines and ample whitespace.',
        backgroundColor: 'bg-white',
        fontFamily: 'font-sans',
        textColor: 'text-gray-800',
        accentColor: 'text-black',
        coverImage: 'https://images.unsplash.com/photo-1510076860523-8c11e64903ec?auto=format&fit=crop&q=80&w=300'
    },
    {
        id: 'floral',
        name: 'Floral Garden',
        description: 'Soft pinks and romantic vibes.',
        backgroundColor: 'bg-pink-50',
        fontFamily: 'font-serif',
        textColor: 'text-gray-900',
        accentColor: 'text-pink-600',
        coverImage: 'https://images.unsplash.com/photo-1507504031981-723e9edd684e?auto=format&fit=crop&q=80&w=300'
    },
    {
        id: 'gold',
        name: 'Golden Luxury',
        description: 'Opulent and grand.',
        backgroundColor: 'bg-amber-50',
        fontFamily: 'font-serif',
        textColor: 'text-amber-900',
        accentColor: 'text-amber-600',
        coverImage: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=300'
    },
    {
        id: 'oriental',
        name: 'Oriental Celebration',
        description: 'Traditional red and gold Chinese style.',
        backgroundColor: 'bg-red-900',
        fontFamily: 'font-serif',
        textColor: 'text-amber-50',
        accentColor: 'text-amber-400',
        coverImage: 'https://images.unsplash.com/photo-1546825316-f048b62828be?auto=format&fit=crop&q=80&w=300'
    },
];

import React from 'react';

export default function TopNav() {
    return (
        <header className="h-16 sticky top-0 z-40 bg-[#faf9fd]/80 backdrop-blur-md border-b-[1.5px] border-[#eeedf5] flex items-center justify-between px-10 w-full">
            <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center bg-surface-container-low ghost-border rounded-full px-4 py-1.5 w-96">
                    <span className="material-symbols-outlined text-outline text-sm">search</span>
                    <input 
                        type="text" 
                        placeholder="Search keywords, articles, or domains..." 
                        className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-outline/60 outline-none pl-2"
                    />
                </div>
            </div>
            
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                    <button className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors">
                        <span className="material-symbols-outlined">notifications</span>
                    </button>
                    <button className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors">
                        <span className="material-symbols-outlined">settings</span>
                    </button>
                </div>
                
                <div className="h-8 w-[1.5px] bg-[#eeedf5]"></div>
                
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <p className="text-sm font-bold text-on-surface">Alex River</p>
                        <p className="text-[10px] text-outline uppercase font-semibold">Pro Plan</p>
                    </div>
                    <img 
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuC5hj9GxqVMz5Y5a46tdukv8H3bQ0OdplZqg9utZR5t4ePIb_5twTm2bGSAHnDnUWSRFJG32zq8d3Bm5D8gtitqas6CiwMP6vuQFLNwRSkbKzvpNJiBXQTF3egcN5EgZ-hmgK7Swrki0_-T7wiOMxLj4Y4gf2hcaCv-S7N8OcLwXvc30CcfqR4HHCsoTZWNY6GLjqjMKHcO4-bYgqczmbwZ1neqe4AutBsX_j3A8_M-0Mt6RWstEHJtxCpHSwVX3n3uCtpX7aTC0ME" 
                        alt="User Profile" 
                        className="w-9 h-9 rounded-full object-cover border-2 border-primary-fixed bg-surface-container" 
                    />
                </div>
            </div>
        </header>
    );
}

import React, { useState } from 'react';

// --- Sparkle Icon Helper Component ---
// This is the same icon used on the other pages.
const SparkleIcon = () => (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
        <path d="M6 0L7.84315 4.15685L12 6L7.84315 7.84315L6 12L4.15685 7.84315L0 6L4.15685 4.15685L6 0Z" fill="currentColor"/>
    </svg>
);

interface StudentNameEntryProps {
  onNameSubmit: (name: string) => void;
}

const StudentNameEntry: React.FC<StudentNameEntryProps> = ({ onNameSubmit }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onNameSubmit(name.trim());
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 font-sans text-center">
      <div className="w-full max-w-2xl flex flex-col items-center">

        {/* Header Pill */}
        <div className="inline-flex items-center justify-center bg-gradient-to-r from-[#7565D9] to-[#4D0ACD] text-white text-sm font-semibold px-4 py-2 rounded-full mb-12">
          <SparkleIcon />
          Intervue Poll
        </div>

        {/* Heading and Subheading */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-[#373737] mb-4">
            Let's Get Started
          </h1>
          <p className="text-[#6E6E6E] text-lg max-w-xl leading-relaxed">
            If you're a student, you'll be able to <strong>submit your answers</strong>, participate in live polls, and see how your responses compare with your classmates.
          </p>
        </div>

        {/* Name Entry Form */}
        <form onSubmit={handleSubmit} className="w-full max-w-lg flex flex-col items-center gap-y-8">
          {/* Label is now outside the gray box */}
          <div className="w-full text-left">
            <label htmlFor="name" className="block text-sm font-bold text-[#373737] mb-2">
              Enter your Name
            </label>
            <div className="bg-[#F2F2F2] rounded-xl p-4 w-full">
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full bg-transparent text-lg text-[#373737] placeholder-gray-400 focus:outline-none border-none p-0"
                required
              />
            </div>
          </div>

          {/* Continue Button */}
          <button
            type="submit"
            disabled={!name.trim()}
            style={{ background: 'linear-gradient(to right, #8F64E1, #1D68BD)' }}
            className="w-[234px] h-[58px] text-white font-bold py-3 px-6 rounded-full transition-opacity duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </form>
        
      </div>
    </div>
  );
};

export default StudentNameEntry;


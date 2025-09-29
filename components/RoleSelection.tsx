import React, { useState } from 'react';
import { UserRole } from '../types';
import SparkleIcon from './SparkleIcon'; // Import the icon

interface RoleSelectionProps {
  onRoleSelect: (role: UserRole) => void;
}

const RoleSelection: React.FC<RoleSelectionProps> = ({ onRoleSelect }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const handleContinue = () => {
    if (selectedRole) {
      onRoleSelect(selectedRole);
    }
  };

  const baseCardStyles = "flex flex-col text-left rounded-[10px] w-full max-w-sm h-[143px] p-px cursor-pointer transition-all duration-300";
  const unselectedCardStyles = "bg-intervue-light-gray";
  const selectedCardStyles = "bg-gradient-intervue-card shadow-lg";

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 font-sans">
      <div className="flex flex-col items-center text-center w-full">
        
        <div className="flex items-center justify-center bg-gradient-intervue-pill text-white text-sm font-semibold px-4 py-2 rounded-full mb-8 md:mb-12">
          <SparkleIcon />
          Intervue Poll
        </div>

        {/* --- MODIFIED SECTION STARTS HERE --- */}
        <div className="mb-10 md:mb-16">
          <h1 className="text-3xl md:text-5xl text-intervue-dark mb-4">
            {/* Split into two spans for different font weights */}
            <span className="font-medium">Welcome to the </span>
            <span className="font-extrabold">Live Polling System</span>
          </h1>
          <p className="text-intervue-gray max-w-2xl text-lg leading-relaxed">
            {/* Added text-lg and leading-relaxed for better readability */}
            Please select the role that best describes you to begin using the live polling system
          </p>
        </div>
        {/* --- MODIFIED SECTION ENDS HERE --- */}

        <div className="flex flex-col md:flex-row w-full justify-center items-center gap-8 md:gap-10 mb-10 md:mb-16 px-4">
          {/* Student Card */}
          <div
            onClick={() => setSelectedRole('student')}
            className={`${baseCardStyles} ${selectedRole === 'student' ? selectedCardStyles : unselectedCardStyles}`}
          >
            <div className="bg-white rounded-[9px] w-full h-full flex flex-col justify-center px-6 gap-y-4">
              <h3 className="font-bold text-xl text-intervue-dark">I'm a Student</h3>
              <p className="text-intervue-gray text-sm">
                Lorem ipsum is simply dummy text of the printing and typesetting industry
              </p>
            </div>
          </div>

          {/* Teacher Card */}
          <div
            onClick={() => setSelectedRole('teacher')}
            className={`${baseCardStyles} ${selectedRole === 'teacher' ? selectedCardStyles : unselectedCardStyles}`}
          >
            <div className="bg-white rounded-[9px] w-full h-full flex flex-col justify-center px-6 gap-y-4">
              <h3 className="font-bold text-xl text-intervue-dark">I'm a Teacher</h3>
              <p className="text-intervue-gray text-sm">
                Submit answers and view live poll results in real-time
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleContinue}
          disabled={!selectedRole}
          className="w-[234px] h-[58px] bg-gradient-intervue-button text-white font-bold py-3 px-6 rounded-full transition-opacity duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default RoleSelection;
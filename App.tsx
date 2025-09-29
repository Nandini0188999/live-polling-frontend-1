import React, { useState } from 'react';
import { useSocket } from './hooks/useSocket';
import { UserRole } from './types';
import RoleSelection from './components/RoleSelection';
import StudentNameEntry from './components/StudentNameEntry';
import TeacherDashboard from './components/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard';

function App() {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [studentName, setStudentName] = useState<string>('');
  const socket = useSocket();

  if (!socket) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Connecting to server...</p>
        </div>
      </div>
    );
  }

  if (!userRole) {
    return <RoleSelection onRoleSelect={setUserRole} />;
  }

  if (userRole === 'student' && !studentName) {
    return <StudentNameEntry onNameSubmit={setStudentName} />;
  }

  if (userRole === 'teacher') {
    return <TeacherDashboard socket={socket} />;
  }

  if (userRole === 'student' && studentName) {
    return <StudentDashboard socket={socket} studentName={studentName} />;
  }

  return null;
}

export default App;
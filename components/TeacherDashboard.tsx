import React, { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { BarChart3, Plus, Users, X, MessageSquare, Send } from 'lucide-react';

// --- TYPE DEFINITIONS ---
interface Student { id: string; name: string; }
interface PollOptionState { id: number; text: string; }
interface CreatedPoll {
  id: number;
  question: string;
  options: PollOptionState[];
  timeLimit: number;
}
interface PollResult {
    id: number;
    question: string;
    options: { text: string, percentage: number }[];
}
interface ChatMessage {
    sender: string; // 'teacher' or student's name
    text: string;
}
interface TeacherDashboardProps {
  socket: Socket;
}

// --- Sparkle Icon Helper Component ---
const SparkleIcon = () => (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 0L7.84315 4.15685L12 6L7.84315 7.84315L6 12L4.15685 7.84315L0 6L4.15685 4.15685L6 0Z" fill="currentColor"/>
    </svg>
);

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ socket }) => {
  // --- STATE MANAGEMENT ---
  const [view, setView] = useState<'creator' | 'history'>('creator');
  const [showPopup, setShowPopup] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'participants'>('chat');
  
  const [pollHistory, setPollHistory] = useState<PollResult[]>([]);
  const [participants, setParticipants] = useState<Student[]>([
    { id: '1', name: 'Anjali Sharma' },
    { id: '2', name: 'Rahul Bajaj' },
    { id: '3', name: 'Priya Patel' },
  ]);
  const [messages, setMessages] = useState<ChatMessage[]>([
      { sender: 'Anjali Sharma', text: 'Hello Professor!' },
      { sender: 'teacher', text: 'Hello class, welcome.' }
  ]);
  const [newMessage, setNewMessage] = useState('');
  
  const [createdPolls, setCreatedPolls] = useState<CreatedPoll[]>([]);
  const [nextPollId, setNextPollId] = useState(1);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<PollOptionState[]>([ { id: 1, text: '' }, { id: 2, text: '' } ]);
  const [correctOptionId, setCorrectOptionId] = useState<number | null>(1);
  const [timeLimit, setTimeLimit] = useState(60);
  const [nextOptionId, setNextOptionId] = useState(3);
  const chatEndRef = useRef<null | HTMLDivElement>(null);

  // --- SOCKET.IO EFFECT ---
  useEffect(() => {
    if (!socket) return; 

    socket.on('poll-completed', (newResult: PollResult) => {
        setPollHistory(prevHistory => [...prevHistory, newResult]);
    });
    socket.on('participants-list', (studentList: Student[]) => {
        setParticipants(studentList);
    });
    // This listener now ONLY handles messages from students to prevent duplication.
    socket.on('new-message', (message: ChatMessage) => {
        if (message.sender !== 'teacher') {
            setMessages(prev => [...prev, message]);
        }
    });

    socket.emit('get-participants-list');
    return () => {
      socket.off('poll-completed');
      socket.off('participants-list');
      socket.off('new-message');
    };
  }, [socket]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showPopup]);

  // --- HANDLER FUNCTIONS ---
  const handleKickStudent = (studentId: string) => {
    setParticipants(participants.filter(p => p.id !== studentId));
    socket.emit('kick-student', studentId);
    alert(`Kicked student with ID: ${studentId}`);
  };

  const handleSendMessage = (e: React.FormEvent) => {
      e.preventDefault();
      if (newMessage.trim()) {
          const message: ChatMessage = { sender: 'teacher', text: newMessage };
          // 1. Send the message to the server for students
          socket.emit('send-message', message);
          // 2. Add the message to the teacher's own chat window immediately so it appears on the right
          setMessages(prev => [...prev, message]);
          setNewMessage(''); // Clear the input field after sending
      }
  };

  const handleAddOption = () => {
    if (options.length < 5) {
      setOptions([...options, { id: nextOptionId, text: '' }]);
      setNextOptionId(nextOptionId + 1);
    }
  };

  const handleOptionTextChange = (id: number, newText: string) => {
    setOptions(options.map((option) => option.id === id ? { ...option, text: newText } : option));
  };

  const handleCreatePoll = (e: React.FormEvent) => {
    e.preventDefault();
    const validOptions = options.filter(opt => opt.text.trim() !== '');
    if (!question.trim() || validOptions.length < 2) {
      alert("Please enter a question and at least two options.");
      return;
    }
    const newPoll: CreatedPoll = { id: nextPollId, question, options: validOptions, correctOptionId, timeLimit };
    setCreatedPolls(prev => [...prev, newPoll]);
    
    const newPollData = { question, options: validOptions.map(opt => opt.text), timeLimit };
    socket.emit('create-poll', newPollData);
    
    const mockResult: PollResult = {
        id: nextPollId,
        question: question,
        options: validOptions.map(opt => ({ text: opt.text, percentage: Math.floor(Math.random() * 80) + 10 }))
    };
    setPollHistory(prev => [...prev, mockResult]);
    setView('history');
    
    setQuestion('');
    setOptions([{ id: 1, text: '' }, { id: 2, text: '' }]);
    setCorrectOptionId(1);
    setTimeLimit(60);
    setNextPollId(nextPollId + 1);
    setNextOptionId(3);
  };
  
  const renderContent = () => {
    if (view === 'history') {
      return (
        <div className="poll-history-view">
          <div className="poll-history-header">
            <button onClick={() => setView('creator')} className="button-solid-purple">← Back to Creator</button>
          </div>
          {pollHistory.length > 0 ? pollHistory.map(result => (
            <div key={result.id} className="poll-history-card">
              <h2 className="text-xl font-bold text-[#373737]">Question</h2>
              <div className="poll-history-question-box">{result.question}</div>
              <div className="space-y-3">
                {result.options.map((option, index) => (
                  <div key={index} className="poll-history-option-bar">
                    <div className="poll-history-progress" style={{ width: `${option.percentage}%` }}></div>
                    <div className="poll-history-option-content">
                      <div className="flex items-center">
                        <div className="poll-history-option-number">{index + 1}</div>
                        <span>{option.text}</span>
                      </div>
                      <span>{option.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )) : (
            <p className="text-center text-gray-500 py-8">No history to display yet.</p>
          )}
          <button onClick={() => setView('creator')} className="ask-new-question-button">
            <Plus size={16} /> Ask a new question
          </button>
        </div>
      );
    }
    
    // Default view is 'creator'
    return (
      <div className="poll-main-content">
        <header className="poll-header">
          <div className="flex justify-between items-center">
            <div className="poll-header-pill">
              <SparkleIcon /> <span className="ml-2">Intervue Poll</span>
            </div>
            <button onClick={() => setView('history')} className="button-outlined-purple">
              <BarChart3 size={16} /> View Poll History
            </button>
          </div>
          <h1 className="poll-title">Let's Get Started</h1>
          <p className="poll-subtitle">
            You'll have the ability to create and manage polls, ask questions, and monitor your students' responses in real-time.
          </p>
        </header>

        {createdPolls.length > 0 && (
          <div className="poll-created-list">
            <h2 className="text-xl font-bold mb-4 text-[#373737]">Asked Questions ({createdPolls.length})</h2>
            <div className="space-y-3">
              {createdPolls.map(poll => (
                <div key={poll.id} className="poll-created-item">
                  <p className="font-bold text-gray-800">{poll.question}</p>
                  <p className="text-sm text-gray-500 mt-1">{poll.options.length} options · {poll.timeLimit} seconds</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <form onSubmit={handleCreatePoll} className="w-full flex-grow flex flex-col">
          {/* Unchanged Poll Creation Form */}
          <div className="mb-10">
            <div className="flex justify-between items-center mb-3"><label className="poll-label">Enter your question</label><select value={timeLimit} onChange={(e) => setTimeLimit(Number(e.target.value))} className="bg-[#F2F2F2] px-4 py-2 text-sm rounded-lg text-[#373737] font-semibold appearance-none focus:outline-none focus:ring-2 focus:ring-[#7451B6]"><option value={60}>60 seconds ▼</option><option value={30}>30 seconds ▼</option><option value={90}>90 seconds ▼</option></select></div>
            <div className="relative"><textarea value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={100} className="poll-textarea" placeholder="Type your question here..." /><span className="absolute bottom-4 right-4 text-xs text-gray-400">{question.length}/100</span></div>
          </div>
          <div className="flex-grow">
            <div className="flex justify-between items-center mb-4"><h2 className="font-semibold text-lg text-[#373737]">Edit Options</h2><h2 className="font-semibold text-lg text-[#373737] w-[119px] hidden md:block">Is it Correct?</h2></div>
            <div className="space-y-4">{options.map((option, index) => (<div key={option.id} className="flex items-center gap-x-4 poll-option-row"><div className="flex items-center gap-x-4 w-full poll-option-input-container"><div className="flex-shrink-0 w-7 h-7 bg-[#7451B6] text-white text-sm rounded-full flex items-center justify-center font-bold">{index + 1}</div><input type="text" value={option.text} onChange={(e) => handleOptionTextChange(option.id, e.target.value)} className="poll-option-input" placeholder={`Option ${index + 1}`} required /></div><div className="flex items-center gap-x-6 w-[119px] flex-shrink-0 poll-option-correct-container"><label className="poll-radio-label"><input type="radio" name={`correct-option-${option.id}`} checked={correctOptionId === option.id} onChange={() => setCorrectOptionId(option.id)} className="sr-only"/><div className="poll-radio-outer"><div className="poll-radio-inner"></div></div><span>Yes</span></label><label className="poll-radio-label"><input type="radio" name={`correct-option-${option.id}`} checked={correctOptionId !== option.id} onChange={() => { if(correctOptionId === option.id) setCorrectOptionId(null) }} className="sr-only"/><div className="poll-radio-outer"><div className="poll-radio-inner"></div></div><span>No</span></label></div></div>))}</div>
          </div>
          <button type="button" onClick={handleAddOption} className="poll-add-button mt-4"><span className="text-xl">+</span> Add More option</button>
          <footer className="mt-auto pt-8"><hr style={{ borderColor: '#B6B6B6' }} className="mb-6" /><div className="flex justify-end"><button type="submit" className="poll-footer-button">Ask Question</button></div></footer>
        </form>
      </div>
    );
  };
  
  return (
    <>
      <style>{`
        /* Unchanged Core Styles */
        body, html { margin: 0; padding: 0; height: 100%; font-family: 'Sora', sans-serif; background-color: #F7F7F7; }
        .poll-page-container { min-height: 100vh; display: flex; flex-direction: column; align-items: center; padding: 1rem; box-sizing: border-box; }
        .poll-main-content, .poll-history-view { width: 100%; max-width: 900px; padding: 2rem 1rem; }
        .poll-header-pill { background-color: rgba(116, 81, 182, 0.1); color: #7451B6; display: inline-flex; align-items: center; font-size: 12px; font-weight: 600; padding: 6px 12px; border-radius: 9999px; }
        .poll-title { font-size: 2.5rem; font-weight: 700; color: #373737; letter-spacing: -0.02em; margin-bottom: 1rem; margin-top: 2rem; }
        .poll-subtitle { font-size: 1.125rem; color: #6E6E6E; max-width: 40rem; }
        .poll-label { font-weight: 700; color: #373737; }
        .poll-textarea { width: 100%; height: 144px; background-color: #F2F2F2; border-radius: 6px; padding: 16px; resize: none; border: 1px solid transparent; transition: border-color 0.2s; }        
        .poll-option-input { width: 100%; background-color: #F2F2F2; border-radius: 6px; padding: 14px; border: 1px solid transparent; transition: border-color 0.2s; }
        .poll-add-button { color: #7451B6; font-weight: 700; border: 1px solid #7451B6; border-radius: 6px; width: 169px; height: 45px; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .poll-footer-button { width: 234px; height: 58px; background: linear-gradient(to right, #8F64E1, #1D68BD); color: white; font-weight: 700; border-radius: 34px; }
        .poll-radio-label { display: flex; align-items: center; cursor: pointer; color: #373737; }
        .poll-radio-outer { width: 20px; height: 20px; border: 2px solid #D1D5DB; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 8px; }
        .poll-radio-inner { width: 10px; height: 10px; background-color: #7451B6; border-radius: 50%; opacity: 0; }
        .poll-radio-label input:checked + .poll-radio-outer { border-color: #7451B6; }
        .poll-radio-label input:checked + .poll-radio-outer .poll-radio-inner { opacity: 1; }
        .poll-created-list { margin-bottom: 40px; }
        .poll-created-item { padding: 16px; border: 1px solid #F2F2F2; border-radius: 6px; background-color: #FAFAFA; }

        /* --- NEW & UPDATED STYLES --- */
        .button-solid-purple { background-color: #7765DA; color: white; font-weight: 600; padding: 10px 20px; border-radius: 20px; display: flex; align-items: center; gap: 8px; border: none; cursor: pointer; }
        .button-outlined-purple { background-color: #FFFFFF; color: #7765DA; border: 1px solid #7765DA; font-weight: 600; padding: 10px 20px; border-radius: 20px; display: flex; align-items: center; gap: 8px; cursor: pointer; }
        
        /* History View */
        .poll-history-card { background-color: #FFFFFF; border-radius: 12px; padding: 2rem; box-shadow: 0 4px 12px rgba(0,0,0,0.05); margin-bottom: 1.5rem; }
        .poll-history-question-box { background-color: #373737; color: white; border-radius: 6px; padding: 1rem; font-size: 1.125rem; font-weight: 600; margin-top: 1rem; margin-bottom: 1.5rem; }
        .poll-history-option-bar { background-color: #F0F0F0; border-radius: 8px; position: relative; display: flex; align-items: center; padding: 12px 16px; overflow: hidden; }
        .poll-history-progress { background-color: #7765DA; border-radius: 8px; position: absolute; left: 0; top: 0; height: 100%; z-index: 1; }
        .poll-history-option-content { position: relative; z-index: 2; display: flex; justify-content: space-between; align-items: center; width: 100%; color: white; font-weight: 500; }
        .poll-history-option-number { background-color: rgba(255, 255, 255, 0.2); width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; margin-right: 12px; flex-shrink: 0; }
        .ask-new-question-button { background-color: #7765DA; color: white; font-weight: 600; padding: 12px 24px; border-radius: 24px; border: none; display: flex; align-items: center; gap: 8px; margin: 2rem auto 0 auto; }
        
        /* Floating Popup */
        .floating-action-button { position: fixed; bottom: 1.5rem; right: 1.5rem; background-color: #7765DA; color: white; width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: none; box-shadow: 0 4px 12px rgba(0,0,0,0.15); cursor: pointer; z-index: 1000; }
        .popup-container { position: fixed; bottom: 6rem; right: 1.5rem; width: 350px; background-color: white; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.2); z-index: 999; transform-origin: bottom right; display: flex; flex-direction: column; max-height: 70vh; }
        .popup-header { display: flex; border-bottom: 1px solid #F0F0F0; }
        .popup-tab { flex: 1; padding: 12px; text-align: center; font-weight: 600; color: #6E6E6E; cursor: pointer; border-bottom: 2px solid transparent; }
        .popup-tab.active { color: #7765DA; border-bottom-color: #7765DA; }
        .popup-content { overflow-y: auto; flex-grow: 1; display: flex; flex-direction: column; }
        
        /* Participants List inside Popup */
        .participant-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 16px; }
        .participant-avatar { width: 36px; height: 36px; background-color: #7451B6; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; margin-right: 12px; }
        .participant-name { color: #373737; font-weight: 500; }
        .kick-out-button { background-color: #FEE2E2; color: #DC2626; border: 1px solid #FCA5A5; font-weight: 600; padding: 6px 12px; border-radius: 8px; display: flex; align-items: center; cursor: pointer; }
        
        /* Chat Styles */
        .chat-area { flex-grow: 1; padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; }
        .chat-message { max-width: 80%; padding: 8px 12px; border-radius: 12px; }
        .chat-message.student { background-color: #F0F0F0; color: #373737; align-self: flex-start; border-bottom-right-radius: 2px; }
        .chat-message.teacher { background-color: #7765DA; color: white; align-self: flex-end; border-bottom-left-radius: 2px; }
        .chat-form { display: flex; padding: 8px; border-top: 1px solid #F0F0F0; }
        .chat-input { flex-grow: 1; border: none; padding: 8px; background-color: #F7F7F7; border-radius: 8px; margin-right: 8px; }
        .chat-input:focus { outline: none; ring: 2px; ring-color: #7765DA; }
        .send-button { background-color: #7765DA; color: white; border: none; border-radius: 8px; padding: 8px; display: flex; align-items: center; justify-content: center; }
      `}</style>

      <div className="poll-page-container">
        {renderContent()}
      </div>
      
      <button className="floating-action-button" onClick={() => setShowPopup(!showPopup)}>
        {showPopup ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

      {showPopup && (
        <div className="popup-container">
            <div className="popup-header">
                <button className={`popup-tab ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>Chat</button>
                <button className={`popup-tab ${activeTab === 'participants' ? 'active' : ''}`} onClick={() => setActiveTab('participants')}>Participants ({participants.length})</button>
            </div>
            <div className="popup-content">
                {activeTab === 'chat' ? (
                    <>
                        <div className="chat-area">
                            {messages.map((msg, index) => (
                                <div key={index} className={`chat-message ${msg.sender === 'teacher' ? 'teacher' : 'student'}`}>
                                    {msg.text}
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>
                        <form onSubmit={handleSendMessage} className="chat-form">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="chat-input"
                            />
                            <button type="submit" className="send-button"><Send size={20} /></button>
                        </form>
                    </>
                ) : (
                    <div className="py-2">
                        {participants.length > 0 ? participants.map(student => (
                            <div key={student.id} className="participant-item">
                                <div className="flex items-center">
                                    <div className="participant-avatar">{student.name.charAt(0)}</div>
                                    <span className="participant-name">{student.name}</span>
                                </div>
                                <button onClick={() => handleKickStudent(student.id)} className="kick-out-button">
                                    <X size={16} className="mr-1" /> Kick Out
                                </button>
                            </div>
                        )) : (
                            <p className="text-center text-gray-500 py-8">No students yet.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
      )}
    </>
  );
};

export default TeacherDashboard;


import React, { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { Users, Clock, MessageSquare, X, Send } from 'lucide-react';

// --- TYPE DEFINITIONS ---
interface Student { id: string; name: string; }
interface Poll {
  question: string;
  options: string[];
  timeLimit: number;
}
interface PollResults {
    question: string;
    options: { option: string, percentage: number }[];
}
interface ChatMessage {
    sender: string;
    text: string;
}
interface StudentDashboardProps {
  socket: Socket;
  studentName: string;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ socket, studentName }) => {
  // --- STATE MANAGEMENT ---
  const [currentPoll, setCurrentPoll] = useState<Poll | null>(null);
  const [pollResults, setPollResults] = useState<PollResults | null>(null);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isKicked, setIsKicked] = useState(false);

  const [showPopup, setShowPopup] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'participants'>('chat');
  const [participants, setParticipants] = useState<Student[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef<null | HTMLDivElement>(null);

  // --- SOCKET.IO & TIMER EFFECTS ---
  useEffect(() => {
    if (!socket) return;
    // Tell the server a new student has joined
    socket.emit('join-student', { name: studentName });

    // Listen for a new poll from the teacher
    socket.on('new-poll', (poll: Poll) => {
      setCurrentPoll(poll);
      setPollResults(null);
      setSelectedOption('');
      setHasSubmitted(false);
      setTimeLeft(poll.timeLimit);
    });
    // Listen for the results once the poll is over
    socket.on('poll-completed', (results: PollResults) => {
      setPollResults(results);
      setCurrentPoll(null);
      setTimeLeft(0);
    });
    // Listen for updates to the participants list
    socket.on('participants-list', (studentList: Student[]) => {
      setParticipants(studentList);
    });
    // Listen for new chat messages from anyone
    socket.on('new-message', (message: ChatMessage) => {
      setMessages(prev => [...prev, message]);
    });
    // Listen for the 'kicked' event
    socket.on('kicked', () => {
        setIsKicked(true);
        socket.disconnect();
    });
    
    // Clean up listeners when the component unmounts
    return () => {
      socket.off('new-poll');
      socket.off('poll-completed');
      socket.off('participants-list');
      socket.off('new-message');
      socket.off('kicked');
    };
  }, [socket, studentName]);

  useEffect(() => {
    if (currentPoll && timeLeft > 0 && !hasSubmitted) {
      const timer = setInterval(() => {
          setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [currentPoll, timeLeft, hasSubmitted]);
  
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showPopup]);

  // --- HANDLER FUNCTIONS ---
  const handleSubmitResponse = () => {
    if (selectedOption && currentPoll && !hasSubmitted) {
      socket.emit('submit-response', { selectedOption });
      setHasSubmitted(true);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const message: ChatMessage = { sender: studentName, text: newMessage };
      // Only emit the message. The server will send it back to be displayed.
      socket.emit('send-message', message);
      setNewMessage('');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // --- RENDER LOGIC ---
  const renderContent = () => {
    if(isKicked) {
        return (
            <div className="kicked-view">
                <h1 className="text-2xl font-bold text-red-600">You have been removed from the session.</h1>
                <p className="text-gray-500">Please close this window.</p>
            </div>
        );
    }

    if (pollResults) {
      return (
        <div className="poll-card">
            <h2 className="text-xl font-bold text-[#373737]">Results</h2>
            <div className="question-box">{pollResults.question}</div>
            <div className="space-y-3">
                {pollResults.options.map((option, index) => (
                    <div key={index} className="result-bar">
                        <div className="result-progress" style={{ width: `${option.percentage}%` }}></div>
                        <div className="result-content">
                            <div className="flex items-center">
                                <div className="result-option-number">{String.fromCharCode(65 + index)}</div>
                                <span>{option.option}</span>
                            </div>
                            <span>{option.percentage}%</span>
                        </div>
                    </div>
                ))}
            </div>
            <p className="text-center text-gray-500 mt-6">Wait for the teacher to ask a new question..</p>
        </div>
      );
    }

    if (currentPoll) {
      return (
        <div className="poll-card">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-[#373737]">Question</h2>
                <div className="flex items-center gap-x-4">
                    <div className="flex items-center gap-x-1 font-mono text-red-500 font-semibold"><Clock size={16}/><span>{formatTime(timeLeft)}</span></div>
                    <div className="flex items-center gap-x-1 text-gray-500 font-semibold"><Users size={16}/><span>{participants.length}</span></div>
                </div>
            </div>
            <div className="question-box">{currentPoll.question}</div>
            <div className="space-y-3">
                {currentPoll.options.map((option, index) => (
                    <button 
                        key={index}
                        onClick={() => !hasSubmitted && setSelectedOption(option)}
                        disabled={hasSubmitted || timeLeft === 0}
                        className={`option-button ${selectedOption === option ? 'selected' : ''} ${hasSubmitted || timeLeft === 0 ? 'submitted' : ''}`}
                    >
                        <div className="option-letter">{String.fromCharCode(65 + index)}</div>
                        <span>{option}</span>
                    </button>
                ))}
            </div>
            {hasSubmitted ? (
                 <div className="submitted-message">✓ Response Submitted</div>
            ) : (
                <button onClick={handleSubmitResponse} disabled={!selectedOption || timeLeft === 0} className="submit-button">Submit</button>
            )}
        </div>
      );
    }

    return (
      <div className="waiting-card">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-[#7765DA] rounded-full animate-spin mx-auto mb-6"></div>
        <h2 className="text-xl font-bold text-[#373737] mb-2">
          Wait for the teacher to ask questions..
        </h2>
        <p className="text-gray-600">
          You'll be able to participate once a poll is created.
        </p>
      </div>
    );
  };

  return (
    <>
      <style>{`
        body, html { margin: 0; padding: 0; height: 100%; font-family: 'Sora', sans-serif; background-color: #F7F7F7; }
        .page-container { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 1rem; box-sizing: border-box; }
        .poll-card, .waiting-card { background-color: white; border-radius: 12px; padding: 2rem; box-shadow: 0 4px 12px rgba(0,0,0,0.05); width: 100%; max-width: 600px; text-align: center; }
        .question-box { background-color: #373737; color: white; border-radius: 6px; padding: 1rem; font-size: 1.125rem; font-weight: 600; margin-bottom: 1.5rem; text-align: left;}
        
        .option-button { width: 100%; padding: 1rem; border: 2px solid #F0F0F0; border-radius: 8px; text-align: left; display: flex; align-items: center; gap: 1rem; transition: all 0.2s; }
        .option-button:not(:disabled):hover { background-color: #f5f3ff; border-color: #9c8de8; }
        .option-button.selected { border-color: #7765DA; background-color: #f5f3ff; }
        .option-button.submitted { opacity: 0.7; cursor: not-allowed; }
        .option-letter { width: 28px; height: 28px; border-radius: 50%; border: 2px solid #D1D5DB; display: flex; align-items: center; justify-content: center; font-weight: 600; color: #6E6E6E; }
        .option-button.selected .option-letter { border-color: #7765DA; background-color: #7765DA; color: white; }

        .submit-button { width: 100%; padding: 1rem; background: linear-gradient(to right, #8F64E1, #1D68BD); color: white; font-weight: 700; border-radius: 8px; margin-top: 1.5rem; border: none; cursor: pointer; }
        .submit-button:disabled { background: #D1D5DB; cursor: not-allowed; }
        .submitted-message { margin-top: 1.5rem; padding: 0.75rem; background-color: #D1FAE5; color: #065F46; font-weight: 600; border-radius: 8px; }

        .result-bar { background-color: #F0F0F0; border-radius: 8px; position: relative; display: flex; align-items: center; padding: 12px 16px; overflow: hidden; }
        .result-progress { background-color: #7765DA; border-radius: 8px; position: absolute; left: 0; top: 0; height: 100%; z-index: 1; }
        .result-content { position: relative; z-index: 2; display: flex; justify-content: space-between; align-items: center; width: 100%; color: #373737; font-weight: 500; }
        .result-bar .result-progress + .result-content { color: white; }
        .result-option-number { background-color: rgba(55, 55, 55, 0.2); width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; margin-right: 12px; flex-shrink: 0; }
        .result-bar .result-progress + .result-content .result-option-number { background-color: rgba(255, 255, 255, 0.2); }

        .floating-action-button { position: fixed; bottom: 1.5rem; right: 1.5rem; background-color: #7765DA; color: white; width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: none; box-shadow: 0 4px 12px rgba(0,0,0,0.15); cursor: pointer; z-index: 1000; }
        .popup-container { position: fixed; bottom: 6rem; right: 1.5rem; width: 350px; background-color: white; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.2); z-index: 999; display: flex; flex-direction: column; max-height: 70vh; }
        .popup-header { display: flex; border-bottom: 1px solid #F0F0F0; }
        .popup-tab { flex: 1; padding: 12px; text-align: center; font-weight: 600; color: #6E6E6E; cursor: pointer; border-bottom: 2px solid transparent; }
        .popup-tab.active { color: #7765DA; border-bottom-color: #7765DA; }
        .popup-content { overflow-y: auto; flex-grow: 1; display: flex; flex-direction: column; }
        .participant-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 16px; }
        .participant-avatar { width: 36px; height: 36px; background-color: #7451B6; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; margin-right: 12px; }
        .participant-name { color: #373737; font-weight: 500; }

        .chat-area { flex-grow: 1; padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; }
        .chat-message { max-width: 80%; padding: 8px 12px; border-radius: 12px; word-wrap: break-word; }
        .chat-message.sent { background-color: #7765DA; color: white; align-self: flex-end; border-bottom-right-radius: 2px; }
        .chat-message.received { background-color: #F0F0F0; color: #373737; align-self: flex-start; border-bottom-left-radius: 2px; }
        .chat-form { display: flex; padding: 8px; border-top: 1px solid #F0F0F0; }
        .chat-input { flex-grow: 1; border: none; padding: 8px; background-color: #F7F7F7; border-radius: 8px; margin-right: 8px; }
        .chat-input:focus { outline: none; ring: 2px; ring-color: #7765DA; }
        .send-button { background-color: #7765DA; color: white; border: none; border-radius: 8px; padding: 8px; }
        
        .kicked-view { text-align: center; padding: 2rem; }
      `}</style>

      <div className="page-container">
        {renderContent()}
      </div>
      
      {!isKicked && (
        <>
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
                                    <div key={index} className={`chat-message ${msg.sender === studentName ? 'sent' : 'received'}`}>
                                        <strong>{msg.sender === 'teacher' ? 'Teacher' : (msg.sender === studentName ? 'You' : msg.sender)}: </strong>{msg.text}
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
                            {participants.length > 0 ? (
                                participants.map(student => (
                                    <div key={student.id} className="participant-item">
                                        <div className="flex items-center">
                                            <div className="participant-avatar">{student.name.charAt(0)}</div>
                                            <span className="participant-name">{student.name}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-gray-500 py-4">No other participants yet.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
            )}
        </>
      )}
    </>
  );
};

export default StudentDashboard;


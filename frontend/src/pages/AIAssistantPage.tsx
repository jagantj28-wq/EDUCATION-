import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Bot,
  Send,
  FileText,
  BrainCircuit,
  Loader2,
  CheckCircle2,
  XCircle,
  Award,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { Note, Quiz, QuizQuestion } from '../types';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  basedOnNotes?: boolean;
  citedNoteTitle?: string;
  timestamp: string;
}

export default function AIAssistantPage() {
  const location = useLocation();
  const initialNoteId = (location.state as any)?.noteId || null;
  const initialQuizMode = (location.state as any)?.quizMode || false;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: "Hello! I am your LifeDesk Academic Assistant. You can ask me any coursework concept, or link one of your uploaded notes to get answers grounded directly in your class material.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  // Notes & grounding
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<number | ''>(initialNoteId || '');

  // Interactive Quiz Modal
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get<Note[]>('/notes').then((data) => setNotes(data)).catch(console.error);

    if (initialQuizMode) {
      setIsQuizModalOpen(true);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputText;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      id: String(Date.now()),
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInputText('');
    setLoading(true);

    try {
      const res = await api.post<any>('/ai/chat', {
        message: userMsg.text,
        note_id: selectedNoteId ? Number(selectedNoteId) : undefined,
      });

      const aiMsg: Message = {
        id: String(Date.now() + 1),
        sender: 'ai',
        text: res.answer,
        basedOnNotes: res.based_on_notes,
        citedNoteTitle: res.cited_note_title,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: String(Date.now() + 1),
        sender: 'ai',
        text: 'Sorry, I encountered an issue processing your question. Please verify your connection or try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = async () => {
    setGeneratingQuiz(true);
    try {
      const res = await api.post<Quiz>('/ai/generate-quiz', {
        note_id: selectedNoteId ? Number(selectedNoteId) : undefined,
        num_questions: 5,
        difficulty: 'medium',
      });
      setActiveQuiz(res);
      setCurrentQIndex(0);
      setUserAnswers({});
      setQuizSubmitted(false);
      setIsQuizModalOpen(true);
    } catch (err: any) {
      alert(err.message || 'Could not generate quiz');
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const calculateScore = () => {
    if (!activeQuiz) return 0;
    let score = 0;
    activeQuiz.questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correct_answer) {
        score += 1;
      }
    });
    return score;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      {/* Top Banner & Context selector */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-white">
              LifeDesk AI Tutor
            </h1>
            <p className="text-xs text-slate-500">
              Ask general academic questions or ground replies in your lecture notes
            </p>
          </div>
        </div>

        {/* Note Selector & Quiz Trigger */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" />
            <select
              value={selectedNoteId}
              onChange={(e) => setSelectedNoteId(e.target.value ? Number(e.target.value) : '')}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
            >
              <option value="">No Grounding (General Tutor)</option>
              {notes.map((n) => (
                <option key={n.id} value={n.id}>
                  📄 {n.title}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleStartQuiz}
            disabled={generatingQuiz}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-[0.99] disabled:opacity-60"
          >
            {generatingQuiz ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BrainCircuit className="w-3.5 h-3.5" />}
            <span>Generate Practice Quiz</span>
          </button>
        </div>
      </div>

      {/* Chat Messages Body */}
      <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm overflow-y-auto space-y-4 flex flex-col">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col max-w-2xl ${
              msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
            }`}
          >
            {/* Note badge if grounded */}
            {msg.basedOnNotes && (
              <div className="mb-1 inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-[10px] font-bold">
                <FileText className="w-3 h-3 text-blue-500" />
                <span>Grounded in Note: {msg.citedNoteTitle}</span>
              </div>
            )}

            <div
              className={`p-4 rounded-3xl text-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-500/10'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200/50 dark:border-slate-700/50'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.text}</div>
            </div>

            <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 p-4 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl max-w-xs text-xs font-semibold animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span>AI Tutor is formulating answer...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 flex-shrink-0 text-xs">
        <span className="text-slate-400 font-semibold flex-shrink-0">Suggestions:</span>
        <button
          onClick={() => handleSendMessage('What is deadlock in operating systems and how is it avoided?')}
          className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl whitespace-nowrap transition"
        >
          Explain Deadlock & Banker's Algorithm
        </button>
        <button
          onClick={() => handleSendMessage('Explain database normalization (1NF, 2NF, 3NF, BCNF) with an example.')}
          className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl whitespace-nowrap transition"
        >
          Database Normalization Overview
        </button>
        <button
          onClick={() => handleSendMessage('Compare TCP and UDP in computer networks.')}
          className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl whitespace-nowrap transition"
        >
          TCP vs UDP Comparison
        </button>
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="relative flex-shrink-0"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            selectedNoteId
              ? "Ask questions about the selected lecture note..."
              : "Ask any academic concept, formula, or exam question..."
          }
          className="w-full pl-5 pr-14 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || loading}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl transition shadow-md shadow-blue-500/20"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Interactive Quiz Taking Modal */}
      {isQuizModalOpen && activeQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {activeQuiz.title}
                </h3>
              </div>
              <button
                onClick={() => setIsQuizModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!quizSubmitted ? (
              <div className="flex-1 flex flex-col justify-between overflow-y-auto">
                <div>
                  {/* Progress Indicator */}
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-3">
                    <span>Question {currentQIndex + 1} of {activeQuiz.questions.length}</span>
                    <span>Answered: {Object.keys(userAnswers).length}/{activeQuiz.questions.length}</span>
                  </div>

                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mb-6 overflow-hidden">
                    <div
                      className="bg-purple-600 h-full transition-all duration-300 rounded-full"
                      style={{ width: `${((currentQIndex + 1) / activeQuiz.questions.length) * 100}%` }}
                    />
                  </div>

                  {/* Current Question */}
                  {activeQuiz.questions[currentQIndex] && (
                    <div className="space-y-4">
                      <p className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                        {activeQuiz.questions[currentQIndex].question}
                      </p>

                      <div className="space-y-2.5 pt-2">
                        {(['A', 'B', 'C', 'D'] as const).map((letter) => {
                          const optionKey = `option_${letter.toLowerCase()}` as keyof QuizQuestion;
                          const optionText = activeQuiz.questions[currentQIndex][optionKey] as string;
                          const isSelected = userAnswers[currentQIndex] === letter;

                          return (
                            <button
                              key={letter}
                              type="button"
                              onClick={() =>
                                setUserAnswers({ ...userAnswers, [currentQIndex]: letter })
                              }
                              className={`w-full p-3.5 rounded-2xl border text-left text-xs md:text-sm font-medium transition flex items-center gap-3 ${
                                isSelected
                                  ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-500 text-purple-900 dark:text-purple-200 ring-1 ring-purple-500'
                                  : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-800 dark:text-slate-200'
                              }`}
                            >
                              <span
                                className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                                  isSelected
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                }`}
                              >
                                {letter}
                              </span>
                              <span>{optionText}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Navigation */}
                <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
                  <button
                    onClick={() => setCurrentQIndex((prev) => Math.max(0, prev - 1))}
                    disabled={currentQIndex === 0}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold disabled:opacity-40"
                  >
                    Previous
                  </button>

                  {currentQIndex < activeQuiz.questions.length - 1 ? (
                    <button
                      onClick={() => setCurrentQIndex((prev) => prev + 1)}
                      className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-sm"
                    >
                      Next Question
                    </button>
                  ) : (
                    <button
                      onClick={() => setQuizSubmitted(true)}
                      disabled={Object.keys(userAnswers).length === 0}
                      className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20"
                    >
                      Submit Quiz
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Quiz Score & Review View */
              <div className="space-y-6 overflow-y-auto">
                <div className="text-center p-6 bg-purple-50 dark:bg-purple-950/40 rounded-3xl border border-purple-200 dark:border-purple-900/50">
                  <Award className="w-12 h-12 text-purple-600 mx-auto mb-2" />
                  <h4 className="text-2xl font-black text-purple-950 dark:text-purple-100">
                    Your Score: {calculateScore()} / {activeQuiz.questions.length}
                  </h4>
                  <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                    {calculateScore() >= activeQuiz.questions.length * 0.75
                      ? 'Outstanding grasp of the concepts! Ready for exams.'
                      : 'Good effort! Review the explanations below to master the material.'}
                  </p>
                </div>

                <div className="space-y-4">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Question-by-Question Review
                  </h5>
                  {activeQuiz.questions.map((q, idx) => {
                    const chosen = userAnswers[idx];
                    const isCorrect = chosen === q.correct_answer;

                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-2xl border text-xs leading-relaxed ${
                          isCorrect
                            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
                            : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40'
                        }`}
                      >
                        <div className="flex items-start gap-2 mb-1.5 font-bold text-slate-900 dark:text-white">
                          {isCorrect ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                          )}
                          <span>
                            Q{idx + 1}: {q.question}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-6">
                          Your answer:{' '}
                          <span className="font-bold">
                            {chosen || 'Unanswered'}
                          </span>{' '}
                          | Correct answer:{' '}
                          <span className="font-bold text-emerald-600">
                            {q.correct_answer}
                          </span>
                        </p>

                        <div className="mt-2 p-2.5 bg-white/70 dark:bg-slate-800/70 rounded-xl text-[11px] text-slate-600 dark:text-slate-300 pl-3 border border-slate-100 dark:border-slate-700">
                          <span className="font-bold">Explanation: </span>
                          {q.explanation}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => setIsQuizModalOpen(false)}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-sm"
                  >
                    Done Reviewing
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

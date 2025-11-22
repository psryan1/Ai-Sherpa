import React, { useState, useEffect, useRef } from 'react';
import { ViewState, Lesson, QuizQuestion, ChatMessage } from './types';
import * as GeminiService from './services/gemini';
import LiveSession from './components/LiveSession';

// --- Sherpa Data ---

const SHERPA_TIPS = [
  "The summit isn't reached in a single leap. Start with simple prompts.",
  "NotebookLM is your base camp library. Keep your sales assets organized there.",
  "Don't fear the hallucination; verify your route like a good climber.",
  "Use Gemini to roleplay your toughest customer objections.",
  "Your AI is a climbing partner, not a replacement. You still lead the way.",
  "Context is your oxygen. Give the AI enough background to breathe.",
  "If you slip, try a different prompt. Rephrase and climb on.",
  "Use 'Act as...' to set the persona. It's like choosing the right gear.",
  "NotebookLM can summarize a 50-page whitepaper faster than you can tie your boots.",
  "Draft emails with Gemini, but polish them with your own voice.",
  "Upload your competitor's PDF to NotebookLM to find their weak spots.",
  "Gemini loves examples. Show it what 'good' looks like.",
  "Don't climb alone. Share your best prompts with your team.",
  "Iterate. The first draft is just the trailhead.",
  "Be specific about tone. 'Professional but warm' is a good hold.",
  "Use the 1.5 Pro model when you need deep reasoning for complex deals.",
  "Flash models are for speed. Use them for quick brainstorming.",
  "Ask Gemini to critique your pitch deck. It's a brutal but honest belayer.",
  "Summarize meeting transcripts to catch action items you missed.",
  "Keep climbing. AI is evolving, and so are you."
];

const INITIAL_LESSONS: Lesson[] = [
  {
    id: 'l1',
    title: 'Base Camp: The Setup',
    altitude: 5364,
    description: 'Understanding your new equipment.',
    content: `# Welcome to Base Camp\n\nAs a seller, time is your most valuable asset. **Gemini** isn't just a chatbot; it's a research assistant, a copywriter, and a strategist.\n\n**Key Concept:** Generative AI predicts the next likely word based on patterns. It doesn't "know" things, it understands patterns. This is why *how* you ask (the prompt) matters more than anything.\n\nToday we check your gear: The Interface.`,
    quiz: [
      {
        question: "Why is Gemini useful for a salesperson?",
        options: ["It can replace the CRM automatically", "It acts as a versatile assistant for research and drafting", "It calls customers for you"],
        correctIndex: 1,
        explanation: "Gemini accelerates tasks like research, drafting emails, and strategizing, acting as a force multiplier."
      }
    ],
    xpReward: 100,
    completed: false,
    locked: false
  },
  {
    id: 'l2',
    title: 'Camp I: The Perfect Prompt',
    altitude: 6065,
    description: 'Drafting outreach that connects.',
    content: `# The Art of Packing (Prompting)\n\nIn sales, generic outreach is fatal. \n\n**The Formula:** Persona + Context + Task + Format.\n\n*Bad:* "Write an email to a prospect."\n*Good:* "Act as a senior B2B account executive. I am selling a new cybersecurity tool to a skeptical CTO. Write a short, punchy cold email focusing on the risk of ransomware. Keep it under 100 words."`,
    quiz: [
      {
        question: "Which element is missing from this prompt: 'Write a poem about sales.'?",
        options: ["Context and Persona", "Spelling", "Punctuation"],
        correctIndex: 0,
        explanation: "It lacks the 'Who' (Persona) and the 'Why' (Context), leading to a generic result."
      }
    ],
    practice: {
      scenario: "You are selling high-end coffee machines to corporate offices.",
      task: "Open Gemini in a new tab. Ask it to write 3 subject lines for a cold email to an Office Manager that mentions 'productivity' and 'taste'. Paste the best one here.",
      evaluationPrompt: "Evaluate this subject line for a cold email selling coffee machines. Is it catchy? Does it mention productivity and taste? Give it a score out of 10."
    },
    xpReward: 200,
    completed: false,
    locked: true
  },
  {
    id: 'l3',
    title: 'Camp II: NotebookLM Intel',
    altitude: 6400,
    description: 'Mastering your research documents.',
    content: `# NotebookLM: Your Research Tent\n\nImagine feeding a 100-page annual report from a prospect into a machine and asking, "What are their top 3 pain points this year?"\n\n**NotebookLM** allows you to upload specific sources (PDFs, Docs, URLs). It *grounds* its answers in those sources. No hallucinations. Pure intel.\n\nUse this to prep for discovery calls in minutes, not hours.`,
    quiz: [
      {
        question: "Why choose NotebookLM over standard Gemini for account research?",
        options: ["It is faster at math", "It grounds answers in your uploaded documents", "It generates images"],
        correctIndex: 1,
        explanation: "NotebookLM's superpower is 'Grounding'—sticking strictly to the facts in the documents you provide."
      }
    ],
    practice: {
      scenario: "You have a PDF of a prospect's Annual Report.",
      task: "In real life, you would upload the PDF to NotebookLM and ask 'What are the strategic risks?'. For this practice, pretend you did. Draft a question you would ask the CEO based on 'Strategic Risk' findings.",
      evaluationPrompt: "Evaluate this strategic sales question. Is it open-ended? Does it sound insightful? Does it relate to business risk?"
    },
    xpReward: 300,
    completed: false,
    locked: true
  },
  {
    id: 'l4',
    title: 'Camp III: Objection Handling',
    altitude: 7200,
    description: 'Simulating the climb before you go.',
    content: `# The Simulator\n\nYou can use Gemini to roleplay. Before you get on a call with a tough negotiator, practice with AI.\n\n**Prompt Strategy:** "I want to practice a negotiation. You play the role of a budget-conscious CFO. I will pitch you my solution, and you should push back on price. Let's go step by step."\n\nThis creates a safe space to fail and learn.`,
    quiz: [
      {
        question: "What is the best way to start a roleplay session?",
        options: ["Just start typing pitch", "Define the AI's role (e.g., CFO) and the goal", "Upload a photo"],
        correctIndex: 1,
        explanation: "Setting the stage defines how the AI should behave, making the simulation realistic."
      }
    ],
    xpReward: 400,
    completed: false,
    locked: true
  },
  {
    id: 'l5',
    title: 'The Summit: Integration',
    altitude: 8848,
    description: 'Putting it all together.',
    content: `# The View from the Top\n\nYou now have the tools:\n1. **Gemini** for drafting and brainstorming.\n2. **NotebookLM** for deep research and grounding.\n3. **Roleplay** for practice.\n\nThe summit isn't the end. It's about integrating these into your daily workflow. Every time you feel stuck or slow, ask: "Can my Sherpa help with this?"`,
    quiz: [
      {
        question: "When should you use AI in your sales process?",
        options: ["Only for writing poems", "Through the entire cycle: Research, Drafting, Practice", "Never"],
        correctIndex: 1,
        explanation: "AI is a full-cycle companion, from initial research to final negotiation prep."
      }
    ],
    xpReward: 1000,
    completed: false,
    locked: true
  }
];

// --- Main App Component ---

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.HOME);
  const [xp, setXp] = useState(0);
  const [lessons, setLessons] = useState<Lesson[]>(INITIAL_LESSONS);
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);
  const [dailyTip, setDailyTip] = useState("");

  useEffect(() => {
    setDailyTip(SHERPA_TIPS[Math.floor(Math.random() * SHERPA_TIPS.length)]);
  }, []);

  // Navigation Handler
  const navigateTo = (v: ViewState) => setView(v);

  const completeLesson = (id: string, reward: number) => {
    setXp(prev => prev + reward);
    setLessons(prev => prev.map((l, idx) => {
      if (l.id === id) {
        // Unlock next lesson
        if (idx + 1 < prev.length) {
             prev[idx+1].locked = false;
        }
        return { ...l, completed: true };
      }
      return l;
    }));
    setView(ViewState.HOME);
  };

  const currentAltitude = lessons.filter(l => l.completed).reduce((max, l) => Math.max(max, l.altitude), 5300);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-sky-500/30 flex flex-col">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 h-16 flex items-center justify-between px-4 md:px-8 shadow-lg shadow-sky-900/10">
        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigateTo(ViewState.HOME)}>
          <div className="p-2 bg-sky-900/50 rounded-lg group-hover:bg-sky-800 transition-colors">
             <span className="text-xl">🏔️</span>
          </div>
          <div>
             <h1 className="text-lg font-bold bg-gradient-to-r from-sky-400 to-indigo-200 bg-clip-text text-transparent leading-tight">AI Sherpa</h1>
             <p className="text-[10px] text-sky-500/80 uppercase tracking-wider font-bold">Sales Edition</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest">Current Alt.</span>
              <span className="font-mono font-bold text-sky-300">{currentAltitude}m</span>
           </div>
           <div className="h-8 w-[1px] bg-slate-700 hidden md:block"></div>
           <div className="flex items-center gap-2 bg-slate-800 px-4 py-1.5 rounded-full border border-slate-700 shadow-inner">
            <span className="text-yellow-400 text-sm">⚡</span>
            <span className="font-mono font-bold text-sm">{xp} XP</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pt-20 pb-24 px-4 max-w-4xl mx-auto w-full">
        {view === ViewState.HOME && (
          <HomeView 
            lessons={lessons} 
            tip={dailyTip} 
            currentAltitude={currentAltitude}
            onStartLesson={(id) => { setCurrentLessonId(id); navigateTo(ViewState.LESSON); }} 
          />
        )}
        {view === ViewState.LESSON && currentLessonId && (
          <LessonView lesson={lessons.find(l => l.id === currentLessonId)!} onComplete={completeLesson} onExit={() => setView(ViewState.HOME)} />
        )}
        {view === ViewState.CHAT && <ChatView />}
        {view === ViewState.IMAGE_GEN && <ImageGenView />}
        {view === ViewState.VOICE_SESSION && <div className="h-full"><LiveSession onClose={() => setView(ViewState.HOME)} /></div>}
      </main>

      {/* Bottom Navigation */}
      {view !== ViewState.VOICE_SESSION && view !== ViewState.LESSON && (
        <nav className="fixed bottom-0 w-full bg-slate-900/95 backdrop-blur border-t border-slate-800 pb-safe z-40">
          <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
            <NavBtn icon="🏔️" label="Climb" active={view === ViewState.HOME} onClick={() => navigateTo(ViewState.HOME)} />
            <NavBtn icon="💬" label="Sherpa" active={view === ViewState.CHAT} onClick={() => navigateTo(ViewState.CHAT)} />
            <NavBtn icon="🎨" label="Visuals" active={view === ViewState.IMAGE_GEN} onClick={() => navigateTo(ViewState.IMAGE_GEN)} />
            <NavBtn icon="🎙️" label="Practice" active={view === ViewState.VOICE_SESSION} onClick={() => navigateTo(ViewState.VOICE_SESSION)} />
          </div>
        </nav>
      )}
    </div>
  );
};

// --- Sub-Components ---

const NavBtn = ({ icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center w-full h-full transition-all active:scale-95 ${active ? 'text-sky-400' : 'text-slate-500 hover:text-slate-300'}`}>
    <span className={`text-xl mb-1 transition-transform ${active ? '-translate-y-1' : ''}`}>{icon}</span>
    <span className="text-[10px] font-bold tracking-wide">{label}</span>
  </button>
);

// 1. Home / Mountain Path View
const HomeView = ({ lessons, tip, currentAltitude, onStartLesson }: { lessons: Lesson[], tip: string, currentAltitude: number, onStartLesson: (id: string) => void }) => {
  return (
    <div className="flex flex-col items-center relative">
      
      {/* Daily Sherpa Tip */}
      <div className="w-full mb-10 bg-gradient-to-br from-slate-800 to-slate-900 border border-sky-500/20 p-4 rounded-2xl shadow-lg relative overflow-hidden">
         <div className="absolute top-0 right-0 w-20 h-20 bg-sky-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
         <div className="flex gap-3 items-start relative z-10">
             <span className="text-3xl bg-slate-800 rounded-full p-1">🧘</span>
             <div>
                 <h3 className="text-xs font-bold text-sky-400 uppercase tracking-widest mb-1">Sherpa Wisdom</h3>
                 <p className="text-sm text-slate-300 italic">"{tip}"</p>
             </div>
         </div>
      </div>

      {/* Mountain Visualization */}
      <div className="relative w-full max-w-md pb-12">
         {/* Altitude Marker Line */}
         <div className="absolute right-0 top-0 bottom-0 w-12 border-l border-dashed border-slate-800/50 flex flex-col justify-between py-8 text-[10px] text-slate-600 font-mono text-right pr-2 pointer-events-none select-none">
             <span>8848m</span>
             <span>8000m</span>
             <span>7000m</span>
             <span>6000m</span>
             <span>5364m</span>
         </div>

         {/* Path Line */}
         <div className="absolute left-1/2 top-8 bottom-8 w-1 bg-gradient-to-b from-sky-400 via-sky-700 to-slate-800 -translate-x-1/2 rounded-full opacity-50"></div>

         <div className="flex flex-col-reverse gap-16 relative">
            {lessons.map((lesson, idx) => {
                const isLeft = idx % 2 === 0;
                return (
                  <div key={lesson.id} className={`flex items-center ${isLeft ? 'flex-row' : 'flex-row-reverse'} relative`}>
                    
                    {/* Connector Dot on Path */}
                    <div className={`absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 ${lesson.completed ? 'bg-sky-500 border-sky-300' : lesson.locked ? 'bg-slate-900 border-slate-700' : 'bg-white border-sky-400 animate-pulse'} z-0`}></div>

                    {/* Card */}
                    <div className={`w-[45%] ${isLeft ? 'text-right pr-8' : 'text-left pl-8'} relative z-10`}>
                        <button
                          onClick={() => !lesson.locked && onStartLesson(lesson.id)}
                          disabled={lesson.locked}
                          className={`group w-full p-4 rounded-xl border transition-all duration-300 hover:-translate-y-1 
                            ${lesson.completed ? 'bg-sky-900/20 border-sky-500/30 hover:bg-sky-900/40 hover:border-sky-400' : 
                              lesson.locked ? 'bg-slate-800/50 border-slate-800 opacity-60' : 
                              'bg-slate-800 border-white/20 ring-2 ring-sky-400/30 shadow-[0_0_30px_rgba(14,165,233,0.2)]'}
                          `}
                        >
                            <div className={`flex flex-col ${isLeft ? 'items-end' : 'items-start'}`}>
                                <span className="text-xs font-bold text-sky-500 mb-1">{lesson.altitude}m</span>
                                <h3 className={`font-bold leading-tight mb-1 ${lesson.locked ? 'text-slate-400' : 'text-white'}`}>{lesson.title}</h3>
                                <p className="text-[10px] text-slate-400 line-clamp-2">{lesson.description}</p>
                                
                                <div className="mt-3 flex items-center gap-2">
                                    {lesson.completed ? (
                                        <span className="text-[10px] bg-green-900/40 text-green-400 px-2 py-0.5 rounded font-bold">COMPLETED</span>
                                    ) : !lesson.locked ? (
                                        <span className="text-[10px] bg-sky-500 text-white px-2 py-0.5 rounded font-bold group-hover:bg-sky-400">START CLIMB</span>
                                    ) : (
                                        <span className="text-xs">🔒</span>
                                    )}
                                </div>
                            </div>
                        </button>
                    </div>
                    <div className="w-[45%]"></div> {/* Spacer */}
                  </div>
                );
            })}
         </div>
      </div>
    </div>
  );
};

// 2. Lesson View
const LessonView = ({ lesson, onComplete, onExit }: { lesson: Lesson, onComplete: (id: string, xp: number) => void, onExit: () => void }) => {
  const [step, setStep] = useState<'content' | 'quiz' | 'practice' | 'success'>('content');
  const [quizIdx, setQuizIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  
  // Practice State
  const [practiceInput, setPracticeInput] = useState("");
  const [practiceFeedback, setPracticeFeedback] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Text-to-Speech Handler
  const playAudio = async () => {
    const textToRead = lesson.content.split('\n\n')[1] || "Welcome to the lesson.";
    const buffer = await GeminiService.generateSpeech(textToRead);
    if (buffer) {
        const ctx = new AudioContext();
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start();
    }
  };

  const handleQuizSubmit = () => {
    const q = lesson.quiz[quizIdx];
    if (selectedOption === q.correctIndex) {
        setFeedback("Correct! " + q.explanation);
        setTimeout(() => {
            if (quizIdx + 1 < lesson.quiz.length) {
                setQuizIdx(p => p + 1);
                setSelectedOption(null);
                setFeedback(null);
            } else {
                // Check if practice is needed
                setStep(lesson.practice ? 'practice' : 'success');
            }
        }, 2000);
    } else {
        setFeedback("Not quite. Try again!");
    }
  };

  const handlePracticeSubmit = async () => {
      if(!lesson.practice || !practiceInput) return;
      setIsEvaluating(true);
      try {
          const result = await GeminiService.evaluatePracticeSubmission(lesson.practice.scenario, lesson.practice.task, practiceInput);
          setPracticeFeedback(result);
      } catch(e) {
          setPracticeFeedback("Evaluation failed. The clouds are too thick.");
      } finally {
          setIsEvaluating(false);
      }
  };

  if (step === 'success') {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
            <div className="w-24 h-24 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-orange-500/20 animate-bounce">
                <span className="text-4xl">🚩</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Altitude Reached!</h2>
            <p className="text-slate-400 mb-8 text-lg">You've mastered {lesson.title}.</p>
            <div className="text-4xl font-mono text-yellow-400 mb-8 font-bold drop-shadow-md">+{lesson.xpReward} XP</div>
            <button onClick={() => onComplete(lesson.id, lesson.xpReward)} className="bg-sky-500 text-white px-10 py-4 rounded-full font-bold hover:bg-sky-400 transition-all transform hover:scale-105 shadow-lg shadow-sky-500/30">
                Continue Expedition
            </button>
        </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-2xl p-6 min-h-[80vh] flex flex-col relative border border-slate-700 shadow-2xl overflow-hidden">
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-slate-700">
          <div 
            className="h-full bg-sky-500 transition-all duration-500" 
            style={{ width: step === 'content' ? '25%' : step === 'quiz' ? '50%' : step === 'practice' ? '75%' : '100%' }}
          ></div>
      </div>

      <button onClick={onExit} className="absolute top-4 right-4 text-slate-400 hover:text-white z-10 p-2">✕</button>
      
      {step === 'content' ? (
        <div className="flex-1 flex flex-col animate-fade-in">
            <div className="flex justify-between items-start mb-6 mt-4">
                 <div>
                    <span className="text-xs text-sky-500 font-bold uppercase tracking-widest">Altitude {lesson.altitude}m</span>
                    <h2 className="text-2xl font-bold text-white">{lesson.title}</h2>
                 </div>
                 <button onClick={playAudio} className="text-sky-400 hover:text-sky-300 p-2 rounded-full bg-slate-700/50 hover:bg-slate-700 transition-colors" title="Read aloud">
                    🔊
                 </button>
            </div>
            <div className="prose prose-invert prose-sky max-w-none flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {lesson.content.split('\n').map((line, i) => {
                    if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold mb-4 text-sky-100">{line.replace('# ', '')}</h1>;
                    if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold mb-3 text-sky-200">{line.replace('## ', '')}</h2>;
                    if (line === '') return <br key={i}/>;
                    return <p key={i} className="mb-4 text-slate-300 leading-relaxed">{line.replace(/\*\*(.*?)\*\*/g, (match, p1) => `<b>${p1}</b>`).split(/<b>(.*?)<\/b>/).map((part, index) => index % 2 === 1 ? <strong key={index} className="text-sky-300 font-bold">{part}</strong> : part)}</p>;
                })}
            </div>
            <button onClick={() => setStep('quiz')} className="mt-6 w-full bg-sky-600 hover:bg-sky-500 text-white py-4 rounded-xl font-bold transition-all flex justify-center items-center gap-2">
                Start Quiz <span className="text-xl">→</span>
            </button>
        </div>
      ) : step === 'quiz' ? (
        <div className="flex-1 flex flex-col justify-center animate-fade-in">
             <div className="mb-8">
                <span className="text-xs font-bold text-sky-500 tracking-widest uppercase">Knowledge Check</span>
                <h3 className="text-xl font-bold text-white mt-2">{lesson.quiz[quizIdx].question}</h3>
             </div>
             
             <div className="space-y-3">
                 {lesson.quiz[quizIdx].options.map((opt, i) => (
                     <button 
                        key={i}
                        onClick={() => !feedback && setSelectedOption(i)}
                        className={`w-full p-4 rounded-xl text-left transition-all border flex justify-between items-center ${
                            selectedOption === i 
                            ? 'bg-sky-900/50 border-sky-500 text-sky-200' 
                            : 'bg-slate-700/50 border-slate-600 hover:bg-slate-700 text-slate-300'
                        } ${feedback ? 'cursor-default' : ''}`}
                     >
                        {opt}
                        {selectedOption === i && <span className="text-sky-400">●</span>}
                     </button>
                 ))}
             </div>

             {feedback && (
                 <div className={`mt-6 p-4 rounded-lg text-center font-bold border ${feedback.startsWith('Correct') ? 'bg-green-900/30 text-green-400 border-green-800' : 'bg-red-900/30 text-red-400 border-red-800'} animate-fade-in`}>
                     {feedback}
                 </div>
             )}

             {!feedback && (
                <button 
                    onClick={handleQuizSubmit}
                    disabled={selectedOption === null} 
                    className={`mt-8 w-full py-3 rounded-xl font-bold transition-all ${selectedOption === null ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-sky-500 text-white hover:bg-sky-400 shadow-lg shadow-sky-500/20'}`}
                >
                    Check Answer
                </button>
             )}
        </div>
      ) : (
        // PRACTICE STEP
        <div className="flex-1 flex flex-col animate-fade-in overflow-y-auto">
            <div className="mb-6">
                 <span className="text-xs font-bold text-sky-500 tracking-widest uppercase">Field Challenge</span>
                 <h3 className="text-xl font-bold text-white mt-2 mb-1">Practice with AI</h3>
                 <p className="text-sm text-slate-400">Complete this task in another tab, then paste your result below.</p>
            </div>

            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 mb-4">
                <div className="mb-3">
                    <span className="text-xs text-slate-500 font-bold uppercase">Scenario</span>
                    <p className="text-slate-300 text-sm">{lesson.practice?.scenario}</p>
                </div>
                <div>
                    <span className="text-xs text-slate-500 font-bold uppercase">Task</span>
                    <p className="text-sky-200 text-sm font-semibold">{lesson.practice?.task}</p>
                </div>
            </div>

            {!practiceFeedback ? (
                <>
                    <textarea 
                        value={practiceInput}
                        onChange={(e) => setPracticeInput(e.target.value)}
                        placeholder="Paste the output you got from Gemini here..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 focus:ring-2 focus:ring-sky-500 outline-none h-32 resize-none mb-4"
                    />
                    <button 
                        onClick={handlePracticeSubmit}
                        disabled={!practiceInput || isEvaluating}
                        className={`w-full py-3 rounded-xl font-bold transition-all ${!practiceInput || isEvaluating ? 'bg-slate-700 text-slate-500' : 'bg-sky-500 text-white hover:bg-sky-400'}`}
                    >
                        {isEvaluating ? 'Sherpa is Analyzing...' : 'Evaluate My Work'}
                    </button>
                </>
            ) : (
                <div className="flex-1 flex flex-col">
                    <div className="bg-indigo-900/30 border border-indigo-500/30 p-4 rounded-xl mb-4">
                        <h4 className="font-bold text-indigo-300 mb-2 flex items-center gap-2">
                             <span>🦾</span> AI Coach Feedback
                        </h4>
                        <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{practiceFeedback}</p>
                    </div>
                    <button 
                        onClick={() => setStep('success')}
                        className="mt-auto w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-green-900/20"
                    >
                        Complete Lesson
                    </button>
                </div>
            )}
        </div>
      )}
    </div>
  );
};

// 3. Chat View
const ChatView = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'model', text: "Namaste! I am Tenzing. I can help you navigate the treacherous slopes of AI sales tools. What confuses you most?", timestamp: new Date() }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;
        
        const userMsg: ChatMessage = { role: 'user', text: input, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            // Prepare history for API
            const history = messages.map(m => ({
                role: m.role,
                parts: [{ text: m.text }]
            }));

            // Use the service
            const responseText = await GeminiService.sendChatMessage(history, userMsg.text);
            
            setMessages(prev => [...prev, { role: 'model', text: responseText, timestamp: new Date() }]);
        } catch (e) {
            console.error(e);
            setMessages(prev => [...prev, { role: 'model', text: "The wind is too loud... I couldn't hear you. (API Error)", timestamp: new Date() }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)]">
            <div className="flex-1 overflow-y-auto mb-4 space-y-4 scrollbar-hide px-2" ref={scrollRef}>
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                        <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${m.role === 'user' ? 'bg-sky-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'}`}>
                            {m.role === 'model' && <div className="text-xs font-bold text-sky-400 mb-1 flex items-center gap-1"><span>🏔️</span> Sherpa Tenzing</div>}
                            <p className="whitespace-pre-wrap text-sm md:text-base leading-relaxed">{m.text}</p>
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 rounded-tl-none flex gap-2">
                             <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce"></div>
                             <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce delay-100"></div>
                             <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce delay-200"></div>
                        </div>
                    </div>
                )}
            </div>
            <div className="flex gap-2">
                <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask for guidance..."
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500 text-white placeholder-slate-500 shadow-lg"
                />
                <button onClick={handleSend} disabled={loading} className="bg-sky-500 hover:bg-sky-400 text-white p-3 rounded-xl disabled:opacity-50 transition-colors shadow-lg shadow-sky-500/20">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

// 4. Image Gen View
const ImageGenView = () => {
    const [prompt, setPrompt] = useState("A futuristic sherpa robot climbing Mount Everest, cyberpunk style, digital art");
    const [aspectRatio, setAspectRatio] = useState("1:1");
    const [size, setSize] = useState("1K");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            const base64 = await GeminiService.generateSherpaImage(prompt, aspectRatio, size);
            if (base64) {
                setResult(base64);
            } else {
                setError("No image generated.");
            }
        } catch (e: any) {
            setError(e.message || "Failed to generate.");
        } finally {
            setLoading(false);
        }
    };

    // Helper for quick prompts via Fast Flash Lite
    const surpriseMe = async () => {
        const p = await GeminiService.generateFastResponse("Write a creative, short image generation prompt for a magical mountain landscape.");
        setPrompt(p.trim());
    };

    return (
        <div className="flex flex-col h-full overflow-y-auto pb-20">
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 mb-6 shadow-xl">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                   <span>🎨</span> Visualizing the Summit
                </h2>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1">PROMPT</label>
                        <textarea 
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-sky-500 outline-none h-24 resize-none"
                        />
                         <button onClick={surpriseMe} className="text-xs text-sky-400 mt-1 hover:underline font-bold">✨ Surprise Me (Flash Lite)</button>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1">
                             <label className="block text-xs font-bold text-slate-400 mb-1">ASPECT RATIO</label>
                             <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-sm outline-none">
                                 {['1:1', '3:4', '4:3', '9:16', '16:9'].map(r => <option key={r} value={r}>{r}</option>)}
                             </select>
                        </div>
                        <div className="flex-1">
                             <label className="block text-xs font-bold text-slate-400 mb-1">SIZE (Pro)</label>
                             <select value={size} onChange={(e) => setSize(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-sm outline-none">
                                 {['1K', '2K', '4K'].map(s => <option key={s} value={s}>{s}</option>)}
                             </select>
                        </div>
                    </div>

                    <button 
                        onClick={handleGenerate} 
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-sky-900/50 transition-all disabled:opacity-50 transform active:scale-95"
                    >
                        {loading ? 'Generating...' : 'Generate Image'}
                    </button>
                    
                    {loading && <p className="text-center text-xs text-slate-500 animate-pulse">Using gemini-3-pro-image-preview...</p>}
                    {error && <p className="text-center text-xs text-red-400 bg-red-900/20 p-2 rounded">{error}</p>}
                </div>
            </div>

            {result && (
                <div className="bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800 animate-fade-in">
                    <img src={result} alt="Generated" className="w-full h-auto object-contain" />
                    <div className="p-4 bg-slate-800 flex justify-between items-center">
                        <span className="text-xs text-slate-400">Generated with Gemini 3 Pro</span>
                        <a href={result} download="sherpa_creation.png" className="text-sky-400 text-sm font-bold hover:text-white transition-colors">Download</a>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Play, 
  Music, 
  Mic2, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  Settings2,
  Trophy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
const DEFAULT_QUESTIONS: Question[] = [
  {
    "id": "q1",
    "question": "Câu 1: Giai điệu hoài niệm này gợi cho bạn nhớ đến bài hát nào?",
    "answer": "Dòng sông lời thề",
    "quizUrl": "https://www.youtube.com/watch?v=Jl1KstFkxA0",
    "quizId": "Jl1KstFkxA0",
    "singUrl": "https://www.youtube.com/watch?v=Jl1KstFkxA0",
    "startTime": "62"
  },
  {
    "id": "q2",
    "question": "Câu 2: Một bài hát rất ý nghĩa. Tên của nó là gì?",
    "answer": "Tái sinh",
    "quizUrl": "https://www.youtube.com/watch?v=EqKUpelTb6A",
    "quizId": "EqKUpelTb6A",
    "singUrl": "https://www.youtube.com/watch?v=EqKUpelTb6A",
    "startTime": "75"
  },
  {
    "id": "q3",
    "question": "Câu 3: Bản hit này chắc chắn bạn đã nghe qua. Tên bài hát là gì?",
    "answer": "Hồng nhan",
    "quizUrl": "https://www.youtube.com/watch?v=j8U06veqxdU",
    "quizId": "j8U06veqxdU",
    "singUrl": "https://www.youtube.com/watch?v=j8U06veqxdU",
    "startTime": "68"
  },
  {
    "id": "q4",
    "question": "Câu 4: Rock Việt đầy năng lượng! Bạn có đoán được tên bài không?",
    "answer": "Tìm lại",
    "quizUrl": "https://www.youtube.com/watch?v=--BMQG-IPnQ",
    "quizId": "--BMQG-IPnQ",
    "singUrl": "https://www.youtube.com/watch?v=--BMQG-IPnQ",
    "startTime": "81"
  },
  {
    "id": "q5",
    "question": "Câu 5: Một giai điệu nhẹ nhàng và sâu lắng. Đây là bài gì?",
    "answer": "Để em rời xa",
    "quizUrl": "https://www.youtube.com/watch?v=oI9gVALDkHc",
    "quizId": "oI9gVALDkHc",
    "singUrl": "https://www.youtube.com/watch?v=oI9gVALDkHc",
    "startTime": "70"
  },
  {
    "id": "q6",
    "question": "Câu 6: Bài hát mang tính biểu tượng của sự đoàn kết. Tên bài hát là?",
    "answer": "Nối vòng tay lớn",
    "quizUrl": "https://www.youtube.com/watch?v=n33ozzXdSj0",
    "quizId": "n33ozzXdSj0",
    "singUrl": "https://www.youtube.com/watch?v=n33ozzXdSj0",
    "startTime": "65"
  }
];

interface Question {
  id: string;
  question: string;
  answer: string;
  quizUrl: string;
  quizId: string;
  singUrl: string;
  startTime: string;
}

// Persistent YouTube Player Component to prevent React re-render issues
const YouTubePlayer = React.memo(({ videoId, startTime, onStateChange }: { videoId: string, startTime: string, onStateChange: (state: number) => void }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const playerRef = React.useRef<any>(null);

  useEffect(() => {
    let mounted = true;

    const init = () => {
      if (!mounted) return;
      if (!(window as any).YT || !(window as any).YT.Player) {
        setTimeout(init, 100);
        return;
      }

      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch (e) {}
      }

      playerRef.current = new (window as any).YT.Player(containerRef.current, {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          start: parseInt(startTime),
          enablejsapi: 1,
          origin: window.location.origin
        },
        events: {
          onReady: (event: any) => {
            if (mounted) {
              playerRef.current = event.target;
              (window as any)._activePlayer = event.target;
            }
          },
          onStateChange: (event: any) => {
            if (mounted) onStateChange(event.data);
          }
        }
      });
    };

    init();

    return () => {
      mounted = false;
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch (e) {}
      }
    };
  }, [videoId, startTime]);

  // Expose play/pause methods via window or a shared ref if needed, 
  // but for now we'll handle clicks on the parent.
  // Actually, let's expose the player to a global ref for the parent to control.
  useEffect(() => {
    (window as any)._activePlayer = playerRef.current;
  }, [playerRef.current]);

  return <div ref={containerRef} className="w-full h-full" />;
});

export default function App() {
  const [screen, setScreen] = useState<'setup' | 'game'>('setup');
  const [questions, setQuestions] = useState<Question[]>(() => {
    try {
      const saved = localStorage.getItem('guess_song_questions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Error loading saved questions:", e);
    }
    // Fallback to default questions
    return DEFAULT_QUESTIONS;
  });

  useEffect(() => {
    localStorage.setItem('guess_song_questions', JSON.stringify(questions));
  }, [questions]);

  const [activeIdx, setActiveIdx] = useState(0);
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
  const [showAnswer, setShowAnswer] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    quizUrl: '',
    singUrl: ''
  });

  const [showListAnswers, setShowListAnswers] = useState(false);

  const getYouTubeParams = (url: string) => {
    // Extract ID (handles watch?v=, youtu.be/, embed/, etc)
    const idRegExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(idRegExp);
    const id = (match && match[2].length === 11) ? match[2] : null;
    
    // Extract start time (handles t=27, start=27, t=27s, etc.)
    const timeMatch = url.match(/[?&](t|start)=([0-9]+)/);
    const startTime = timeMatch ? parseInt(timeMatch[2]) : 0;
    
    return { id, startTime: startTime.toString() };
  };

  const handleAddQuestion = () => {
    if (questions.length >= 10) return;
    if (!formData.question || !formData.answer || !formData.quizUrl) return;

    const { id: quizId, startTime } = getYouTubeParams(formData.quizUrl);
    if (!quizId) {
      alert("Link nhạc đố không hợp lệ!");
      return;
    }

    const newQuestion: Question = {
      id: Math.random().toString(36).substr(2, 9),
      question: formData.question,
      answer: formData.answer,
      quizUrl: formData.quizUrl,
      quizId: quizId,
      singUrl: formData.singUrl,
      startTime: startTime || (Math.floor(Math.random() * 41) + 60).toString() // Random 60-100 if none
    };

    setQuestions([...questions, newQuestion]);
    setFormData({ question: '', answer: '', quizUrl: '', singUrl: '' });
  };

  const handleDelete = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const startPlaying = () => {
    if (questions.length > 0) {
      setScreen('game');
      setActiveIdx(0);
      setDoneIds(new Set());
      setShowAnswer(false);
    }
  };


  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlayback = () => {
    const player = (window as any)._activePlayer;
    if (!player || typeof player.getPlayerState !== 'function') {
      console.warn('Player not ready');
      return;
    }
    
    const state = player.getPlayerState();
    if (state === (window as any).YT.PlayerState.PLAYING) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  };

  const handlePlayerStateChange = (state: number) => {
    if (state === (window as any).YT.PlayerState.PLAYING) setIsPlaying(true);
    else setIsPlaying(false);
  };

  const handleScreenChange = (idx: number) => {
    setActiveIdx(idx);
    setShowAnswer(false);
    setIsPlaying(false);
  };

  const currentQuestion = questions[activeIdx];

  const toggleDone = (id: string) => {
    const newDone = new Set(doneIds);
    if (newDone.has(id)) newDone.delete(id);
    else newDone.add(id);
    setDoneIds(newDone);
  };

  return (
    <div className="h-screen bg-amber-50 font-sans text-slate-800 p-2 md:p-4 overflow-hidden flex flex-col">
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
        {screen === 'setup' && (
          <header className="mb-4 shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center justify-center p-2 bg-amber-400 rounded-xl shadow-lg transform -rotate-3 hover:rotate-0 transition-transform cursor-pointer">
                <Music className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-rose-500 tracking-tight drop-shadow-sm">
                GUESS THE SONG!
              </h1>
            </div>
            {questions.length > 0 && (
              <button 
                onClick={startPlaying}
                className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-black rounded-full shadow-lg flex items-center gap-2 transform hover:scale-105 active:scale-95 transition-all"
              >
                <Play className="w-4 h-4 fill-current" />
                BẮT ĐẦU CHƠI
              </button>
            )}
          </header>
        )}

        <AnimatePresence mode="wait">
          {screen === 'setup' ? (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6 flex-1 overflow-y-auto no-scrollbar pb-10"
            >
              {/* Form Card */}
              <div className="bg-white rounded-3xl shadow-xl shadow-amber-200/50 p-6 md:p-8 border-4 border-white">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <Settings2 className="w-6 h-6 text-rose-500" />
                      Cài đặt
                    </h2>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          if (confirm('Bạn có muốn xóa hết và dùng bộ đề mặc định không?')) {
                            setQuestions(DEFAULT_QUESTIONS);
                          }
                        }}
                        className="px-4 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-full text-xs font-bold transition-all border border-rose-100 shadow-sm"
                      >
                        RESET MẶC ĐỊNH
                      </button>
                    </div>
                  </div>
                  <span className={`px-4 py-1 rounded-full font-bold text-sm ${questions.length >= 10 ? 'bg-rose-100 text-rose-500' : 'bg-emerald-100 text-emerald-600'}`}>
                    {questions.length}/10 câu
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600 ml-1">Câu hỏi</label>
                    <input 
                      type="text" 
                      placeholder="Ví dụ: Bài hát nào có giai điệu này?" 
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-amber-400 focus:outline-none transition-colors"
                      value={formData.question}
                      onChange={e => setFormData({...formData, question: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600 ml-1">Câu trả lời</label>
                    <input 
                      type="text" 
                      placeholder="Tên bài hát / Ca sĩ" 
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-amber-400 focus:outline-none transition-colors"
                      value={formData.answer}
                      onChange={e => setFormData({...formData, answer: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600 ml-1">Link Youtube 1 (Nhạc đố)</label>
                    <input 
                      type="url" 
                      placeholder="https://www.youtube.com/watch?v=..." 
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-amber-400 focus:outline-none transition-colors text-sm"
                      value={formData.quizUrl}
                      onChange={e => setFormData({...formData, quizUrl: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600 ml-1">Link Youtube 2 (Video Karaoke/Live)</label>
                    <input 
                      type="url" 
                      placeholder="Link để cùng hát sau khi giải" 
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-amber-400 focus:outline-none transition-colors text-sm"
                      value={formData.singUrl}
                      onChange={e => setFormData({...formData, singUrl: e.target.value})}
                    />
                  </div>
                </div>

                <button 
                  onClick={handleAddQuestion}
                  disabled={questions.length >= 10}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 transform active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-6 h-6" />
                  THÊM CÂU HỎI
                </button>
              </div>

              <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 border-2 border-white">
                  <div className="flex items-center justify-between mb-4 px-2">
                    <h3 className="text-lg font-bold">Sơ đồ bộ đề</h3>
                    <button 
                      onClick={() => setShowListAnswers(!showListAnswers)}
                      className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 bg-white rounded-full shadow-sm hover:shadow-md transition-all text-slate-600 border border-slate-100"
                    >
                      {showListAnswers ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      {showListAnswers ? 'ẨN ĐÁP ÁN' : 'HIỆN ĐÁP ÁN'}
                    </button>
                  </div>
                  <div className="space-y-3">
                    {questions.length > 0 ? (
                      questions.map((q, idx) => (
                      <div key={q.id} className="bg-white p-3 rounded-2xl shadow-sm flex items-center justify-between group animate-in slide-in-from-left duration-300">
                        <div className="flex items-center gap-4">
                          <span className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center font-black text-sm">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="font-bold text-slate-800 line-clamp-1 text-sm">{q.question}</p>
                            <p className={`text-[10px] uppercase font-black transition-all ${showListAnswers ? 'text-rose-500 opacity-100' : 'text-slate-300 opacity-0 h-0 overflow-hidden'}`}>
                              {q.answer}
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDelete(q.id)}
                          className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="bg-white/50 border-2 border-dashed border-slate-200 p-8 rounded-2xl text-center">
                      <p className="text-slate-400 text-sm font-medium">Chưa có câu hỏi nào. <br/> Bấm "RESET MẶC ĐỊNH" để lấy 6 câu hỏi mẫu!</p>
                    </div>
                  )}
                  </div>
                </div>

            </motion.div>
          ) : (
            <motion.div
              key="game"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="flex-1 flex flex-col min-h-0"
            >
              {/* Question Navigator - Compact */}
              <div className="bg-white/80 backdrop-blur-md p-2 rounded-full shadow-lg border-2 border-white overflow-x-auto no-scrollbar mb-3 shrink-0">
                <div className="flex items-center justify-center gap-2 min-w-max">
                  {questions.map((q, idx) => (
                    <button
                      key={q.id}
                      onClick={() => handleScreenChange(idx)}
                      className={`w-9 h-9 rounded-full font-black text-xs flex items-center justify-center transition-all transform active:scale-90 ${
                        activeIdx === idx 
                        ? 'ring-4 ring-rose-200 bg-rose-500 text-white scale-110 shadow-lg' 
                        : doneIds.has(q.id)
                          ? 'bg-emerald-500 text-white shadow-md'
                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                  <button 
                    onClick={() => setScreen('setup')}
                    className="w-9 h-9 rounded-full bg-slate-800 text-white flex items-center justify-center hover:bg-slate-900 transition-colors"
                  >
                    <Settings2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Game Card - Optimized for space */}
              <div className="bg-white rounded-[2rem] shadow-2xl p-4 md:p-6 border-4 border-white relative flex-1 flex flex-col overflow-hidden">
                <div className="mb-3 relative shrink-0">
                  <h3 className="text-emerald-500 font-black tracking-widest uppercase text-xs">CÂU HỎI {activeIdx + 1}</h3>
                  <h2 className="text-xl md:text-2xl font-black text-slate-800 leading-tight">
                    {currentQuestion?.question}
                  </h2>
                </div>

                <div 
                  className="aspect-video w-full rounded-2xl bg-slate-900 shadow-xl mb-4 relative border-4 border-slate-50 overflow-hidden shrink-0"
                >
                  {/* Masking container to hide top bar (YouTube Title) more aggressively */}
                  <div className="absolute w-[110%] h-[140%] -top-[20%] -left-[5%] pointer-events-none">
                    <YouTubePlayer 
                      videoId={currentQuestion.quizId} 
                      startTime={currentQuestion.startTime} 
                      onStateChange={handlePlayerStateChange} 
                    />
                  </div>
                  
                  {/* Invisible click layer */}
                  <div 
                    className="absolute inset-0 z-30 cursor-pointer"
                    onClick={togglePlayback}
                  >
                    {!isPlaying && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border-2 border-white/50">
                          <Play className="w-8 h-8 text-white fill-current translate-x-1" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Interaction Area - Compact */}
                <div className="flex flex-col gap-3 min-h-0 flex-1 overflow-y-auto no-scrollbar">
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setShowAnswer(!showAnswer)}
                      className="flex-1 py-3 bg-amber-400 hover:bg-amber-500 text-slate-900 font-black rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 text-sm"
                    >
                      {showAnswer ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      {showAnswer ? 'ẨN ĐÁP ÁN' : 'XEM ĐÁP ÁN'}
                    </button>

                    <button 
                      onClick={() => toggleDone(currentQuestion.id)}
                      className={`flex-1 py-3 font-black rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 text-sm ${
                        doneIds.has(currentQuestion.id) 
                        ? 'bg-emerald-100 text-emerald-600 border-2 border-emerald-500' 
                        : 'bg-emerald-500 text-white hover:bg-emerald-600'
                      }`}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      {doneIds.has(currentQuestion.id) ? 'XONG' : 'ĐÁNH DẤU'}
                    </button>
                  </div>

                  <AnimatePresence>
                    {showAnswer && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="bg-rose-50 border-2 border-rose-100 rounded-2xl p-3 text-center shrink-0"
                      >
                        <h4 className="text-2xl md:text-3xl font-black text-rose-500 uppercase tracking-tight">{currentQuestion.answer}</h4>
                        {currentQuestion.singUrl && (
                          <button 
                            onClick={() => {
                              const player = (window as any)._activePlayer;
                              if (player && typeof player.pauseVideo === 'function') {
                                player.pauseVideo();
                              }
                              window.open(currentQuestion.singUrl, '_blank');
                            }}
                            className="mt-2 inline-flex items-center gap-2 px-6 py-2 bg-rose-500 text-white rounded-full font-black text-xs shadow-md hover:bg-rose-600 transition-all hover:scale-105"
                          >
                            <Mic2 className="w-4 h-4" />
                            HÁT NGAY!
                          </button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Footer Controls - Compact */}
                <div className="mt-4 flex items-center justify-between border-t-2 border-slate-50 pt-3 shrink-0">
                  <button 
                    disabled={activeIdx === 0}
                    onClick={() => handleScreenChange(activeIdx - 1)}
                    className="flex items-center gap-1 font-black text-slate-400 hover:text-rose-500 disabled:opacity-0 transition-all text-xs"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    CÂU TRƯỚC
                  </button>

                  <button 
                    disabled={activeIdx === questions.length - 1}
                    onClick={() => handleScreenChange(activeIdx + 1)}
                    className="flex items-center gap-1 font-black text-slate-400 hover:text-rose-500 disabled:opacity-0 transition-all text-xs"
                  >
                    CÂU TIẾP THEO
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {screen === 'setup' && (
          <footer className="mt-4 text-center text-slate-400 text-xs font-medium shrink-0">
            <p>Dành cho những tâm hồn yêu âm nhạc ❤️</p>
          </footer>
        )}
      </div>
    </div>
  );
}

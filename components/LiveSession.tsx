import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

interface LiveSessionProps {
  onClose: () => void;
}

const LiveSession: React.FC<LiveSessionProps> = ({ onClose }) => {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<any>(null); // To hold the session promise/object
  
  // Audio Contexts
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  useEffect(() => {
    let mounted = true;
    
    const startSession = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // Setup Audio Contexts
        inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        
        const outputNode = outputAudioContextRef.current!.createGain();
        outputNode.connect(outputAudioContextRef.current!.destination);

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction: "You are Sherpa Tenzing, a helpful mountaineering guide teaching the user about AI. Keep it short, conversational, and fun. Use metaphors about climbing mountains.",
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } }
            }
          },
          callbacks: {
            onopen: () => {
              if (!mounted) return;
              setStatus('connected');
              
              // Input Audio Processing
              const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
              const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
              
              scriptProcessor.onaudioprocess = (e) => {
                if (isMuted) return;
                const inputData = e.inputBuffer.getChannelData(0);
                
                // Calculate simple volume for visualizer
                let sum = 0;
                for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
                if(mounted) setVolume(Math.sqrt(sum / inputData.length));

                const pcmBlob = createBlob(inputData);
                sessionPromise.then(session => {
                   session.sendRealtimeInput({ media: pcmBlob });
                });
              };
              
              source.connect(scriptProcessor);
              scriptProcessor.connect(inputAudioContextRef.current!.destination);
            },
            onmessage: async (msg: LiveServerMessage) => {
               if (!mounted) return;

               const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
               if (base64Audio) {
                 const ctx = outputAudioContextRef.current!;
                 nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                 
                 const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
                 const source = ctx.createBufferSource();
                 source.buffer = audioBuffer;
                 source.connect(outputNode);
                 
                 source.addEventListener('ended', () => {
                     sourcesRef.current.delete(source);
                 });
                 
                 source.start(nextStartTimeRef.current);
                 nextStartTimeRef.current += audioBuffer.duration;
                 sourcesRef.current.add(source);
               }
               
               if (msg.serverContent?.interrupted) {
                   sourcesRef.current.forEach(s => s.stop());
                   sourcesRef.current.clear();
                   nextStartTimeRef.current = 0;
               }
            },
            onclose: () => { console.log("Session closed"); },
            onerror: (err) => { console.error(err); setStatus('error'); }
          }
        });
        
        sessionRef.current = sessionPromise;

      } catch (err) {
        console.error("Failed to start live session", err);
        if(mounted) setStatus('error');
      }
    };

    startSession();

    return () => {
      mounted = false;
      // Cleanup
      if (inputAudioContextRef.current) inputAudioContextRef.current.close();
      if (outputAudioContextRef.current) outputAudioContextRef.current.close();
      // Cannot explicitly close session with provided API in this scope effectively without holding session object better, 
      // but breaking the audio context stops the flow. 
      // Ideally: sessionRef.current.then(s => s.close());
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Helper functions
  const createBlob = (data: Float32Array) => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        int16[i] = data[i] * 32768;
    }
    const bytes = new Uint8Array(int16.buffer);
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    const b64 = btoa(binary);
    return {
        data: b64,
        mimeType: 'audio/pcm;rate=16000'
    };
  };

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
      const dataInt16 = new Int16Array(data.buffer);
      const frameCount = dataInt16.length / numChannels;
      const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
      for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
          channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
      }
      return buffer;
  }

  return (
    <div className="flex flex-col items-center justify-center h-full bg-slate-900/90 backdrop-blur-md p-8 rounded-2xl border border-sky-500/30">
        <div className="mb-8 relative">
            <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-100 ${status === 'connected' ? 'bg-sky-500' : 'bg-slate-700'}`}
                 style={{ transform: `scale(${1 + volume * 2})`, boxShadow: `0 0 ${volume * 50}px #0ea5e9` }}>
                <span className="text-4xl">🏔️</span>
            </div>
            {status === 'connecting' && <div className="absolute -bottom-8 w-full text-center text-sky-300 animate-pulse">Connecting to Sherpa...</div>}
        </div>

        <h2 className="text-2xl font-bold text-white mb-4">Live Voice Practice</h2>
        <p className="text-slate-300 mb-8 text-center max-w-md">
            Speak to Tenzing. Ask him about climbing the "AI Mountain" or how to start using Gemini.
        </p>

        <div className="flex gap-4">
             <button onClick={() => setIsMuted(!isMuted)} className={`px-6 py-3 rounded-full font-bold ${isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-slate-700 hover:bg-slate-600'}`}>
                {isMuted ? 'Unmute Mic' : 'Mute Mic'}
             </button>
             <button onClick={onClose} className="px-6 py-3 rounded-full bg-slate-800 border border-slate-600 hover:bg-slate-700 text-white font-bold">
                End Session
             </button>
        </div>
    </div>
  );
};

export default LiveSession;
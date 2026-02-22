"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, ShieldCheck, Lock, Fingerprint, ChevronDown, ChevronUp, Terminal, Activity } from 'lucide-react';

interface AuditMetrics { f1: number; precision: number; recall: number; }
interface TranslationData { mode: string; yoruba: string; metrics: AuditMetrics; status: 'VERIFIED' | 'QUARANTINE'; }
interface AuditLog { id: string; timestamp: string; hash: string; action: string; }

const translationCache: Record<string, Record<string, TranslationData>> = {
    "default": {
        "CORPORATE": {
            mode: "Corporate (Strict)", yoruba: "Mo nilo ki adehun yii wa ni fowosi ni agogo marun irọlẹ.",
            metrics: { f1: 0.98, precision: 0.99, recall: 0.97 }, status: "VERIFIED"
        },
        "SOCIAL": {
            mode: "Social (Casual)", yoruba: "Jowo ri daju pe o buwolu iwe yii ki a to lu agogo marun.",
            metrics: { f1: 0.85, precision: 0.82, recall: 0.88 }, status: "VERIFIED"
        },
        "CULTURAL": {
            mode: "Cultural (Deep)", yoruba: "Ise ki n duro de eniyan; akoko ko duro de enikeni. E jowo e fowosi.",
            metrics: { f1: 0.65, precision: 0.60, recall: 0.70 }, status: "QUARANTINE"
        }
    }
};

export default function LogiGuardEditor() {
    const [hardwareConnected, setHardwareConnected] = useState(false);
    const [dialValue, setDialValue] = useState(50);
    const [rawInputText, setRawInputText] = useState("Send the contract to ceo@company.com and call 08012345678 by 5pm.");
    const [dlpEnabled, setDlpEnabled] = useState(true);
    const [activeData, setActiveData] = useState<TranslationData>(translationCache["default"]["SOCIAL"]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [showMetrics, setShowMetrics] = useState(false); // Toggle for the complex stuff
    const wsRef = useRef<WebSocket | null>(null);
    const logsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const connectHardware = () => {
            const ws = new WebSocket('ws://127.0.0.1:8080');
            ws.onopen = () => { setHardwareConnected(true); wsRef.current = ws; };
            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.event === 'dial_rotate') handleDialChange(data.value);
                } catch (err) {}
            };
            ws.onclose = () => setHardwareConnected(false);
        };
        connectHardware();
        return () => wsRef.current?.close();
    }, []);

    useEffect(() => { logsEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [auditLogs]);

    const handleDialChange = (value: number) => {
        setDialValue(value);
        let modeKey = "SOCIAL";
        if (value < 30) modeKey = "CORPORATE";
        else if (value >= 70) modeKey = "CULTURAL";
        setActiveData(translationCache["default"][modeKey as keyof typeof translationCache["default"]]);
    };

    const applyDLP = (text: string) => {
        if (!dlpEnabled) return text;
        let masked = text.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, "[EMAIL_REDACTED]");
        masked = masked.replace(/\b\d{10,11}\b/g, "[PHONE_REDACTED]");
        return masked;
    };

    const handleHardwareVerify = () => {
        const newHash = Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('');
        setAuditLogs(prev => [...prev, {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toISOString().split('T')[1].slice(0, 8),
            hash: `0x${newHash}`,
            action: `MX_ACTION: ${activeData.mode} output logged for RLHF.`
        }]);
    };

    return (
        <div className="min-h-screen bg-[#F9FAFB] text-gray-900 font-sans selection:bg-teal-200 flex flex-col">
            {/* CLEAN, FAMILIAR TOP BAR */}
            <nav className="border-b bg-white px-8 py-4 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="text-teal-600" size={28} />
                    <span className="font-bold text-xl tracking-tight">Logi-Guard Editor</span>
                </div>
                <div className="flex items-center gap-2 text-sm bg-gray-100 px-3 py-1.5 rounded-full border">
                    <div className={`w-2.5 h-2.5 rounded-full ${hardwareConnected ? 'bg-teal-500 animate-pulse' : 'bg-red-500'}`} />
                    <span className="font-medium text-gray-700">{hardwareConnected ? 'MX Hardware Active' : 'Simulation Mode'}</span>
                </div>
            </nav>

            <main className="flex-1 max-w-6xl mx-auto w-full p-8 flex flex-col gap-6 mt-4">
                
                {/* THE MAIN TRANSLATION ARENA (Looks like Google Translate) */}
                <div className="grid grid-cols-2 gap-8 bg-white p-6 rounded-2xl shadow-sm border">
                    
                    {/* LEFT: SOURCE TEXT */}
                    <div className="flex flex-col h-full">
                        <div className="flex justify-between items-center mb-3">
                            <span className="font-semibold text-gray-700 uppercase tracking-wide text-sm">Source (English)</span>
                            <button 
                                onClick={() => setDlpEnabled(!dlpEnabled)}
                                className={`text-xs px-3 py-1 rounded-full flex items-center gap-1 font-medium transition-colors ${dlpEnabled ? 'bg-teal-100 text-teal-800' : 'bg-gray-100 text-gray-500'}`}
                            >
                                <Lock size={12} /> Privacy Guard {dlpEnabled ? 'ON' : 'OFF'}
                            </button>
                        </div>
                        <textarea 
                            className="flex-1 bg-gray-50 border rounded-xl p-4 text-gray-800 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none resize-none text-lg"
                            value={rawInputText}
                            onChange={(e) => setRawInputText(e.target.value)}
                        />
                        {dlpEnabled && (
                            <div className="mt-3 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg border">
                                <span className="font-semibold">Masked for AI: </span>{applyDLP(rawInputText)}
                            </div>
                        )}
                    </div>

                    {/* RIGHT: OUTPUT TEXT */}
                    <div className="flex flex-col h-full relative">
                        <div className="flex justify-between items-center mb-3">
                            <span className="font-semibold text-gray-700 uppercase tracking-wide text-sm">Target (Yoruba)</span>
                            <div className={`text-xs px-3 py-1 rounded-full flex items-center gap-1 font-bold ${activeData.status === 'VERIFIED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {activeData.status === 'VERIFIED' ? <ShieldCheck size={14}/> : <ShieldAlert size={14}/>}
                                {activeData.status}
                            </div>
                        </div>
                        
                        <div className={`flex-1 border-2 rounded-xl p-4 text-xl flex flex-col justify-between transition-colors ${activeData.status === 'VERIFIED' ? 'bg-green-50/30 border-green-200' : 'bg-red-50/30 border-red-200'}`}>
                            <p className="text-gray-900 leading-relaxed">{activeData.yoruba}</p>
                            
                            <button 
                                onClick={handleHardwareVerify}
                                disabled={activeData.status !== 'VERIFIED'}
                                className={`mt-4 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all w-full ${activeData.status === 'VERIFIED' ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-md' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                            >
                                <Fingerprint size={18} /> MX ACTION: VERIFY & LOG
                            </button>
                        </div>
                    </div>
                </div>

                {/* THE BRIDGE: TONE CONTROLLER */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border text-center">
                    <span className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 block">Select Cultural Tone</span>
                    <input 
                        type="range" min="0" max="100" value={dialValue}
                        onChange={(e) => handleDialChange(parseInt(e.target.value))}
                        className="w-2/3 h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                    />
                    <div className="flex justify-between w-2/3 mx-auto text-sm font-semibold text-gray-600 mt-3">
                        <span className={dialValue < 30 ? "text-teal-700" : ""}>Corporate</span>
                        <span className={dialValue >= 30 && dialValue < 70 ? "text-teal-700" : ""}>Social</span>
                        <span className={dialValue >= 70 ? "text-teal-700" : ""}>Cultural</span>
                    </div>
                </div>

                {/* THE BASEMENT: ENTERPRISE TELEMETRY (Hidden by default) */}
                <div className="mt-4">
                    <button 
                        onClick={() => setShowMetrics(!showMetrics)}
                        className="flex items-center gap-2 mx-auto text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors mb-4"
                    >
                        {showMetrics ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                        {showMetrics ? "Hide Enterprise Telemetry" : "Show Enterprise Telemetry"}
                    </button>

                    {showMetrics && (
                        <div className="grid grid-cols-2 gap-6 bg-[#111] p-6 rounded-2xl shadow-inner text-gray-300">
                            {/* Analytics */}
                            <div>
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2 mb-4"><Activity size={14}/> Quality Control Diagnostics</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between border-b border-gray-800 pb-2"><span>F1-Score (Trust)</span><span className={activeData.metrics.f1 > 0.8 ? 'text-teal-400 font-mono' : 'text-red-400 font-mono'}>{activeData.metrics.f1.toFixed(3)}</span></div>
                                    <div className="flex justify-between border-b border-gray-800 pb-2"><span>Precision</span><span className="font-mono">{activeData.metrics.precision.toFixed(3)}</span></div>
                                    <div className="flex justify-between"><span>Recall</span><span className="font-mono">{activeData.metrics.recall.toFixed(3)}</span></div>
                                </div>
                            </div>
                            
                            {/* Logs */}
                            <div className="flex flex-col h-40">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2 mb-4"><Terminal size={14}/> Hardware RLHF Log</h3>
                                <div className="flex-1 overflow-y-auto font-mono text-xs space-y-2 bg-[#0a0a0a] p-3 rounded-lg border border-gray-800">
                                    {auditLogs.length === 0 ? <span className="text-gray-600">No verifications logged yet.</span> : auditLogs.map(log => (
                                        <div key={log.id} className="text-gray-400"><span className="text-teal-600">[{log.timestamp}]</span> {log.action} <br/><span className="text-gray-600">{log.hash}</span></div>
                                    ))}
                                    <div ref={logsEndRef} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

            </main>
        </div>
    );
}
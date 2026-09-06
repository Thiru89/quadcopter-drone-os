import React, { useState } from 'react';
import { 
  Key, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Send, 
  Terminal, 
  Globe, 
  ShieldCheck, 
  Lock, 
  Radio, 
  Layers,
  Code2
} from 'lucide-react';
import { ApiKeyRecord } from '../types';

interface ApiIntegrationProps {
  apiKeys: ApiKeyRecord[];
  onGenerateKey: (name: string, scopes: string[]) => Promise<{ keyRecord: ApiKeyRecord; generatedPlainSecret: string }>;
  onRevokeKey: (id: string) => void;
}

export const ApiIntegration: React.FC<ApiIntegrationProps> = ({
  apiKeys,
  onGenerateKey,
  onRevokeKey
}) => {
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newKeyName, setNewKeyName] = useState<string>('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['telemetry:read']);
  const [plainTokenRevealed, setPlainTokenRevealed] = useState<string | null>(null);

  // API Explorer Sandbox State
  const [testEndpoint, setTestEndpoint] = useState<string>('/api/telemetry/live');
  const [testMethod, setTestMethod] = useState<'GET' | 'POST'>('GET');
  const [testBody, setTestBody] = useState<string>('{\n  "command": "SET_ALTITUDE",\n  "parameters": { "altitude": 65 }\n}');
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [apiLoading, setApiLoading] = useState<boolean>(false);
  const [apiStatus, setApiStatus] = useState<number | null>(null);

  const availableScopes = [
    { id: 'telemetry:read', desc: 'Read live 800Hz UAV flight telemetry & rotor states' },
    { id: 'telemetry:stream', desc: 'Connect to real-time WebSockets telemetry feed' },
    { id: 'commands:write', desc: 'Dispatch authenticated navigation commands' },
    { id: 'plugins:manage', desc: 'Mount, toggle and configure modular sensor drivers' },
    { id: 'logs:export', desc: 'Query and download historical mission telemetry logs' },
    { id: 'survey:read', desc: 'Access autonomous photogrammetry survey grids' }
  ];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 1500);
  };

  const handleCreateKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    const res = await onGenerateKey(newKeyName, selectedScopes);
    setPlainTokenRevealed(res.generatedPlainSecret);
    setNewKeyName('');
  };

  const runApiTest = async () => {
    setApiLoading(true);
    setApiResponse(null);
    setApiStatus(null);

    try {
      const options: RequestInit = {
        method: testMethod,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer qpos_live_enterprise_token'
        }
      };

      if (testMethod === 'POST') {
        options.body = testBody;
      }

      const res = await fetch(testEndpoint, options);
      setApiStatus(res.status);
      const data = await res.json();
      setApiResponse(data);
    } catch (err: any) {
      setApiStatus(500);
      setApiResponse({ error: err.message || 'API request failed' });
    } finally {
      setApiLoading(false);
    }
  };

  return (
    <div className="space-y-4 text-[#e2e2e2]">
      {/* Top Banner */}
      <div className="bg-[#151518] border border-white/5 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-sky-400">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">
                Secure Enterprise API & External Integration Gateway
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-sky-400 border border-white/5 uppercase tracking-widest">
                REST & WebSocket Ready
              </span>
            </div>
            <p className="text-xs text-white/40 font-mono">
              Role-Based Scopes • Rate Limiting • GIS & Fleet ERP Interoperability
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setPlainTokenRevealed(null);
            setShowCreateModal(true);
          }}
          className="px-3.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-black font-bold text-[11px] uppercase tracking-wider transition flex items-center gap-1.5 shadow-[0_0_15px_rgba(14,165,233,0.3)] cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          GENERATE API TOKEN
        </button>
      </div>

      {/* Main Grid: API Keys & Interactive Endpoint Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left 5 Cols: Active API Keys */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-white/40 px-1">
            <span>Authorized Integration Keys ({apiKeys.length})</span>
            <span>Rate Limit</span>
          </div>

          {apiKeys.map((key) => (
            <div 
              key={key.id}
              className="p-3.5 rounded-xl bg-[#151518] border border-white/5 space-y-2.5 font-mono text-xs shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <strong className="text-[#e2e2e2] font-semibold text-sm">{key.name}</strong>
                  <div className="text-[11px] text-sky-400 font-mono mt-0.5 flex items-center gap-1.5">
                    <code>{key.keyPrefix}</code>
                    <button
                      onClick={() => handleCopy(key.keyPrefix, key.id)}
                      className="text-white/40 hover:text-white cursor-pointer"
                      title="Copy Key"
                    >
                      {copiedKeyId === key.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => onRevokeKey(key.id)}
                  className="p-1 text-white/30 hover:text-rose-400 transition cursor-pointer"
                  title="Revoke Token"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Scopes */}
              <div className="flex flex-wrap gap-1">
                {key.scopes.map(s => (
                  <span key={s} className="text-[9px] px-1.5 py-0.5 rounded-md bg-[#0d0d0f] text-white/60 border border-white/5">
                    {s}
                  </span>
                ))}
              </div>

              <div className="text-[10px] text-white/40 border-t border-white/5 pt-1.5 flex justify-between">
                <span>Limit: {key.rateLimitPerMin} req/min</span>
                <span>Last Used: {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleTimeString() : 'Never'}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Right 7 Cols: Interactive API Sandbox Explorer */}
        <div className="lg:col-span-7 bg-[#151518] border border-white/5 rounded-xl p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">
                Interactive REST API Sandbox
              </h3>
            </div>
            <span className="text-[10px] font-mono text-sky-400 uppercase tracking-widest">Live Gateway</span>
          </div>

          {/* Endpoint Bar */}
          <div className="flex gap-2 font-mono text-xs">
            <select
              value={testMethod}
              onChange={(e) => setTestMethod(e.target.value as any)}
              className="bg-[#0d0d0f] border border-white/10 rounded-lg px-2.5 py-1.5 text-sky-400 font-bold focus:border-sky-500 outline-none"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
            </select>

            <select
              value={testEndpoint}
              onChange={(e) => {
                const ep = e.target.value;
                setTestEndpoint(ep);
                if (ep === '/api/commands/dispatch') {
                  setTestMethod('POST');
                } else if (ep === '/api/survey/compute-grid') {
                  setTestMethod('POST');
                  setTestBody('{\n  "widthMeters": 300,\n  "heightMeters": 400,\n  "flightAltitudeM": 60\n}');
                } else {
                  setTestMethod('GET');
                }
              }}
              className="flex-1 bg-[#0d0d0f] border border-white/10 rounded-lg px-2.5 py-1.5 text-white focus:border-sky-500 outline-none"
            >
              <option value="/api/telemetry/live">/api/telemetry/live (Real-time Quadrapuller telemetry)</option>
              <option value="/api/system/status">/api/system/status (Flight state & active alerts)</option>
              <option value="/api/plugins">/api/plugins (Installed sensor payloads)</option>
              <option value="/api/logs">/api/logs (Cloud-based mission repository)</option>
              <option value="/api/commands/dispatch">/api/commands/dispatch (Encrypted command uplink)</option>
              <option value="/api/survey/compute-grid">/api/survey/compute-grid (Autonomous survey path)</option>
              <option value="/api/health">/api/health (System status)</option>
            </select>

            <button
              onClick={runApiTest}
              disabled={apiLoading}
              className="px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs uppercase tracking-wider transition flex items-center gap-1 shadow-[0_0_15px_rgba(14,165,233,0.3)] cursor-pointer"
            >
              <Send className="w-3 h-3" />
              SEND
            </button>
          </div>

          {/* Payload input if POST */}
          {testMethod === 'POST' && (
            <div>
              <label className="text-white/40 text-[11px] font-mono block mb-1">Request Body (JSON):</label>
              <textarea 
                rows={3}
                value={testBody}
                onChange={(e) => setTestBody(e.target.value)}
                className="w-full bg-[#0d0d0f] border border-white/10 rounded-lg p-2 text-[#e2e2e2] font-mono text-xs focus:border-sky-500 outline-none"
              />
            </div>
          )}

          {/* Live Response Box */}
          <div className="bg-[#050505] rounded-xl p-3 border border-white/10 font-mono text-xs space-y-2">
            <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
              <span className="text-white/40 text-[11px]">HTTP Response:</span>
              {apiStatus !== null && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                  apiStatus < 300 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  STATUS: {apiStatus} OK
                </span>
              )}
            </div>

            <pre className="max-h-[220px] overflow-y-auto text-[11px] text-emerald-400 leading-relaxed scrollbar-thin">
              {apiLoading 
                ? 'Connecting to Quadrapuller OS backend gateway...' 
                : apiResponse 
                ? JSON.stringify(apiResponse, null, 2) 
                : '// Click "SEND" to test external API integration'}
            </pre>
          </div>
        </div>
      </div>

      {/* Generate Key Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#151518] border border-white/10 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-sky-400" />
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">
                  Generate Enterprise API Token
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-white/40 hover:text-white font-mono text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {plainTokenRevealed ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300">
                  <div className="font-bold text-sm mb-1">Token Generated Successfully!</div>
                  <p className="text-[11px] text-emerald-400">
                    Copy your API secret now. It will never be displayed again.
                  </p>
                </div>

                <div className="p-2.5 bg-[#0d0d0f] border border-white/10 rounded-xl flex items-center justify-between">
                  <code className="text-sky-400 break-all text-[11px]">{plainTokenRevealed}</code>
                  <button
                    onClick={() => handleCopy(plainTokenRevealed, 'new-secret')}
                    className="ml-2 text-white/40 hover:text-white cursor-pointer"
                  >
                    {copiedKeyId === 'new-secret' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-full py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(14,165,233,0.3)] cursor-pointer"
                >
                  DONE
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateKeySubmit} className="space-y-3 font-mono text-xs">
                <div>
                  <label className="text-white/70 block mb-1">Client / System Name:</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. ArcGIS Enterprise Sync or DroneDeploy Pipeline"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="w-full bg-[#0d0d0f] border border-white/10 rounded-lg px-3 py-1.5 text-white focus:border-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-white/70 block mb-1.5">Authorized Permissions (Scopes):</label>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {availableScopes.map((scope) => {
                      const isChecked = selectedScopes.includes(scope.id);
                      return (
                        <label 
                          key={scope.id}
                          className="flex items-start gap-2 p-2 rounded-xl bg-[#0d0d0f] border border-white/5 cursor-pointer hover:border-white/20"
                        >
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setSelectedScopes(selectedScopes.filter(s => s !== scope.id));
                              } else {
                                setSelectedScopes([...selectedScopes, scope.id]);
                              }
                            }}
                            className="mt-0.5 accent-sky-500"
                          />
                          <div>
                            <strong className="text-[#e2e2e2] block text-[11px]">{scope.id}</strong>
                            <span className="text-[10px] text-white/40">{scope.desc}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-3.5 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 text-xs font-semibold uppercase tracking-wider cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(14,165,233,0.3)] cursor-pointer"
                  >
                    Issue Token
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

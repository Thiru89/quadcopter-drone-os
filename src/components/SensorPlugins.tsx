import React, { useState } from 'react';
import { 
  Cpu, 
  Power, 
  Plus, 
  Thermometer, 
  Radio, 
  Activity, 
  Wind, 
  Compass, 
  Zap, 
  Sliders, 
  CheckCircle, 
  AlertCircle,
  Eye,
  Lock,
  Layers
} from 'lucide-react';
import { SensorPlugin, SensorType } from '../types';

interface SensorPluginsProps {
  plugins: SensorPlugin[];
  onTogglePlugin: (id: string) => void;
  onInstallPlugin: (newPlugin: Partial<SensorPlugin>) => void;
}

export const SensorPlugins: React.FC<SensorPluginsProps> = ({
  plugins,
  onTogglePlugin,
  onInstallPlugin
}) => {
  const [selectedPluginId, setSelectedPluginId] = useState<string>(plugins[0]?.id || '');
  const [showInstallModal, setShowInstallModal] = useState(false);

  // New plugin form state
  const [newPluginName, setNewPluginName] = useState('');
  const [newPluginType, setNewPluginType] = useState<SensorType>('LIDAR');
  const [newPluginBus, setNewPluginBus] = useState<'USB_3' | 'CAN_1' | 'ETHERNET_MII' | 'SPI_0' | 'I2C_2'>('USB_3');
  const [newPluginHz, setNewPluginHz] = useState(25);
  const [newPluginWatts, setNewPluginWatts] = useState(6.5);
  const [newPluginWeight, setNewPluginWeight] = useState(240);
  const [newPluginDesc, setNewPluginDesc] = useState('');

  const selectedPlugin = plugins.find(p => p.id === selectedPluginId) || plugins[0];

  const totalPowerWatts = plugins
    .filter(p => p.status === 'ACTIVE')
    .reduce((acc, curr) => acc + curr.powerDrawWatts, 0);

  const totalBandwidthKbps = plugins
    .filter(p => p.status === 'ACTIVE')
    .reduce((acc, curr) => acc + curr.bandwidthKbps, 0);

  const totalPayloadWeightG = plugins
    .filter(p => p.status === 'ACTIVE')
    .reduce((acc, curr) => acc + curr.weightGrams, 0);

  const handleInstallSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPluginName.trim()) return;

    onInstallPlugin({
      name: newPluginName,
      type: newPluginType,
      interfaceBus: newPluginBus,
      samplingRateHz: Number(newPluginHz),
      powerDrawWatts: Number(newPluginWatts),
      weightGrams: Number(newPluginWeight),
      description: newPluginDesc || 'Custom enterprise sensor payload driver module.'
    });

    setNewPluginName('');
    setNewPluginDesc('');
    setShowInstallModal(false);
  };

  const getSensorIcon = (type: SensorType) => {
    switch (type) {
      case 'LIDAR': return <Layers className="w-4 h-4 text-sky-400" />;
      case 'THERMAL': return <Thermometer className="w-4 h-4 text-amber-400" />;
      case 'RADAR': return <Radio className="w-4 h-4 text-emerald-400" />;
      case 'MULTISPECTRAL': return <Activity className="w-4 h-4 text-indigo-400" />;
      case 'GAS_SNIFFER': return <Wind className="w-4 h-4 text-purple-400" />;
      case 'MAGNETOMETER': return <Compass className="w-4 h-4 text-rose-400" />;
    }
  };

  return (
    <div className="space-y-4 text-[#e2e2e2]">
      {/* Payload Master Metrics Banner */}
      <div className="bg-[#151518] border border-white/5 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-sky-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">
                Modular Sensor Plugin Architecture
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-sky-400 border border-white/5 uppercase tracking-widest">
                Hot-Pluggable Bus
              </span>
            </div>
            <p className="text-xs text-white/40 font-mono">
              Driver Isolation • DMA Ring Buffers • Zero-Trust Hardware Attestation
            </p>
          </div>
        </div>

        {/* Bus Resource Consumption */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="text-right">
            <div className="text-white/40 text-[10px] uppercase tracking-widest">Payload Draw</div>
            <div className="text-sky-400 font-bold">{totalPowerWatts.toFixed(1)} W</div>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div className="text-right">
            <div className="text-white/40 text-[10px] uppercase tracking-widest">Bus Bandwidth</div>
            <div className="text-emerald-400 font-bold">{(totalBandwidthKbps / 1024).toFixed(2)} MB/s</div>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div className="text-right">
            <div className="text-white/40 text-[10px] uppercase tracking-widest">Mounted Mass</div>
            <div className="text-amber-400 font-bold">{totalPayloadWeightG} g <span className="text-[10px] text-white/30 font-normal">/ 3500g</span></div>
          </div>

          <button
            onClick={() => setShowInstallModal(true)}
            className="ml-2 px-3 py-1.5 rounded-lg bg-sky-500 text-black font-bold text-[11px] uppercase tracking-wider transition flex items-center gap-1.5 shadow-[0_0_15px_rgba(14,165,233,0.3)] hover:bg-sky-400 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            INSTALL DRIVER
          </button>
        </div>
      </div>

      {/* Main Plugins Grid & Live Payload View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left 5 Cols: Plugin Registry List */}
        <div className="lg:col-span-5 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono text-white/40 px-1">
            <span>Installed Sensor Modules ({plugins.length})</span>
            <span>Status</span>
          </div>

          {plugins.map((plugin) => {
            const isSelected = selectedPlugin?.id === plugin.id;
            const isActive = plugin.status === 'ACTIVE';

            return (
              <div
                key={plugin.id}
                onClick={() => setSelectedPluginId(plugin.id)}
                className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                  isSelected 
                    ? 'bg-[#19191d] border-sky-500/50 shadow-[0_0_15px_rgba(14,165,233,0.1)]' 
                    : 'bg-[#151518] border-white/5 hover:border-white/15'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-[#0d0d0f] border border-white/5">
                      {getSensorIcon(plugin.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-[#e2e2e2] font-semibold text-sm">
                          {plugin.name}
                        </strong>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/5 text-white/50 border border-white/5">
                          v{plugin.version}
                        </span>
                      </div>
                      <div className="text-[11px] text-white/40 font-mono flex items-center gap-2 mt-0.5">
                        <span>Bus: {plugin.interfaceBus}</span>
                        <span>•</span>
                        <span>{plugin.samplingRateHz} Hz</span>
                        <span>•</span>
                        <span>{plugin.powerDrawWatts} W</span>
                      </div>
                    </div>
                  </div>

                  {/* Toggle Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePlugin(plugin.id);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition border ${
                      isActive 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20' 
                        : 'bg-white/5 text-white/40 border-white/5 hover:text-white'
                    }`}
                  >
                    {isActive ? 'ACTIVE' : 'STANDBY'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right 7 Cols: Selected Plugin Live Telemetry & Inspector */}
        <div className="lg:col-span-7 bg-[#151518] border border-white/5 rounded-xl p-4 shadow-lg flex flex-col justify-between">
          {selectedPlugin ? (
            <div className="space-y-4">
              {/* Header Inspector */}
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-[#0d0d0f] border border-white/5">
                    {getSensorIcon(selectedPlugin.type)}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">
                      {selectedPlugin.name}
                    </h3>
                    <p className="text-xs text-white/40 font-mono">
                      Type: {selectedPlugin.type} • Bus: {selectedPlugin.interfaceBus} • Status: {selectedPlugin.status}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Lock className="w-3.5 h-3.5 text-emerald-400" />
                    Signed Driver
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-white/70 font-mono bg-[#0d0d0f] p-3 rounded-xl border border-white/5">
                {selectedPlugin.description}
              </p>

              {/* Live Payload Stream Box */}
              <div className="bg-[#0d0d0f] rounded-xl p-4 border border-white/5 space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-sky-400">
                    Live Decoded Telemetry Stream
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 animate-pulse">
                    ● STREAMING {selectedPlugin.samplingRateHz} SPS
                  </span>
                </div>

                {/* Specific Visualizer based on Plugin Type */}
                {selectedPlugin.type === 'THERMAL' && (
                  <div className="space-y-2 font-mono text-xs">
                    {/* Radiometric False Color Palette Preview Bar */}
                    <div className="h-6 w-full rounded-lg bg-gradient-to-r from-blue-900 via-purple-600 via-amber-500 to-yellow-200 border border-white/10 flex items-center justify-between px-2 text-[10px] font-bold text-black drop-shadow">
                      <span>17.2°C (MIN)</span>
                      <span>SPOT: 28.4°C</span>
                      <span>38.6°C (MAX)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                      <div className="p-2.5 rounded-lg bg-[#151518] border border-white/5">
                        <span className="text-white/40 block">Spot Temp Max:</span>
                        <strong className="text-amber-400 text-sm">38.6°C (Nominal)</strong>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#151518] border border-white/5">
                        <span className="text-white/40 block">Thermal Gradient:</span>
                        <strong className="text-sky-400 text-sm">+21.4°C</strong>
                      </div>
                    </div>
                  </div>
                )}

                {selectedPlugin.type === 'LIDAR' && (
                  <div className="space-y-2 font-mono text-xs">
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2.5 rounded-lg bg-[#151518] border border-white/5">
                        <span className="text-white/40 block">Point Cloud Acquisition:</span>
                        <strong className="text-sky-400 text-sm">1,280,000 pts/sec</strong>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#151518] border border-white/5">
                        <span className="text-white/40 block">Min Obstacle Range:</span>
                        <strong className="text-emerald-400 text-sm">19.8 meters</strong>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#151518] border border-white/5">
                        <span className="text-white/40 block">Return Channel:</span>
                        <span className="text-[#e2e2e2]">Dual Strongest / Last</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#151518] border border-white/5">
                        <span className="text-white/40 block">Ground Topo Roughness:</span>
                        <span className="text-[#e2e2e2]">1.4 cm RMS</span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedPlugin.type === 'RADAR' && (
                  <div className="space-y-2 font-mono text-xs">
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2.5 rounded-lg bg-[#151518] border border-white/5">
                        <span className="text-white/40 block">Tracked Radar Targets:</span>
                        <strong className="text-emerald-400 text-sm">4 Targets in Horizon</strong>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#151518] border border-white/5">
                        <span className="text-white/40 block">Relative Velocity:</span>
                        <strong className="text-[#e2e2e2] text-sm">-12.4 km/h</strong>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#151518] border border-white/5 col-span-2">
                        <span className="text-white/40 block">Adverse Weather Mode:</span>
                        <span className="text-sky-300">Heavy Dust & Fog Penetration Active (77GHz)</span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedPlugin.type === 'MULTISPECTRAL' && (
                  <div className="space-y-2 font-mono text-xs">
                    <div className="p-2.5 rounded-lg bg-[#151518] border border-white/5 flex items-center justify-between">
                      <span className="text-white/40">Mean Canopy NDVI Index:</span>
                      <strong className="text-emerald-400 text-sm">0.68 (Dense Biomass)</strong>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#151518] border border-white/5 flex items-center justify-between">
                      <span className="text-white/40">Sun Sensor Irradiance:</span>
                      <span className="text-amber-400 font-semibold">840 W/m²</span>
                    </div>
                  </div>
                )}

                {selectedPlugin.type === 'GAS_SNIFFER' && (
                  <div className="space-y-2 font-mono text-xs">
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2.5 rounded-lg bg-[#151518] border border-white/5">
                        <span className="text-white/40 block">CH4 (Methane):</span>
                        <strong className="text-emerald-400 text-sm">1.82 ppm (Clean)</strong>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#151518] border border-white/5">
                        <span className="text-white/40 block">CO2 Ambient:</span>
                        <strong className="text-[#e2e2e2] text-sm">418 ppm</strong>
                      </div>
                    </div>
                  </div>
                )}

                {selectedPlugin.type === 'MAGNETOMETER' && (
                  <div className="space-y-2 font-mono text-xs">
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2.5 rounded-lg bg-[#151518] border border-white/5">
                        <span className="text-white/40 block">Total Magnetic Field:</span>
                        <strong className="text-sky-400 text-sm">48,920 nT</strong>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#151518] border border-white/5">
                        <span className="text-white/40 block">Gradient Delta (dX):</span>
                        <strong className="text-[#e2e2e2] text-sm">0.04 nT/m</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* Driver Cryptographic Attestation */}
                <div className="p-2.5 rounded-lg bg-[#151518] border border-white/5 text-[10px] font-mono text-white/40 flex items-center justify-between">
                  <span>Cryptographic Fingerprint:</span>
                  <span className="text-white/70 font-semibold">{selectedPlugin.encryptionKeyFingerprint}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-white/30 py-12 font-mono text-xs">
              Select a sensor plugin to inspect hardware bus diagnostics
            </div>
          )}
        </div>
      </div>

      {/* Install New Sensor Plugin Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#151518] border border-white/10 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-sky-400" />
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">
                  Register New Sensor Payload Driver
                </h3>
              </div>
              <button
                onClick={() => setShowInstallModal(false)}
                className="text-white/40 hover:text-white font-mono text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleInstallSubmit} className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-white/70 block mb-1">Sensor Driver Name:</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Ouster OS1-128 LiDAR or Sonar Array"
                  value={newPluginName}
                  onChange={(e) => setNewPluginName(e.target.value)}
                  className="w-full bg-[#0d0d0f] border border-white/10 rounded-lg px-3 py-1.5 text-white focus:border-sky-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/70 block mb-1">Sensor Modality:</label>
                  <select 
                    value={newPluginType}
                    onChange={(e) => setNewPluginType(e.target.value as SensorType)}
                    className="w-full bg-[#0d0d0f] border border-white/10 rounded-lg px-2.5 py-1.5 text-white focus:border-sky-500 outline-none"
                  >
                    <option value="LIDAR">3D LiDAR Laser</option>
                    <option value="THERMAL">Thermal Infrared Radiometer</option>
                    <option value="RADAR">77GHz mmWave Radar</option>
                    <option value="MULTISPECTRAL">Multispectral / NDVI</option>
                    <option value="GAS_SNIFFER">VOC / Gas Probe</option>
                    <option value="MAGNETOMETER">Subsurface Fluxgate</option>
                  </select>
                </div>

                <div>
                  <label className="text-white/70 block mb-1">Physical Bus Interface:</label>
                  <select 
                    value={newPluginBus}
                    onChange={(e) => setNewPluginBus(e.target.value as any)}
                    className="w-full bg-[#0d0d0f] border border-white/10 rounded-lg px-2.5 py-1.5 text-white focus:border-sky-500 outline-none"
                  >
                    <option value="USB_3">USB 3.1 Gen 2</option>
                    <option value="ETHERNET_MII">Gigabit Ethernet MII</option>
                    <option value="CAN_1">CAN-FD 2.0B</option>
                    <option value="SPI_0">High-Speed SPI</option>
                    <option value="I2C_2">I2C Fast Mode Plus</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-white/70 block mb-1">Rate (Hz):</label>
                  <input 
                    type="number" 
                    value={newPluginHz}
                    onChange={(e) => setNewPluginHz(Number(e.target.value))}
                    className="w-full bg-[#0d0d0f] border border-white/10 rounded-lg px-2.5 py-1.5 text-white focus:border-sky-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-white/70 block mb-1">Power (W):</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={newPluginWatts}
                    onChange={(e) => setNewPluginWatts(Number(e.target.value))}
                    className="w-full bg-[#0d0d0f] border border-white/10 rounded-lg px-2.5 py-1.5 text-white focus:border-sky-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-white/70 block mb-1">Weight (g):</label>
                  <input 
                    type="number" 
                    value={newPluginWeight}
                    onChange={(e) => setNewPluginWeight(Number(e.target.value))}
                    className="w-full bg-[#0d0d0f] border border-white/10 rounded-lg px-2.5 py-1.5 text-white focus:border-sky-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-white/70 block mb-1">Description / Mission Profile:</label>
                <textarea 
                  rows={2}
                  placeholder="Payload mission purpose and operating constraints..."
                  value={newPluginDesc}
                  onChange={(e) => setNewPluginDesc(e.target.value)}
                  className="w-full bg-[#0d0d0f] border border-white/10 rounded-lg px-3 py-1.5 text-white focus:border-sky-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInstallModal(false)}
                  className="px-3.5 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 text-xs font-semibold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(14,165,233,0.3)]"
                >
                  Mount & Initialize Driver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

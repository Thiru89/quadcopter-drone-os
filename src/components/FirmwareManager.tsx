import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Download, 
  FileCode, 
  Terminal, 
  Copy, 
  Check, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  ExternalLink,
  ChevronRight,
  Code2,
  HardDrive,
  Zap,
  Radio,
  Sliders
} from 'lucide-react';

interface FirmwareFile {
  path: string;
  name: string;
  content: string;
}

export const FirmwareManager: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'code' | 'pinout' | 'flash'>('code');
  const [selectedTarget, setSelectedTarget] = useState<'STM32H743VIT6' | 'ESP32-S3' | 'STM32F411CE'>('STM32H743VIT6');
  const [firmwareFiles, setFirmwareFiles] = useState<FirmwareFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('src/main.c');
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);

  // Fetch files from server API
  useEffect(() => {
    const loadFiles = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/firmware/files');
        if (res.ok) {
          const data = await res.json();
          if (data.files && data.files.length > 0) {
            setFirmwareFiles(data.files);
            // Default select main.c if present
            const hasMain = data.files.find((f: any) => f.path === 'src/main.c');
            if (hasMain) setSelectedFile('src/main.c');
            else setSelectedFile(data.files[0].path);
          }
        }
      } catch (e) {
        console.error('Failed to load firmware files:', e);
      } finally {
        setLoading(false);
      }
    };

    loadFiles();
  }, []);

  const handleCopyCode = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = () => {
    setDownloading(true);
    const link = document.createElement('a');
    link.href = '/api/firmware/download';
    link.download = 'qpos-mcu-firmware-v2.4.0.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setDownloading(false), 1500);
  };

  const activeContent = firmwareFiles.find(f => f.path === selectedFile)?.content || '// File not found';

  return (
    <div className="space-y-4 text-[#e2e2e2]">
      {/* Top Banner */}
      <div className="bg-[#151518] border border-white/5 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-sky-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">
                Microcontroller Flight Firmware Kernel (Bare-Metal / FreeRTOS)
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest">
                v2.4.0 Production Release
              </span>
            </div>
            <p className="text-xs text-white/40 font-mono mt-0.5">
              800Hz Deterministic Flight Loop • DShot600 Digital ESC • 420kbaud CRSF • 12S Smart BMS
            </p>
          </div>
        </div>

        {/* Target Selector & Download Action */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#0d0d0f] border border-white/10 rounded-lg p-1 text-xs font-mono">
            {(['STM32H743VIT6', 'ESP32-S3', 'STM32F411CE'] as const).map(target => (
              <button
                key={target}
                onClick={() => setSelectedTarget(target)}
                className={`px-3 py-1 rounded-md text-[11px] font-semibold transition uppercase tracking-wider cursor-pointer ${
                  selectedTarget === target
                    ? 'bg-sky-500 text-black font-bold shadow-[0_0_10px_rgba(14,165,233,0.3)]'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                {target}
              </button>
            ))}
          </div>

          <button
            onClick={handleDownloadZip}
            disabled={downloading}
            className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs uppercase tracking-wider transition flex items-center gap-2 shadow-[0_0_15px_rgba(14,165,233,0.3)] cursor-pointer"
          >
            <Download className="w-4 h-4" />
            {downloading ? 'PACKAGING ZIP...' : 'DOWNLOAD FIRMWARE (.ZIP)'}
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-white/5 pb-2">
        <button
          onClick={() => setActiveSubTab('code')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'code'
              ? 'bg-white/10 text-sky-400 border border-white/10'
              : 'text-white/50 hover:text-white hover:bg-white/5'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          C/C++ Source Code Explorer ({firmwareFiles.length} Files)
        </button>

        <button
          onClick={() => setActiveSubTab('pinout')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'pinout'
              ? 'bg-white/10 text-sky-400 border border-white/10'
              : 'text-white/50 hover:text-white hover:bg-white/5'
          }`}
        >
          <HardDrive className="w-3.5 h-3.5" />
          Hardware Wiring & Pinout Matrix
        </button>

        <button
          onClick={() => setActiveSubTab('flash')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'flash'
              ? 'bg-white/10 text-sky-400 border border-white/10'
              : 'text-white/50 hover:text-white hover:bg-white/5'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          Flashing Toolchain & Pre-Flight Bench Checklist
        </button>
      </div>

      {/* SUBTAB 1: C/C++ CODE EXPLORER */}
      {activeSubTab === 'code' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* File Tree (Left 3 cols) */}
          <div className="lg:col-span-3 bg-[#151518] border border-white/5 rounded-xl p-3 space-y-1 font-mono text-xs shadow-md">
            <span className="text-[10px] text-white/40 uppercase tracking-widest px-2 py-1 block border-b border-white/5 mb-2">
              Firmware Project Tree
            </span>

            {loading ? (
              <div className="p-4 text-center text-white/30 text-xs">Loading firmware tree...</div>
            ) : (
              <div className="space-y-0.5 max-h-[580px] overflow-y-auto scrollbar-thin">
                {firmwareFiles.map((file) => {
                  const isSelected = selectedFile === file.path;
                  const isHeader = file.name.endsWith('.h');
                  const isC = file.name.endsWith('.c');
                  const isConfig = file.name.endsWith('.ini') || file.name.endsWith('.txt') || file.name === 'Makefile';

                  return (
                    <button
                      key={file.path}
                      onClick={() => setSelectedFile(file.path)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-[11px] transition cursor-pointer ${
                        isSelected
                          ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30 font-semibold'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <FileCode className={`w-3.5 h-3.5 shrink-0 ${
                          isC ? 'text-sky-400' : isHeader ? 'text-emerald-400' : isConfig ? 'text-amber-400' : 'text-purple-400'
                        }`} />
                        <span className="truncate">{file.path}</span>
                      </div>
                      <ChevronRight className={`w-3 h-3 shrink-0 ${isSelected ? 'opacity-100 text-sky-400' : 'opacity-0'}`} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Code Viewer (Right 9 cols) */}
          <div className="lg:col-span-9 bg-[#151518] border border-white/5 rounded-xl p-4 space-y-2 shadow-lg font-mono">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-semibold text-[#e2e2e2]">{selectedFile}</span>
                <span className="text-[10px] text-white/40">
                  ({activeContent.split('\n').length} lines • {activeContent.length} bytes)
                </span>
              </div>

              <button
                onClick={() => handleCopyCode(activeContent)}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'COPIED' : 'COPY FILE'}
              </button>
            </div>

            {/* Code Display Window */}
            <div className="bg-[#050505] rounded-xl p-3 border border-white/10 text-[11px] leading-relaxed overflow-x-auto max-h-[550px] overflow-y-auto scrollbar-thin text-[#d1d5db]">
              <pre className="font-mono">
                {activeContent.split('\n').map((line, idx) => (
                  <div key={idx} className="flex">
                    <span className="w-10 select-none text-white/20 text-right pr-3 shrink-0">
                      {idx + 1}
                    </span>
                    <span className={
                      line.startsWith('#include') ? 'text-sky-300' :
                      line.startsWith('/*') || line.startsWith(' *') || line.startsWith('//') ? 'text-white/40 italic' :
                      line.includes('typedef') || line.includes('struct') || line.includes('void') || line.includes('float') || line.includes('bool') || line.includes('uint16_t') ? 'text-emerald-300' :
                      line.includes('return') || line.includes('if') || line.includes('else') || line.includes('for') ? 'text-amber-300' :
                      'text-[#e2e2e2]'
                    }>
                      {line || '\n'}
                    </span>
                  </div>
                ))}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: HARDWARE WIRING & PINOUT MATRIX */}
      {activeSubTab === 'pinout' && (
        <div className="space-y-4 font-mono text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* STM32H743 Table */}
            <div className="bg-[#151518] border border-white/5 rounded-xl p-4 space-y-3 shadow-lg">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_6px_rgba(14,165,233,0.8)]" />
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">
                    STM32H743VIT6 Pinout Map (Primary Flight MCU)
                  </h3>
                </div>
                <span className="text-[10px] text-sky-400">480 MHz ARM Cortex-M7</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-white/40">
                      <th className="py-1.5 px-2">Subsystem</th>
                      <th className="py-1.5 px-2">Signal</th>
                      <th className="py-1.5 px-2">Pin</th>
                      <th className="py-1.5 px-2">Hardware Peripheral</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-white/80">
                    <tr><td className="py-1 px-2 text-sky-400 font-semibold">Motor 1 (FL)</td><td className="py-1 px-2">DSHOT_M1</td><td className="py-1 px-2 text-emerald-300">PA8</td><td className="py-1 px-2 text-white/50">TIM1_CH1 (DMA2 Stream 6)</td></tr>
                    <tr><td className="py-1 px-2 text-sky-400 font-semibold">Motor 2 (FR)</td><td className="py-1 px-2">DSHOT_M2</td><td className="py-1 px-2 text-emerald-300">PA9</td><td className="py-1 px-2 text-white/50">TIM1_CH2 (DMA2 Stream 2)</td></tr>
                    <tr><td className="py-1 px-2 text-sky-400 font-semibold">Motor 3 (RR)</td><td className="py-1 px-2">DSHOT_M3</td><td className="py-1 px-2 text-emerald-300">PA10</td><td className="py-1 px-2 text-white/50">TIM1_CH3 (DMA2 Stream 1)</td></tr>
                    <tr><td className="py-1 px-2 text-sky-400 font-semibold">Motor 4 (RL)</td><td className="py-1 px-2">DSHOT_M4</td><td className="py-1 px-2 text-emerald-300">PA11</td><td className="py-1 px-2 text-white/50">TIM1_CH4 (DMA2 Stream 4)</td></tr>
                    <tr><td className="py-1 px-2 text-amber-400 font-semibold">IMU SPI1</td><td className="py-1 px-2">SCK / MISO / MOSI</td><td className="py-1 px-2 text-emerald-300">PA5 / PA6 / PB5</td><td className="py-1 px-2 text-white/50">SPI1 (24 MHz DMA Burst)</td></tr>
                    <tr><td className="py-1 px-2 text-amber-400 font-semibold">IMU Select/INT</td><td className="py-1 px-2">CS / INT1</td><td className="py-1 px-2 text-emerald-300">PD14 / PC4</td><td className="py-1 px-2 text-white/50">GPIO Out / EXTI4 (800Hz Trigger)</td></tr>
                    <tr><td className="py-1 px-2 text-purple-400 font-semibold">RC Receiver</td><td className="py-1 px-2">CRSF RX / TX</td><td className="py-1 px-2 text-emerald-300">PD2 / PC12</td><td className="py-1 px-2 text-white/50">UART5 (420 kbaud ExpressLRS)</td></tr>
                    <tr><td className="py-1 px-2 text-purple-400 font-semibold">GCS Telem Link</td><td className="py-1 px-2">TELEM TX / RX</td><td className="py-1 px-2 text-emerald-300">PA2 / PA3</td><td className="py-1 px-2 text-white/50">USART2 (921,600 baud Stream)</td></tr>
                    <tr><td className="py-1 px-2 text-rose-400 font-semibold">12S BMS ADC</td><td className="py-1 px-2">VOLT / CURRENT</td><td className="py-1 px-2 text-emerald-300">PC0 / PC1</td><td className="py-1 px-2 text-white/50">ADC1_INP10 & ADC1_INP11</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* ESP32-S3 Table */}
            <div className="bg-[#151518] border border-white/5 rounded-xl p-4 space-y-3 shadow-lg">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">
                    ESP32-S3 Pinout Map (Companion / Lightweight FC)
                  </h3>
                </div>
                <span className="text-[10px] text-emerald-400">240 MHz Dual-Core Xtensa</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-white/40">
                      <th className="py-1.5 px-2">Subsystem</th>
                      <th className="py-1.5 px-2">Signal</th>
                      <th className="py-1.5 px-2">ESP32 Pin</th>
                      <th className="py-1.5 px-2">Peripheral</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-white/80">
                    <tr><td className="py-1 px-2 text-sky-400 font-semibold">Motor 1 (FL)</td><td className="py-1 px-2">DSHOT_M1</td><td className="py-1 px-2 text-emerald-300">GPIO 4</td><td className="py-1 px-2 text-white/50">RMT Channel 0 (DShot600)</td></tr>
                    <tr><td className="py-1 px-2 text-sky-400 font-semibold">Motor 2 (FR)</td><td className="py-1 px-2">DSHOT_M2</td><td className="py-1 px-2 text-emerald-300">GPIO 5</td><td className="py-1 px-2 text-white/50">RMT Channel 1 (DShot600)</td></tr>
                    <tr><td className="py-1 px-2 text-sky-400 font-semibold">Motor 3 (RR)</td><td className="py-1 px-2">DSHOT_M3</td><td className="py-1 px-2 text-emerald-300">GPIO 6</td><td className="py-1 px-2 text-white/50">RMT Channel 2 (DShot600)</td></tr>
                    <tr><td className="py-1 px-2 text-sky-400 font-semibold">Motor 4 (RL)</td><td className="py-1 px-2">DSHOT_M4</td><td className="py-1 px-2 text-emerald-300">GPIO 7</td><td className="py-1 px-2 text-white/50">RMT Channel 3 (DShot600)</td></tr>
                    <tr><td className="py-1 px-2 text-amber-400 font-semibold">IMU SPI2</td><td className="py-1 px-2">SCK / MISO / MOSI</td><td className="py-1 px-2 text-emerald-300">GPIO 12/13/11</td><td className="py-1 px-2 text-white/50">FSPI (20 MHz)</td></tr>
                    <tr><td className="py-1 px-2 text-amber-400 font-semibold">IMU CS / INT</td><td className="py-1 px-2">CS / INT1</td><td className="py-1 px-2 text-emerald-300">GPIO 10 / 9</td><td className="py-1 px-2 text-white/50">GPIO Output / GPIO Interrupt</td></tr>
                    <tr><td className="py-1 px-2 text-purple-400 font-semibold">RC Receiver</td><td className="py-1 px-2">CRSF RX / TX</td><td className="py-1 px-2 text-emerald-300">GPIO 18 / 17</td><td className="py-1 px-2 text-white/50">UART1 (420 kbaud)</td></tr>
                    <tr><td className="py-1 px-2 text-purple-400 font-semibold">GCS Telem Link</td><td className="py-1 px-2">USB CDC / UART0</td><td className="py-1 px-2 text-emerald-300">GPIO 43 / 44</td><td className="py-1 px-2 text-white/50">Native USB-Serial (921,600 baud)</td></tr>
                    <tr><td className="py-1 px-2 text-rose-400 font-semibold">12S BMS ADC</td><td className="py-1 px-2">VOLT / CURRENT</td><td className="py-1 px-2 text-emerald-300">GPIO 8 / 14</td><td className="py-1 px-2 text-white/50">ADC1 Channel 7 / 6</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Quadrapuller Airframe Puller Geometry Banner */}
          <div className="bg-[#151518] border border-white/5 rounded-xl p-4 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">
              Quadrapuller Geometry & Motor Tilt Decoupling (2.5° Outward)
            </h3>
            <p className="text-xs text-white/70 leading-relaxed">
              Unlike push-propeller drones where the airframe tilts into the wind causing camera horizon tilt, the 
              <strong> Quadrapuller Tractor Configuration</strong> mounts all four motors facing upward and tilted 
              <strong> 2.5° outward</strong>. By altering differential rotor thrust, the firmware delivers immediate 
              lateral pull force while maintaining an exactly flat camera gimbal horizon for precision photogrammetry.
            </p>
          </div>
        </div>
      )}

      {/* SUBTAB 3: FLASHING TOOLCHAIN & BENCH TEST GUIDE */}
      {activeSubTab === 'flash' && (
        <div className="space-y-4 font-mono text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Step 1: Toolchain Build */}
            <div className="bg-[#151518] border border-white/5 rounded-xl p-4 space-y-3 shadow-lg">
              <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                <Terminal className="w-4 h-4 text-sky-400" />
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">
                  1. One-Click Compile & Flash Commands
                </h3>
              </div>

              <div className="space-y-2 text-[11px]">
                <p className="text-white/70">
                  Using <strong>PlatformIO IDE</strong> (Visual Studio Code):
                </p>
                <div className="p-2.5 bg-[#050505] rounded-lg border border-white/10 text-emerald-400">
                  <code>pio run -e stm32h743vit6 --target upload</code>
                </div>

                <p className="text-white/70 pt-2">
                  Using <strong>ST-Link CLI</strong> (Linux / macOS):
                </p>
                <div className="p-2.5 bg-[#050505] rounded-lg border border-white/10 text-emerald-400">
                  <code>st-flash write build/qpos_firmware.bin 0x08000000</code>
                </div>

                <p className="text-white/70 pt-2">
                  Using <strong>USB DFU Bootloader</strong> (via dfu-util):
                </p>
                <div className="p-2.5 bg-[#050505] rounded-lg border border-white/10 text-emerald-400">
                  <code>dfu-util -a 0 -s 0x08000000:leave -D build/qpos_firmware.bin</code>
                </div>
              </div>
            </div>

            {/* Step 2: 5-Point Safety Bench Test */}
            <div className="bg-[#151518] border border-white/5 rounded-xl p-4 space-y-3 shadow-lg">
              <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">
                  2. Pre-Flight Bench Verification Checklist
                </h3>
              </div>

              <div className="space-y-2 text-[11px] text-white/80">
                <div className="flex items-start gap-2 p-2 rounded-lg bg-[#0d0d0f] border border-white/5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">1. Remove Propellers First</strong>
                    <p className="text-[10px] text-white/40">Never attach carbon fiber propellers until bench calibration is complete.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-2 rounded-lg bg-[#0d0d0f] border border-white/5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">2. Stationary Gyro Calibration</strong>
                    <p className="text-[10px] text-white/40">Keep drone stationary on a flat table for 1.5s after power-on while IMU samples 1000 zero-rate points.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-2 rounded-lg bg-[#0d0d0f] border border-white/5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">3. Verify 3D Horizon Tracking</strong>
                    <p className="text-[10px] text-white/40">Open QPOS Cockpit HUD; pitch and roll the airframe to verify artificial horizon mirrors exact movement.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-2 rounded-lg bg-[#0d0d0f] border border-white/5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">4. Test Radio Failsafe Watchdog</strong>
                    <p className="text-[10px] text-white/40">Turn off your radio transmitter; verify that the GCS indicates "FAILSAFE" and initiates auto-RTL.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-2 rounded-lg bg-[#0d0d0f] border border-white/5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">5. Check Tractor Rotor Rotations</strong>
                    <p className="text-[10px] text-white/40">M1 (FL) & M3 (RR) rotate CCW; M2 (FR) & M4 (RL) rotate CW.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

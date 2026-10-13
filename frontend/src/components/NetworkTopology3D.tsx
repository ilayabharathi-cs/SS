import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import { Box, RefreshCw, ShieldAlert, BrainCircuit, CheckCircle2, AlertCircle } from 'lucide-react';
import type { DeviceSummary, DeviceDetail, SecurityAlert, AnomalyEvent } from '../types';
import { DeviceDetailModal } from './DeviceDetailModal';

interface NetworkTopology3DProps {
  devices: DeviceSummary[];
  activeDevice: DeviceDetail | null;
  alerts: SecurityAlert[];
  anomalies: AnomalyEvent[];
}

// Gateway Router Central Node Component
const GatewayNode: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.5;
    if (ringRef.current) ringRef.current.rotation.z -= delta * 0.8;
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Central Octahedron Core */}
      <mesh ref={meshRef}>
        <octahedronGeometry args={[0.8, 0]} />
        <meshStandardMaterial color="#06b6d4" roughness={0.2} metalness={0.8} emissive="#0891b2" emissiveIntensity={0.6} />
      </mesh>

      {/* Rotating Outer Ring */}
      <mesh ref={ringRef}>
        <ringGeometry args={[1.1, 1.2, 32]} />
        <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} transparent opacity={0.7} />
      </mesh>

      {/* Gateway Label */}
      <Html position={[0, 1.4, 0]} center distanceFactor={12}>
        <div className="bg-slate-900/90 border border-cyan-500/50 px-2.5 py-1 rounded-md text-[10px] font-mono text-cyan-300 shadow-lg backdrop-blur-md whitespace-nowrap">
          Gateway (192.168.43.1)
        </div>
      </Html>
    </group>
  );
};

// IoT Device Node Component
interface DeviceNodeProps {
  id: string;
  ip: string;
  status: string;
  isTrusted: boolean;
  position: [number, number, number];
  hasAlert: boolean;
  hasAnomaly: boolean;
  onSelect: () => void;
}

const DeviceNode: React.FC<DeviceNodeProps> = ({
  id,
  ip,
  status,
  isTrusted,
  position,
  hasAlert,
  hasAnomaly,
  onSelect,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const isOnline = status.toLowerCase() === 'online';

  // State colors: Green = Trusted Normal, Yellow/Amber = Unknown/Untrusted, Red = Security Attack Alert
  let color = isOnline ? (isTrusted ? '#10b981' : '#f59e0b') : '#64748b';
  if (hasAlert) color = '#ef4444';
  if (hasAnomaly) color = '#a855f7';

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
      if (hasAlert || hasAnomaly || !isTrusted) {
        const scale = 1 + Math.sin(state.clock.getElapsedTime() * 4) * 0.08;
        meshRef.current.scale.set(scale, scale, scale);
      }
    }
  });

  return (
    <group position={position}>
      {/* Device Sphere Mesh */}
      <mesh ref={meshRef} onClick={onSelect}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial
          color={color}
          roughness={0.3}
          metalness={0.5}
          emissive={color}
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Alert Pulsing Ring */}
      {hasAlert && (
        <mesh>
          <ringGeometry args={[0.7, 0.8, 32]} />
          <meshBasicMaterial color="#ef4444" side={THREE.DoubleSide} transparent opacity={0.8} />
        </mesh>
      )}

      {/* Anomaly Pulsing Ring */}
      {hasAnomaly && (
        <mesh>
          <ringGeometry args={[0.85, 0.95, 32]} />
          <meshBasicMaterial color="#a855f7" side={THREE.DoubleSide} transparent opacity={0.8} />
        </mesh>
      )}

      {/* Untrusted Yellow Glow Ring */}
      {!isTrusted && !hasAlert && !hasAnomaly && (
        <mesh>
          <ringGeometry args={[0.65, 0.75, 32]} />
          <meshBasicMaterial color="#f59e0b" side={THREE.DoubleSide} transparent opacity={0.7} />
        </mesh>
      )}

      {/* 3D Label */}
      <Html position={[0, 0.9, 0]} center distanceFactor={12}>
        <div
          onClick={onSelect}
          className="bg-slate-900/90 border border-slate-700 hover:border-cyan-400 px-2.5 py-1 rounded-md text-[10px] text-slate-200 font-mono shadow-lg backdrop-blur-md cursor-pointer flex items-center gap-1.5 whitespace-nowrap transition-colors"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              hasAlert
                ? 'bg-rose-500 animate-ping'
                : hasAnomaly
                ? 'bg-purple-400 animate-ping'
                : !isTrusted
                ? 'bg-amber-400 animate-pulse'
                : isOnline
                ? 'bg-emerald-400'
                : 'bg-slate-500'
            }`}
          ></span>
          <span>{id}</span>
          <span className="text-slate-400">({ip})</span>
        </div>
      </Html>
    </group>
  );
};

export const NetworkTopology3D: React.FC<NetworkTopology3DProps> = ({
  devices,
  activeDevice,
  alerts,
  anomalies,
}) => {
  const [selectedDevice, setSelectedDevice] = useState<DeviceDetail | null>(null);
  const controlsRef = useRef<any>(null);

  const resetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  // Calculate 3D radial positions for device nodes around Gateway (0,0,0)
  const nodePositions = devices.map((dev, idx) => {
    const angle = (idx / Math.max(1, devices.length)) * Math.PI * 2;
    const radius = 3.5;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = Math.sin(idx * 1.5) * 0.5;

    const hasAlert = alerts.some(a => a.source_ip === dev.ip || a.destination_ip === dev.ip);
    const hasAnomaly = anomalies.some(a => a.device_id === dev.device_id && a.is_anomaly);

    return {
      ...dev,
      position: [x, y, z] as [number, number, number],
      hasAlert,
      hasAnomaly,
    };
  });

  return (
    <div className="glass-panel p-5 rounded-xl border border-slate-800 mb-6 flex flex-col">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Box className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-bold text-white">3D SmartShield Network Topology</h2>
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">(Interactive R3F Scene)</span>
        </div>

        <button
          onClick={resetCamera}
          className="px-3 py-1.5 text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 active:scale-95"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Reset Camera
        </button>
      </div>

      {/* 3D Canvas Area */}
      <div className="w-full h-[420px] bg-slate-950/80 rounded-xl overflow-hidden border border-slate-800 relative">
        {devices.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-xs">
            Network topology data unavailable. No active devices connected.
          </div>
        ) : (
          <Canvas camera={{ position: [0, 4, 7], fov: 50 }}>
            <ambientLight intensity={0.6} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <directionalLight position={[-5, 5, 5]} intensity={0.8} />

            <OrbitControls ref={controlsRef} enablePan enableZoom enableRotate maxPolarAngle={Math.PI / 2.1} />

            {/* Central Gateway */}
            <GatewayNode />

            {/* Device Nodes & Connecting Edges */}
            {nodePositions.map((dev) => (
              <React.Fragment key={dev.device_id}>
                {/* Connecting Line to Gateway */}
                <Line
                  points={[[0, 0, 0], dev.position]}
                  color={dev.hasAnomaly ? '#a855f7' : dev.hasAlert ? '#f97316' : '#0891b2'}
                  lineWidth={1.5}
                  dashed={dev.hasAlert || dev.hasAnomaly}
                />

                {/* Device Mesh */}
                <DeviceNode
                  id={dev.device_id}
                  ip={dev.ip}
                  status={dev.status}
                  isTrusted={dev.is_trusted}
                  position={dev.position}
                  hasAlert={dev.hasAlert}
                  hasAnomaly={dev.hasAnomaly}
                  onSelect={() => setSelectedDevice(activeDevice || null)}
                />
              </React.Fragment>
            ))}
          </Canvas>
        )}

        {/* Legend Bar */}
        <div className="absolute bottom-3 left-3 bg-slate-900/90 border border-slate-800 px-3 py-2 rounded-lg text-[11px] text-slate-300 flex flex-wrap items-center gap-4 backdrop-blur-md">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Online
          </span>
          <span className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" /> Offline
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" /> Snort Alert
          </span>
          <span className="flex items-center gap-1.5">
            <BrainCircuit className="w-3.5 h-3.5 text-purple-400" /> AI Anomaly
          </span>
        </div>
      </div>

      {/* Selected Node Details Modal */}
      {selectedDevice && (
        <DeviceDetailModal
          device={selectedDevice}
          alerts={alerts}
          anomalies={anomalies}
          onClose={() => setSelectedDevice(null)}
        />
      )}
    </div>
  );
};

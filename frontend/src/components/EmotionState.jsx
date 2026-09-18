import React from 'react';
import { Activity, Sparkles, Zap, Target, Coffee, Smile } from 'lucide-react';
import { CountUp } from './CountUp';

export const EmotionState = ({ 
  level = 85, 
  label = "Tập trung cao độ", 
  emoji = "🎯", 
  tag = "#DeepWork",
  onChangeLevel 
}) => {
  // Preset emotion steps along the vertical bar
  const emotionPresets = [
    { value: 95, label: "Hứng khởi & Sáng tạo", emoji: "⚡", icon: Zap, tag: "#Breakthrough" },
    { value: 80, label: "Tập trung cao độ", emoji: "🎯", icon: Target, tag: "#DeepWork" },
    { value: 55, label: "Điềm tĩnh & Kiên định", emoji: "☕", icon: Coffee, tag: "#CalmMind" },
    { value: 30, label: "Thư thái & Cân bằng", emoji: "😌", icon: Smile, tag: "#Peaceful" },
  ];

  return (
    <div className="glass-card p-3 sm:p-3.5 rounded-3xl shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between h-full border border-slate-200 dark:border-slate-700 relative overflow-hidden select-none">
      
      {/* Widget Header */}
      <div className="flex items-center justify-between gap-1 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="p-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 shrink-0">
            <Activity className="w-3.5 h-3.5" />
          </div>
          <div className="truncate">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 tracking-tight truncate">
              Emotion State
            </h3>
          </div>
        </div>

        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/40 shrink-0">
          Vibe
        </span>
      </div>

      {/* Central Section: Vertical Emotion Bar (Thanh dọc chỉ cảm xúc) */}
      <div className="flex items-center justify-center gap-2 sm:gap-3 py-1 flex-1 min-h-[140px]">
        
        {/* Left Markers (Emoji & Quick Level Triggers) */}
        <div className="flex flex-col justify-between h-36 sm:h-40 py-0.5 text-xs text-slate-400 dark:text-slate-500">
          {emotionPresets.map((preset) => {
            const isCurrent = level > 0 && Math.abs(level - preset.value) < 15;
            return (
              <button
                key={preset.value}
                onClick={() => onChangeLevel && onChangeLevel(preset.value, preset.label, preset.emoji, preset.tag)}
                className={`transition-all duration-200 p-0.5 rounded-md hover:scale-125 cursor-pointer flex items-center gap-1 ${
                  isCurrent ? 'scale-110 font-bold opacity-100' : 'opacity-40 hover:opacity-80'
                }`}
                title={`${preset.value}% - ${preset.label}`}
              >
                <span className="text-xs">{preset.emoji}</span>
              </button>
            );
          })}
        </div>

        {/* The Vertical Bar Track (Thanh dọc) */}
        <div 
          onClick={(e) => {
            if (!onChangeLevel) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const clickY = e.clientY - rect.top;
            const height = rect.height;
            const percent = Math.max(0, Math.min(100, Math.round(((height - clickY) / height) * 100)));
            if (percent <= 10) {
              onChangeLevel(0, "Chưa có cảm xúc", "—", "");
              return;
            }
            const closest = emotionPresets.reduce((prev, curr) => 
              Math.abs(curr.value - percent) < Math.abs(prev.value - percent) ? curr : prev
            );
            onChangeLevel(closest.value, closest.label, closest.emoji, closest.tag);
          }}
          className="relative w-3.5 sm:w-4 h-36 sm:h-40 bg-slate-100 dark:bg-slate-700 rounded-full p-0.5 border border-slate-200 dark:border-slate-600 shadow-inner flex flex-col justify-end cursor-pointer group/bar"
          title="Nhấp để điều chỉnh mức độ cảm xúc"
        >
          {/* Inner clipping container for filled gradient & tick marks */}
          <div className="absolute inset-0 rounded-full overflow-hidden p-0.5 flex flex-col justify-end pointer-events-none">
            {/* Subtle horizontal tick markers on track */}
            <div className="absolute inset-0 flex flex-col justify-between py-2 px-0.5 pointer-events-none opacity-25">
              <div className="w-full h-px bg-slate-400 dark:bg-slate-500" />
              <div className="w-full h-px bg-slate-400 dark:bg-slate-500" />
              <div className="w-full h-px bg-slate-400 dark:bg-slate-500" />
              <div className="w-full h-px bg-slate-400 dark:bg-slate-500" />
            </div>

            {/* Filled gradient bar */}
            <div
              className="w-full rounded-full bg-gradient-to-t from-blue-600 via-sky-400 to-cyan-300 transition-all duration-500 ease-out shadow-xs"
              style={{ height: `${level}%` }}
            />
          </div>

          {/* Glowing knob / indicator: positioned on top with z-20, clamped so it never cuts off */}
          <div
            className={`absolute left-1/2 -translate-x-1/2 rounded-full border-2 transition-all duration-500 z-20 pointer-events-none shadow-md ${
              level > 0
                ? 'w-3.5 h-3.5 bg-white dark:bg-slate-200 border-blue-600 group-hover/bar:scale-125 ring-2 ring-blue-400/30'
                : 'w-2.5 h-2.5 bg-slate-300 dark:bg-slate-500 border-slate-400 opacity-60'
            }`}
            style={{
              bottom: level > 0 
                ? `calc(${Math.min(94, Math.max(6, level))}% - 7px)`
                : '2px'
            }}
          />
        </div>

        {/* Right Scale Percentages */}
        <div className="flex flex-col justify-between h-36 sm:h-40 py-1 text-[9px] font-semibold text-slate-400 dark:text-slate-500 select-none">
          <span className={level >= 90 ? 'text-blue-600 dark:text-blue-400 font-bold' : ''}>100%</span>
          <span className={level >= 70 && level < 90 ? 'text-blue-600 dark:text-blue-400 font-bold' : ''}>75%</span>
          <span className={level >= 45 && level < 70 ? 'text-blue-600 dark:text-blue-400 font-bold' : ''}>50%</span>
          <span className={level >= 15 && level < 45 ? 'text-blue-600 dark:text-blue-400 font-bold' : ''}>25%</span>
        </div>

      </div>

      {/* Bottom Emotion Readout */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex flex-col gap-0.5 text-center min-h-[44px] justify-center">
        <div className="flex items-center justify-center gap-1.5">
          <span className="text-sm">{emoji || "—"}</span>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
            {label || "Chưa có cảm xúc"}
          </span>
        </div>
        
        <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
          <span className={level > 0 ? "text-blue-600 dark:text-blue-400 font-bold" : "text-slate-400 dark:text-slate-500 font-bold"}>{level}%</span>
          {tag ? (
            <>
              <span>•</span>
              <span className="text-slate-500 dark:text-slate-400 font-semibold">{tag}</span>
            </>
          ) : null}
        </div>
      </div>

    </div>
  );
};



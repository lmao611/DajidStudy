import React from 'react';
import { Heart, Sparkles, Terminal, Code } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="mt-20 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 backdrop-blur-xs py-8 text-slate-500 dark:text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 flex items-center justify-center font-bold text-xs">
            D
          </div>
          <span className="font-semibold text-slate-800 dark:text-slate-200">DajidStudy Platform</span>
          <span className="text-slate-300 dark:text-slate-600">•</span>
          <span>Không gian Cá nhân & Học tập</span>
        </div>

        <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <Code className="w-3.5 h-3.5 text-blue-500" />
            <span>React + Tailwind</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Terminal className="w-3.5 h-3.5 text-emerald-500" />
            <span>Express Ready</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> for lifelong learning
          </span>
        </div>

      </div>
    </footer>
  );
};

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings as SettingsIcon, X, Palette } from 'lucide-react';

const themes = [
  { name: 'Ocean Blue', primary: '#3b82f6', secondary: '#1e40af', accent: '#60a5fa', rgb: '59, 130, 246' },
  { name: 'Forest Green', primary: '#10b981', secondary: '#065f46', accent: '#34d399', rgb: '16, 185, 129' },
  { name: 'Sunset Orange', primary: '#f97316', secondary: '#c2410c', accent: '#fb923c', rgb: '249, 115, 22' },
  { name: 'Purple Dream', primary: '#a855f7', secondary: '#6b21a8', accent: '#c084fc', rgb: '168, 85, 247' },
  { name: 'Rose Pink', primary: '#ec4899', secondary: '#9f1239', accent: '#f472b6', rgb: '236, 72, 153' },
  { name: 'Slate Gray', primary: '#64748b', secondary: '#334155', accent: '#94a3b8', rgb: '100, 116, 139' },
];

function Settings({ isOpen, onClose }) {
  const [selectedTheme, setSelectedTheme] = useState(themes[0]);

  useEffect(() => {
    // Load saved theme
    const loadTheme = async () => {
      const saved = await window.electronAPI.getSetting('theme');
      if (saved) {
        const theme = themes.find(t => t.name === saved) || themes[0];
        setSelectedTheme(theme);
        applyTheme(theme);
      }
    };
    loadTheme();
  }, []);

  const applyTheme = (theme) => {
    document.documentElement.style.setProperty('--primary-color', theme.primary);
    document.documentElement.style.setProperty('--secondary-color', theme.secondary);
    document.documentElement.style.setProperty('--accent-color', theme.accent);
    document.documentElement.style.setProperty('--primary-rgb', theme.rgb);
  };

  const handleThemeChange = async (theme) => {
    setSelectedTheme(theme);
    applyTheme(theme);
    await window.electronAPI.setSetting('theme', theme.name);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />
          
          {/* Settings Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-20 right-6 bg-white rounded-2xl shadow-2xl w-96 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-secondary p-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <SettingsIcon className="w-5 h-5" />
                <h2 className="font-semibold text-lg">Settings</h2>
              </div>
              <button
                onClick={onClose}
                className="hover:bg-white/20 rounded-lg p-1 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Palette className="w-5 h-5 text-gray-700" />
                <h3 className="font-semibold text-gray-800">Theme Colors</h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {themes.map((theme) => (
                  <motion.button
                    key={theme.name}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleThemeChange(theme)}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      selectedTheme.name === theme.name
                        ? 'border-primary shadow-lg'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-6 h-6 rounded-full"
                        style={{ backgroundColor: theme.primary }}
                      />
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: theme.secondary }}
                      />
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: theme.accent }}
                      />
                    </div>
                    <p className="text-xs font-medium text-gray-700 text-left">
                      {theme.name}
                    </p>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default Settings;

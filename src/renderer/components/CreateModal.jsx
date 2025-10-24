import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FolderPlus, FilePlus, Folder, File } from 'lucide-react';

function CreateModal({ isOpen, type, onClose, onConfirm }) {
  const [name, setName] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      if (type === 'file') {
        setName('Untitled');
      } else {
        setName('New Folder');
      }
    }
  }, [isOpen, type]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onConfirm(name.trim());
      setName('');
    }
  };

  const handleClose = () => {
    setName('');
    onClose();
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
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl w-[480px] z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-secondary p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {type === 'folder' ? (
                  <motion.div
                    animate={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ duration: 0.5 }}
                    className="bg-white/20 p-3 rounded-xl"
                  >
                    <FolderPlus className="w-6 h-6 text-white" />
                  </motion.div>
                ) : (
                  <motion.div
                    animate={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ duration: 0.5 }}
                    className="bg-white/20 p-3 rounded-xl"
                  >
                    <FilePlus className="w-6 h-6 text-white" />
                  </motion.div>
                )}
                <div>
                  <h2 className="font-bold text-xl text-white">
                    Create New {type === 'folder' ? 'Folder' : 'File'}
                  </h2>
                  <p className="text-white/80 text-sm">
                    Enter a name for your new {type === 'folder' ? 'folder' : 'file'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="hover:bg-white/20 rounded-lg p-2 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  {type === 'folder' ? 'Folder' : 'File'} Name
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    {type === 'folder' ? (
                      <Folder className="w-5 h-5 text-gray-400" />
                    ) : (
                      <File className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <input
                    ref={inputRef}
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={type === 'folder' ? 'e.g., Documents' : 'e.g., notes.txt'}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary transition-colors text-gray-800 font-medium"
                    onFocus={(e) => e.target.select()}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={!name.trim()}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-primary to-secondary hover:shadow-lg text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create {type === 'folder' ? 'Folder' : 'File'}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default CreateModal;

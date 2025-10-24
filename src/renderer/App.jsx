import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Home, Search, FolderPlus, FilePlus,
  Copy, Trash2, Edit3, Scissors, ClipboardPaste, Settings as SettingsIcon,
  Folder, FolderOpen, File, Image as ImageIcon, FileText, Music, Video, 
  Archive, FileCode, Film, Headphones, Package
} from 'lucide-react';
import Settings from './components/Settings';
import ImageViewer from './components/ImageViewer';
import CreateModal from './components/CreateModal';

function App() {
  const [currentPath, setCurrentPath] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [clipboard, setClipboard] = useState(null);
  const [clipboardAction, setClipboardAction] = useState(null); // 'copy' or 'cut'
  const [searchQuery, setSearchQuery] = useState('');
  const [contextMenu, setContextMenu] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [imageViewer, setImageViewer] = useState(null);
  const [renaming, setRenaming] = useState(null);
  const [createModal, setCreateModal] = useState({ isOpen: false, type: null });

  useEffect(() => {
    const loadHomeDir = async () => {
      try {
        const homeDir = await window.electronAPI.getHomeDir();
        navigateTo(homeDir);
      } catch (error) {
        console.error('Error loading home directory:', error);
      }
    };
    loadHomeDir();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === 'c') handleCopy();
        if (e.key === 'x') handleCut();
        if (e.key === 'v') handlePaste();
        if (e.key === 'a') {
          e.preventDefault();
          setSelectedFiles(new Set(files.map((_, i) => i)));
        }
      }
      if (e.key === 'Backspace' && selectedFiles.size > 0) {
        handleDelete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFiles, files, clipboard]);

  const navigateTo = async (path) => {
    setLoading(true);
    try {
      const dirContents = await window.electronAPI.readDirectory(path);
      setFiles(dirContents);
      setCurrentPath(path);
      
      // Update history
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(path);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      
      setSelectedFiles(new Set());
      setSearchQuery('');
    } catch (error) {
      console.error('Error reading directory:', error);
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      loadDirectory(history[newIndex]);
    }
  };

  const goForward = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      loadDirectory(history[newIndex]);
    }
  };

  const loadDirectory = async (path) => {
    setLoading(true);
    try {
      const dirContents = await window.electronAPI.readDirectory(path);
      setFiles(dirContents);
      setCurrentPath(path);
      setSelectedFiles(new Set());
    } catch (error) {
      console.error('Error reading directory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileClick = (file, index, e) => {
    if (e.shiftKey) {
      setSelectedFiles(prev => {
        const newSet = new Set(prev);
        if (newSet.has(index)) newSet.delete(index);
        else newSet.add(index);
        return newSet;
      });
    } else if (file.isDirectory) {
      navigateTo(file.path);
    } else {
      const ext = file.name.split('.').pop().toLowerCase();
      if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) {
        setImageViewer(file.path);
      }
    }
  };

  const handleContextMenu = (e, index) => {
    e.preventDefault();
    if (!selectedFiles.has(index)) {
      setSelectedFiles(new Set([index]));
    }
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleCopy = () => {
    if (selectedFiles.size > 0) {
      const filesToCopy = Array.from(selectedFiles).map(i => files[i].path);
      setClipboard(filesToCopy);
      setClipboardAction('copy');
    }
  };

  const handleCut = () => {
    if (selectedFiles.size > 0) {
      const filesToCut = Array.from(selectedFiles).map(i => files[i].path);
      setClipboard(filesToCut);
      setClipboardAction('cut');
    }
  };

  const handlePaste = async () => {
    if (!clipboard || clipboard.length === 0) return;
    
    try {
      for (const sourcePath of clipboard) {
        const fileName = sourcePath.split('/').pop();
        const destPath = `${currentPath}/${fileName}`;
        
        if (clipboardAction === 'copy') {
          await window.electronAPI.copyFile(sourcePath, destPath);
        } else if (clipboardAction === 'cut') {
          await window.electronAPI.moveFile(sourcePath, destPath);
        }
      }
      
      if (clipboardAction === 'cut') {
        setClipboard(null);
        setClipboardAction(null);
      }
      
      loadDirectory(currentPath);
    } catch (error) {
      console.error('Paste failed:', error);
    }
  };

  const handleDelete = async () => {
    if (selectedFiles.size === 0) return;
    
    if (confirm(`Delete ${selectedFiles.size} item(s)?`)) {
      try {
        for (const index of selectedFiles) {
          await window.electronAPI.deleteFile(files[index].path);
        }
        loadDirectory(currentPath);
      } catch (error) {
        console.error('Delete failed:', error);
      }
    }
  };

  const handleRename = async (index, newName) => {
    try {
      await window.electronAPI.renameFile(files[index].path, newName);
      loadDirectory(currentPath);
      setRenaming(null);
    } catch (error) {
      console.error('Rename failed:', error);
    }
  };

  const handleCreateFolder = () => {
    setCreateModal({ isOpen: true, type: 'folder' });
  };

  const handleCreateFile = () => {
    setCreateModal({ isOpen: true, type: 'file' });
  };

  const handleCreateConfirm = async (name) => {
    try {
      if (createModal.type === 'folder') {
        await window.electronAPI.createFolder(currentPath, name);
      } else {
        await window.electronAPI.createFile(currentPath, name);
      }
      loadDirectory(currentPath);
      setCreateModal({ isOpen: false, type: null });
    } catch (error) {
      console.error('Create failed:', error);
    }
  };

  const getFileIcon = (file) => {
    if (file.isDirectory) {
      return (
        <div className="relative">
          <Folder className="w-6 h-6 text-amber-400" fill="currentColor" />
        </div>
      );
    }
    
    const ext = file.name.split('.').pop().toLowerCase();
    
    // Images
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico'].includes(ext)) {
      return <ImageIcon className="w-5 h-5 text-purple-500" strokeWidth={2} />;
    }
    
    // Audio
    if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'].includes(ext)) {
      return <Headphones className="w-5 h-5 text-pink-500" strokeWidth={2} />;
    }
    
    // Video
    if (['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm'].includes(ext)) {
      return <Film className="w-5 h-5 text-red-500" strokeWidth={2} />;
    }
    
    // Archives
    if (['zip', 'rar', 'tar', 'gz', '7z', 'bz2', 'xz'].includes(ext)) {
      return <Archive className="w-5 h-5 text-orange-500" strokeWidth={2} />;
    }
    
    // Code files
    if (['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'h', 'go', 'rs', 'rb', 'php', 'html', 'css', 'scss', 'json', 'xml', 'yaml', 'yml'].includes(ext)) {
      return <FileCode className="w-5 h-5 text-emerald-500" strokeWidth={2} />;
    }
    
    // Documents
    if (['txt', 'md', 'pdf', 'doc', 'docx', 'rtf', 'odt'].includes(ext)) {
      return <FileText className="w-5 h-5 text-blue-500" strokeWidth={2} />;
    }
    
    // Packages
    if (['dmg', 'pkg', 'app', 'exe', 'msi', 'deb', 'rpm'].includes(ext)) {
      return <Package className="w-5 h-5 text-indigo-500" strokeWidth={2} />;
    }
    
    return <File className="w-5 h-5 text-gray-400" strokeWidth={2} />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Toolbar */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Mac Explorer
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Navigation */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={goBack}
              disabled={historyIndex <= 0}
              className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-primary" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={goForward}
              disabled={historyIndex >= history.length - 1}
              className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-primary" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigateTo(history[0] || currentPath)}
              className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
            >
              <Home className="w-5 h-5 text-primary" />
            </motion.button>

            {/* Actions */}
            <div className="h-6 w-px bg-gray-300 mx-2" />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCreateFolder}
              className="p-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 transition-colors"
              title="New Folder"
            >
              <FolderPlus className="w-5 h-5 text-green-600" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCreateFile}
              className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
              title="New File"
            >
              <FilePlus className="w-5 h-5 text-blue-600" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCopy}
              disabled={selectedFiles.size === 0}
              className="p-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 disabled:opacity-30 transition-colors"
              title="Copy"
            >
              <Copy className="w-5 h-5 text-purple-600" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCut}
              disabled={selectedFiles.size === 0}
              className="p-2 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 disabled:opacity-30 transition-colors"
              title="Cut"
            >
              <Scissors className="w-5 h-5 text-orange-600" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePaste}
              disabled={!clipboard}
              className="p-2 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 disabled:opacity-30 transition-colors"
              title="Paste"
            >
              <ClipboardPaste className="w-5 h-5 text-teal-600" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDelete}
              disabled={selectedFiles.size === 0}
              className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 disabled:opacity-30 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-5 h-5 text-red-600" />
            </motion.button>
          </div>
        </div>

        {/* Address Bar & Search */}
        <div className="px-4 pb-3 flex gap-3">
          <div className="flex-1 flex items-center bg-white rounded-lg border border-gray-300 px-3 py-2 focus-within:ring-2 focus-within:ring-primary/30 transition-all">
            <Folder className="w-4 h-4 text-gray-400 mr-2" />
            <input
              type="text"
              value={currentPath}
              onChange={(e) => setCurrentPath(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') navigateTo(currentPath);
              }}
              className="flex-1 outline-none text-sm text-gray-700"
            />
          </div>
          <div className="w-64 flex items-center bg-white rounded-lg border border-gray-300 px-3 py-2 focus-within:ring-2 focus-within:ring-primary/30 transition-all">
            <Search className="w-4 h-4 text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 outline-none text-sm text-gray-700"
            />
          </div>
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-auto p-4" onClick={() => setContextMenu(null)}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
            />
          </div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {filteredFiles.map((file, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                onClick={(e) => handleFileClick(file, index, e)}
                onContextMenu={(e) => handleContextMenu(e, index)}
                className={`group px-4 py-3 rounded-xl cursor-pointer transition-all duration-200
                  ${selectedFiles.has(index) 
                    ? 'bg-primary/20 shadow-md scale-[1.02]' 
                    : 'bg-white hover:bg-primary/5 hover:shadow-lg hover:scale-[1.01]'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    whileHover={{ scale: 1.2, rotate: 5 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                  >
                    {getFileIcon(file)}
                  </motion.div>
                  
                  {renaming === index ? (
                    <input
                      autoFocus
                      defaultValue={file.name}
                      onBlur={(e) => handleRename(index, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename(index, e.target.value);
                        if (e.key === 'Escape') setRenaming(null);
                      }}
                      className="flex-1 px-2 py-1 border border-primary rounded-lg outline-none"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${
                        file.isDirectory ? 'font-semibold text-gray-800' : 'text-gray-700'
                      }`}>
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {!file.isDirectory && formatFileSize(file.size)}
                      </p>
                    </div>
                  )}
                  
                  {selectedFiles.has(index) && (
                    <motion.button
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      whileHover={{ scale: 1.2 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenaming(index);
                      }}
                      className="p-1.5 rounded-lg bg-primary/20 hover:bg-primary/30 transition-colors"
                    >
                      <Edit3 className="w-4 h-4 text-primary" />
                    </motion.button>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Status Bar */}
      <div className="bg-white/80 backdrop-blur-lg border-t border-gray-200 px-4 py-2 flex items-center justify-between">
        <p className="text-xs text-gray-600">
          {filteredFiles.length} items {selectedFiles.size > 0 && `• ${selectedFiles.size} selected`}
        </p>
        
        {/* Settings Button */}
        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowSettings(true)}
          className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
        >
          <SettingsIcon className="w-4 h-4 text-primary" />
        </motion.button>
      </div>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{ top: contextMenu.y, left: contextMenu.x }}
            className="fixed bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-30 min-w-[180px]"
          >
            <button
              onClick={() => { handleCopy(); setContextMenu(null); }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
            >
              <Copy className="w-4 h-4" /> Copy
            </button>
            <button
              onClick={() => { handleCut(); setContextMenu(null); }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
            >
              <Scissors className="w-4 h-4" /> Cut
            </button>
            <button
              onClick={() => { handlePaste(); setContextMenu(null); }}
              disabled={!clipboard}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 disabled:opacity-30"
            >
              <ClipboardPaste className="w-4 h-4" /> Paste
            </button>
            <div className="h-px bg-gray-200 my-1" />
            <button
              onClick={() => { setRenaming(Array.from(selectedFiles)[0]); setContextMenu(null); }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4" /> Rename
            </button>
            <button
              onClick={() => { handleDelete(); setContextMenu(null); }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-red-600 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <Settings isOpen={showSettings} onClose={() => setShowSettings(false)} />

      {/* Image Viewer */}
      {imageViewer && (
        <ImageViewer imagePath={imageViewer} onClose={() => setImageViewer(null)} />
      )}

      {/* Create Modal */}
      <CreateModal
        isOpen={createModal.isOpen}
        type={createModal.type}
        onClose={() => setCreateModal({ isOpen: false, type: null })}
        onConfirm={handleCreateConfirm}
      />
    </div>
  );
}

export default App;

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Home, Search, FolderPlus, FilePlus,
  Copy, Trash2, Edit3, Scissors, ClipboardPaste, Settings as SettingsIcon,
  Folder, FolderOpen, File, Image as ImageIcon, FileText, Music, Video, 
  Archive, FileCode, Film, Headphones, Package, LayoutGrid, LayoutList
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
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'

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
      // Don't trigger shortcuts when renaming or in input fields
      if (renaming !== null || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }
      
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
  }, [selectedFiles, files, clipboard, renaming]);

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
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100">
      {/* Toolbar */}
      <div className="bg-white/90 backdrop-blur-xl border-b border-gray-200/80 shadow-sm">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-accent-color to-secondary bg-clip-text text-transparent">
              Mac Explorer
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Navigation */}
            <motion.button
              whileHover={{ scale: 1.08, x: -2 }}
              whileTap={{ scale: 0.92 }}
              onClick={goBack}
              disabled={historyIndex <= 0}
              className="p-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow"
            >
              <ChevronLeft className="w-5 h-5 text-primary" strokeWidth={2.5} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.08, x: 2 }}
              whileTap={{ scale: 0.92 }}
              onClick={goForward}
              disabled={historyIndex >= history.length - 1}
              className="p-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow"
            >
              <ChevronRight className="w-5 h-5 text-primary" strokeWidth={2.5} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => navigateTo(history[0] || currentPath)}
              className="p-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 transition-all shadow-sm hover:shadow"
            >
              <Home className="w-5 h-5 text-primary" strokeWidth={2.5} />
            </motion.button>

            {/* Actions */}
            <div className="h-8 w-px bg-primary/20 mx-1" />
            
            <motion.button
              whileHover={{ scale: 1.08, rotate: -5 }}
              whileTap={{ scale: 0.92 }}
              onClick={handleCreateFolder}
              className="p-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 transition-all shadow-sm hover:shadow"
              title="New Folder"
            >
              <FolderPlus className="w-5 h-5 text-primary" strokeWidth={2.5} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.08, rotate: 5 }}
              whileTap={{ scale: 0.92 }}
              onClick={handleCreateFile}
              className="p-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 transition-all shadow-sm hover:shadow"
              title="New File"
            >
              <FilePlus className="w-5 h-5 text-primary" strokeWidth={2.5} />
            </motion.button>
            
            <div className="h-8 w-px bg-primary/20 mx-1" />
            
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={handleCopy}
              disabled={selectedFiles.size === 0}
              className="p-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow"
              title="Copy"
            >
              <Copy className="w-5 h-5 text-primary" strokeWidth={2.5} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={handleCut}
              disabled={selectedFiles.size === 0}
              className="p-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 disabled:opacity-30 transition-all shadow-sm hover:shadow"
              title="Cut"
            >
              <Scissors className="w-5 h-5 text-primary" strokeWidth={2.5} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={handlePaste}
              disabled={!clipboard}
              className="p-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 disabled:opacity-30 transition-all shadow-sm hover:shadow"
              title="Paste"
            >
              <ClipboardPaste className="w-5 h-5 text-primary" strokeWidth={2.5} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={handleDelete}
              disabled={selectedFiles.size === 0}
              className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 disabled:opacity-30 transition-all shadow-sm hover:shadow"
              title="Delete"
            >
              <Trash2 className="w-5 h-5 text-red-600" strokeWidth={2.5} />
            </motion.button>
            
            <div className="h-8 w-px bg-primary/20 mx-1" />
            
            {/* View Mode Toggle */}
            <div className="flex bg-primary/5 rounded-xl p-1">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'list'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-gray-600 hover:bg-primary/10'
                }`}
                title="List View"
              >
                <LayoutList className="w-4 h-4" strokeWidth={2.5} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'grid'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-gray-600 hover:bg-primary/10'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" strokeWidth={2.5} />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Address Bar & Search */}
        <div className="px-6 pb-4 flex gap-3">
          <div className="flex-1 flex items-center bg-white/70 backdrop-blur-sm rounded-xl border-2 border-gray-200 px-4 py-2.5 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all shadow-sm">
            <Folder className="w-5 h-5 text-primary mr-3" fill="currentColor" />
            <input
              type="text"
              value={currentPath}
              onChange={(e) => setCurrentPath(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') navigateTo(currentPath);
              }}
              className="flex-1 outline-none text-sm font-medium text-gray-700 bg-transparent"
            />
          </div>
          <div className="w-72 flex items-center bg-white/70 backdrop-blur-sm rounded-xl border-2 border-gray-200 px-4 py-2.5 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all shadow-sm">
            <Search className="w-5 h-5 text-primary mr-3" strokeWidth={2.5} />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 outline-none text-sm font-medium text-gray-700 bg-transparent placeholder:text-gray-400"
            />
          </div>
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-auto p-6" onClick={() => setContextMenu(null)}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full"
            />
          </div>
        ) : (
          <motion.div 
            className={viewMode === 'grid' 
              ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4'
              : 'grid grid-cols-1 gap-2.5'
            }
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.02 }}
          >
            {filteredFiles.map((file, index) => (
              viewMode === 'grid' ? (
                // Grid View
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: Math.min(index * 0.015, 0.3) }}
                  onClick={(e) => handleFileClick(file, index, e)}
                  onContextMenu={(e) => handleContextMenu(e, index)}
                  className={`group relative rounded-2xl cursor-pointer transition-all duration-300
                    ${selectedFiles.has(index) 
                      ? 'bg-gradient-to-br from-primary/20 via-primary/15 to-primary/10 shadow-xl scale-105 ring-2 ring-primary/40' 
                      : 'bg-white/80 backdrop-blur-sm hover:bg-gradient-to-br hover:from-white hover:to-primary/5 hover:shadow-2xl hover:scale-105'
                    }
                  `}
                >
                  <div className="flex flex-col items-center p-6 gap-4">
                    <motion.div
                      whileHover={{ scale: 1.15, rotate: selectedFiles.has(index) ? 5 : 0 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                      className="relative"
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
                        className="w-full px-3 py-1.5 border-2 border-primary rounded-xl outline-none text-sm text-center font-medium"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <div className="text-center w-full">
                        <p className={`text-sm truncate px-2 ${
                          file.isDirectory ? 'font-bold text-gray-800' : 'font-medium text-gray-700'
                        }`}>
                          {file.name}
                        </p>
                        {!file.isDirectory && (
                          <p className="text-xs text-gray-500 mt-1">
                            {formatFileSize(file.size)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {selectedFiles.has(index) && (
                    <motion.button
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      whileHover={{ scale: 1.15 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenaming(index);
                      }}
                      className="absolute top-3 right-3 p-2 rounded-xl bg-primary text-white shadow-lg hover:shadow-xl transition-all"
                    >
                      <Edit3 className="w-3.5 h-3.5" strokeWidth={2.5} />
                    </motion.button>
                  )}
                </motion.div>
              ) : (
                // List View
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(index * 0.01, 0.2) }}
                  onClick={(e) => handleFileClick(file, index, e)}
                  onContextMenu={(e) => handleContextMenu(e, index)}
                  className={`group px-5 py-3.5 rounded-2xl cursor-pointer transition-all duration-200
                    ${selectedFiles.has(index) 
                      ? 'bg-gradient-to-r from-primary/20 to-primary/10 shadow-lg scale-[1.01] border-2 border-primary/30' 
                      : 'bg-white/70 backdrop-blur-sm hover:bg-gradient-to-r hover:from-white hover:to-primary/5 hover:shadow-xl hover:scale-[1.01] border-2 border-transparent'
                    }
                  `}
                >
                  <div className="flex items-center gap-4">
                    <motion.div
                      whileHover={{ scale: 1.2, rotate: 8 }}
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
                        className="flex-1 px-3 py-2 border-2 border-primary rounded-xl outline-none font-medium"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${
                          file.isDirectory ? 'font-bold text-gray-800' : 'font-semibold text-gray-700'
                        }`}>
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {file.isDirectory ? 'Folder' : formatFileSize(file.size)}
                        </p>
                      </div>
                    )}
                    
                    {selectedFiles.has(index) && (
                      <motion.button
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        whileHover={{ scale: 1.15 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenaming(index);
                        }}
                        className="p-2 rounded-xl bg-primary text-white shadow-md hover:shadow-lg transition-all"
                      >
                        <Edit3 className="w-4 h-4" strokeWidth={2.5} />
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              )
            ))}
          </motion.div>
        )}
      </div>

      {/* Status Bar */}
      <div className="bg-white/90 backdrop-blur-xl border-t border-gray-200/80 px-6 py-3 flex items-center justify-between shadow-sm">
        <p className="text-sm font-medium text-gray-700">
          <span className="text-primary font-bold">{filteredFiles.length}</span> items
          {selectedFiles.size > 0 && (
            <span className="ml-2">
              • <span className="text-primary font-bold">{selectedFiles.size}</span> selected
            </span>
          )}
        </p>
        
        {/* Settings Button */}
        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowSettings(true)}
          className="p-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 transition-all shadow-sm hover:shadow"
        >
          <SettingsIcon className="w-5 h-5 text-primary" strokeWidth={2.5} />
        </motion.button>
      </div>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{ top: contextMenu.y, left: contextMenu.x }}
            className="fixed bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border-2 border-primary/20 py-2 z-30 min-w-[200px] overflow-hidden"
          >
            <button
              onClick={() => { handleCopy(); setContextMenu(null); }}
              className="w-full px-4 py-2.5 text-left text-sm font-medium hover:bg-primary/10 flex items-center gap-3 text-gray-700 hover:text-primary transition-colors"
            >
              <Copy className="w-4 h-4" strokeWidth={2.5} /> Copy
            </button>
            <button
              onClick={() => { handleCut(); setContextMenu(null); }}
              className="w-full px-4 py-2.5 text-left text-sm font-medium hover:bg-primary/10 flex items-center gap-3 text-gray-700 hover:text-primary transition-colors"
            >
              <Scissors className="w-4 h-4" strokeWidth={2.5} /> Cut
            </button>
            <button
              onClick={() => { handlePaste(); setContextMenu(null); }}
              disabled={!clipboard}
              className="w-full px-4 py-2.5 text-left text-sm font-medium hover:bg-primary/10 flex items-center gap-3 text-gray-700 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ClipboardPaste className="w-4 h-4" strokeWidth={2.5} /> Paste
            </button>
            <div className="h-px bg-primary/10 my-1.5 mx-2" />
            <button
              onClick={() => { setRenaming(Array.from(selectedFiles)[0]); setContextMenu(null); }}
              className="w-full px-4 py-2.5 text-left text-sm font-medium hover:bg-primary/10 flex items-center gap-3 text-gray-700 hover:text-primary transition-colors"
            >
              <Edit3 className="w-4 h-4" strokeWidth={2.5} /> Rename
            </button>
            <button
              onClick={() => { handleDelete(); setContextMenu(null); }}
              className="w-full px-4 py-2.5 text-left text-sm font-medium hover:bg-red-50 flex items-center gap-3 text-red-600 hover:text-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" strokeWidth={2.5} /> Delete
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

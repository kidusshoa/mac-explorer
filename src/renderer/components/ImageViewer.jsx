import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, RotateCw, Maximize2, Minimize2 } from 'lucide-react';

function ImageViewer({ imagePath, onClose }) {
  const [imageData, setImageData] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (imagePath) {
      loadImage();
    }
  }, [imagePath]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') handleZoomIn();
      if (e.key === '-') handleZoomOut();
      if (e.key === 'r' || e.key === 'R') handleRotate();
      if (e.key === '0') handleResetZoom();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loadImage = async () => {
    try {
      const buffer = await window.electronAPI.readFile(imagePath);
      const blob = new Blob([buffer]);
      const url = URL.createObjectURL(blob);
      setImageData(url);
    } catch (error) {
      console.error('Failed to load image:', error);
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.25));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleResetZoom = () => {
    setZoom(1);
    setRotation(0);
  };

  if (!imagePath) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/95 z-50 flex flex-col"
      >
        {/* Close button - top right */}
        <div className="absolute top-6 right-6 z-10">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-md transition-colors shadow-xl"
          >
            <X className="w-6 h-6" />
          </motion.button>
        </div>

        {/* Image container */}
        <div className="flex-1 flex items-center justify-center p-8 overflow-hidden">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative max-w-full max-h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {imageData && (
              <motion.img
                src={imageData}
                alt="Preview"
                animate={{ scale: zoom, rotate: rotation }}
                transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                className="max-w-[85vw] max-h-[75vh] object-contain rounded-lg shadow-2xl"
                draggable={false}
              />
            )}
          </motion.div>
        </div>

        {/* Bottom control panel */}
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', damping: 25 }}
          className="pb-8 px-8"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl">
            {/* Filename */}
            <div className="px-6 py-4 border-b border-white/10">
              <p className="text-white text-center font-medium truncate">
                {imagePath.split('/').pop()}
              </p>
              <p className="text-white/60 text-xs text-center mt-1">
                Zoom: {Math.round(zoom * 100)}% {rotation > 0 && `• Rotation: ${rotation}°`}
              </p>
            </div>
            
            {/* Controls */}
            <div className="px-6 py-4 flex items-center justify-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleZoomOut}
                disabled={zoom <= 0.25}
                className="bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl backdrop-blur-sm transition-all flex items-center gap-2 font-medium"
                title="Zoom Out (-)"
              >
                <ZoomOut className="w-5 h-5" />
                <span className="text-sm">Zoom Out</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleResetZoom}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl backdrop-blur-sm transition-all flex items-center gap-2 font-medium"
                title="Reset (0)"
              >
                <Minimize2 className="w-5 h-5" />
                <span className="text-sm">Reset</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleZoomIn}
                disabled={zoom >= 5}
                className="bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl backdrop-blur-sm transition-all flex items-center gap-2 font-medium"
                title="Zoom In (+)"
              >
                <ZoomIn className="w-5 h-5" />
                <span className="text-sm">Zoom In</span>
              </motion.button>
              
              <div className="w-px h-8 bg-white/20 mx-2" />
              
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRotate}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl backdrop-blur-sm transition-all flex items-center gap-2 font-medium"
                title="Rotate (R)"
              >
                <RotateCw className="w-5 h-5" />
                <span className="text-sm">Rotate</span>
              </motion.button>
            </div>
            
            {/* Keyboard hints */}
            <div className="px-6 py-3 border-t border-white/10">
              <p className="text-white/50 text-xs text-center">
                Keyboard: <span className="text-white/70">ESC</span> to close • 
                <span className="text-white/70"> +/-</span> zoom • 
                <span className="text-white/70"> R</span> rotate • 
                <span className="text-white/70"> 0</span> reset
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default ImageViewer;

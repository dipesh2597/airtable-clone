import React, { useState, useRef, useEffect } from 'react';

function ResizablePanel({ children, minWidth = 200, maxWidth = 400, defaultWidth = 256 }) {
  const [width, setWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef(null);

  const startResize = (e) => {
    setIsResizing(true);
    e.preventDefault();
  };

  const stopResize = () => {
    setIsResizing(false);
  };

  const resize = (e) => {
    if (!isResizing) return;

    const newWidth = window.innerWidth - e.clientX;
    if (newWidth >= minWidth && newWidth <= maxWidth) {
      setWidth(newWidth);
    }
  };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', resize);
      document.addEventListener('mouseup', stopResize);
      return () => {
        document.removeEventListener('mousemove', resize);
        document.removeEventListener('mouseup', stopResize);
      };
    }
  }, [isResizing]);

  return (
    <div 
      ref={panelRef}
      className="bg-white border-l border-gray-200 flex-shrink-0 relative shadow-lg"
      style={{ width: `${width}px` }}
    >
      {/* Resize handle */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-1 bg-gray-300 hover:bg-blue-500 cursor-col-resize transition-colors duration-200 group"
        onMouseDown={startResize}
      >
        {/* Visual indicator dots */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="flex flex-col space-y-1">
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="h-full">
        {children}
      </div>
    </div>
  );
}

export default ResizablePanel; 
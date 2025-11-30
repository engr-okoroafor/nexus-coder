
import React, { useMemo, useEffect, useRef, useState, useCallback, forwardRef, ForwardRefRenderFunction } from 'react';
import type { FileNode } from '../types';
import { highlightSyntax, formatCode } from '../utils';

interface CodeEditorProps {
  file: FileNode | null;
  onContentChange: (fileId: string, newContent: string) => void;
  onContentUpdate: (fileId: string, newContent: string) => void; // For live updates before saving
}

const getFileExtension = (filename: string | undefined): 'tsx' | 'html' | 'css' | 'json' | 'js' => {
    if (!filename) return 'tsx';
    const ext = filename.split('.').pop();
    switch (ext) {
        case 'html': return 'html';
        case 'css': return 'css';
        case 'json': return 'json';
        case 'js':
        case 'jsx':
            return 'js';
        case 'tsx':
        case 'ts':
        default:
            return 'tsx';
    }
}

const AUTOSAVE_DELAY = 2000; 
const LINE_HEIGHT = 21;
const OVERSCAN_LINES = 20;

const CodeEditorComponent: ForwardRefRenderFunction<HTMLTextAreaElement, CodeEditorProps> = ({ file, onContentChange, onContentUpdate }, ref) => {
  const [localContent, setLocalContent] = useState(file?.content || '');
  const [scrollPosition, setScrollPosition] = useState({ top: 0, left: 0 });
  const [cursorPosition, setCursorPosition] = useState(0);
  
  const lang = getFileExtension(file?.name);
  const autosaveTimeoutRef = useRef<number | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    setLocalContent(file?.content || '');
    if (ref && 'current' in ref && ref.current) {
      ref.current.scrollTop = 0;
      ref.current.scrollLeft = 0;
    }
    setScrollPosition({ top: 0, left: 0 });
    setCursorPosition(0);
    if (autosaveTimeoutRef.current !== undefined) clearTimeout(autosaveTimeoutRef.current);
  }, [file, ref]);

  const formatAndSaveChanges = useCallback(() => {
    if (autosaveTimeoutRef.current !== undefined) clearTimeout(autosaveTimeoutRef.current);
    if (file && localContent !== file.content) {
      const formatted = formatCode(localContent, lang);
      if (formatted !== localContent) {
        setLocalContent(formatted);
      }
      onContentChange(file.id, formatted);
    }
  }, [file, localContent, lang, onContentChange]);

  const handleLocalContentChange = (newContent: string) => {
    setLocalContent(newContent);
    if(file) onContentUpdate(file.id, newContent);

    if (autosaveTimeoutRef.current !== undefined) clearTimeout(autosaveTimeoutRef.current);
    autosaveTimeoutRef.current = window.setTimeout(formatAndSaveChanges, AUTOSAVE_DELAY);
  };

  const handleBlur = () => {
    formatAndSaveChanges();
  };

  const handleScroll = useCallback((e: React.UIEvent<HTMLTextAreaElement>) => {
    const { scrollTop, scrollLeft } = e.currentTarget;
    requestAnimationFrame(() => {
        setScrollPosition({ top: scrollTop, left: scrollLeft });
    });
  }, []);

  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
      setCursorPosition(e.currentTarget.selectionStart);
  };
  
  const editorRef = ref as React.RefObject<HTMLTextAreaElement>;
  const { virtualItems, startIndex, totalHeight } = useMemo(() => {
    const lines = localContent.split('\n');
    const totalH = lines.length * LINE_HEIGHT;
    
    const containerHeight = editorRef.current?.clientHeight || 0;
    const startIdx = Math.max(0, Math.floor(scrollPosition.top / LINE_HEIGHT) - OVERSCAN_LINES);
    const endIdx = Math.min(lines.length, startIdx + Math.ceil(containerHeight / LINE_HEIGHT) + (2 * OVERSCAN_LINES));

    const items = [];
    for (let i = startIdx; i < endIdx; i++) {
        items.push({
            index: i,
            content: lines[i],
        });
    }
    return { virtualItems: items, startIndex: startIdx, totalHeight: totalH };
  }, [localContent, scrollPosition.top, editorRef]);

  const highlightedContent = useMemo(() => {
      const codeToHighlight = virtualItems.map(item => item.content).join('\n');
      return highlightSyntax(codeToHighlight, lang);
  }, [virtualItems, lang]);

  // Calculate active line index based on cursor position
  const activeLineIndex = useMemo(() => {
      return localContent.substring(0, cursorPosition).split('\n').length - 1;
  }, [localContent, cursorPosition]);

  if (!file) {
    return (
      <div className="w-full h-full bg-black/30 flex items-center justify-center">
        <p className="text-gray-400 font-fira-code">Select a file to view and edit</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full bg-[#0d0d0f] flex relative font-fira-code text-sm">
      <div className="w-12 h-full bg-black/20 text-right text-gray-500 select-none flex-shrink-0 overflow-hidden pt-4">
          <div style={{ height: `${totalHeight}px`, position: 'relative', transform: `translateY(-${scrollPosition.top}px)` }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 4, transform: `translateY(${startIndex * LINE_HEIGHT}px)` }}>
                  {virtualItems.map(item => (
                      <div key={item.index} className={`h-[21px] flex items-center justify-end ${item.index === activeLineIndex ? 'text-white font-bold' : ''}`}>
                          {item.index + 1}
                      </div>
                  ))}
              </div>
          </div>
      </div>
      
      <div className="relative w-full h-full">
         <textarea
            ref={ref}
            value={localContent}
            onChange={(e) => handleLocalContentChange(e.target.value)}
            onScroll={handleScroll}
            onSelect={handleSelect}
            onBlur={handleBlur}
            className="absolute inset-0 w-full h-full bg-transparent p-4 text-transparent caret-cyan-400 resize-none focus:outline-none overflow-auto custom-scrollbar leading-[21px] whitespace-pre z-10"
            spellCheck="false"
        />
        <pre
            aria-hidden="true"
            className="absolute inset-0 w-full h-full bg-transparent p-4 text-white resize-none focus:outline-none leading-[21px] pointer-events-none whitespace-pre overflow-hidden"
        >
          <div style={{ height: `${totalHeight}px`, position: 'relative', transform: `translateY(-${scrollPosition.top}px)` }}>
              {/* Active Line Highlight */}
              <div 
                style={{
                    position: 'absolute',
                    top: activeLineIndex * LINE_HEIGHT,
                    left: 0,
                    width: '100%',
                    height: '21px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderLeft: '2px solid #00f3ff',
                    pointerEvents: 'none'
                }}
              />
              <code
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    transform: `translate(${-scrollPosition.left}px, ${startIndex * LINE_HEIGHT}px)`,
                    minWidth: '100%',
                }}
                dangerouslySetInnerHTML={{ __html: highlightedContent }}
              />
          </div>
        </pre>
      </div>

       <style>{`
        .token-comment { color: #6a9955; }
        .token-string, .token-attribute-value { color: #ce9178; }
        .token-keyword { color: #c586c0; font-style: italic; }
        .token-tag-name, .token-selector { color: #569cd6; }
        .token-component, .token-class-name { color: #4ec9b0; }
        .token-attribute-name, .token-property { color: #9cdcfe; }
        .token-function { color: #dcdcaa; }
        .token-punctuation, .token-tag-punctuation-bracket { color: #808080; }
        .token-number { color: #b5cea8; }
        .token-boolean { color: #569cd6; }
        .token-operator { color: #d4d4d4; }
        .token-variable { color: #9cdcfe; }
       `}</style>
    </div>
  );
};

export const CodeEditor = forwardRef(CodeEditorComponent);

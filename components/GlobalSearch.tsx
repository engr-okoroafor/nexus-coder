import React from 'react';
import type { SearchResult } from '../types';
import { FileIcon, CommitIcon, PlanIcon, HtmlFileIcon, CssFileIcon, JsFileIcon, TsxFileIcon, JsonFileIcon } from './Icons';

interface GlobalSearchProps {
  results: SearchResult[];
  onResultClick: (result: SearchResult) => void;
}

const getResultIcon = (result: SearchResult) => {
    const iconClass = "h-4 w-4 flex-shrink-0";
    switch (result.type) {
        case 'file':
            const ext = result.file.name.split('.').pop()?.toLowerCase();
            switch (ext) {
                case 'html': return <HtmlFileIcon className={iconClass} />;
                case 'css': return <CssFileIcon className={iconClass} />;
                case 'js': return <JsFileIcon className={iconClass} />;
                case 'tsx':
                case 'jsx':
                case 'ts': return <TsxFileIcon className={iconClass} />;
                case 'json': return <JsonFileIcon className={iconClass} />;
                default: return <FileIcon className={`${iconClass} text-purple-400`} />;
            }
        case 'log': return <PlanIcon className={`${iconClass} text-cyan-400`} />;
        case 'commit': return <CommitIcon className={`${iconClass} text-yellow-400`} />;
        default: return null;
    }
}

const getResultTitle = (result: SearchResult): string => {
    if (result.type === 'file') return result.file.name;
    if (result.type === 'commit') return `Commit: ${result.commit.id.substring(0, 7)}`;
    if (result.type === 'log') return `Log Entry #${result.logIndex}`;
    return '';
}

const SearchResultSection: React.FC<{
    title: string;
    count: number;
    results: SearchResult[];
    onResultClick: (result: SearchResult) => void;
    hoverColor: string;
}> = ({ title, count, results, onResultClick, hoverColor }) => (
    <div className="mb-4">
        <h4 className="text-xs text-cyan-400 uppercase font-orbitron tracking-wider mb-2 border-b border-cyan-500/20 pb-1">
            {title} ({count})
        </h4>
        {results.map((result, i) => (
             <button 
                key={`${title}-${i}`} 
                className={`w-full text-left p-2 rounded-lg bg-black/20 ${hoverColor} transition-colors flex items-start gap-3 mb-1`}
                onClick={() => onResultClick(result)}
            >
                {getResultIcon(result)}
                <div className="min-w-0">
                    <p className="text-sm text-gray-200 truncate font-semibold">
                        {getResultTitle(result)}
                        {result.type === 'file' && <span className="text-xs text-gray-500 ml-2">L{result.lineNumber}</span>}
                    </p>
                    <p className="text-xs text-gray-400 font-fira-code truncate">{result.content}</p>
                </div>
            </button>
        ))}
    </div>
);


export const GlobalSearch: React.FC<GlobalSearchProps> = ({ results, onResultClick }) => {
    
    const fileResults = results.filter(r => r.type === 'file');
    const logResults = results.filter(r => r.type === 'log');
    const commitResults = results.filter(r => r.type === 'commit');
    
    return (
        <div className="h-full flex flex-col min-h-0 text-sm">
            {results.length === 0 && (
                <p className="text-gray-500 italic text-center mt-4">No results found.</p>
            )}
            
            {fileResults.length > 0 && (
                <SearchResultSection 
                    title="Files" 
                    count={fileResults.length} 
                    results={fileResults} 
                    onResultClick={onResultClick} 
                    hoverColor="hover:bg-purple-500/20"
                />
            )}

            {logResults.length > 0 && (
                 <SearchResultSection 
                    title="Logs"
                    count={logResults.length}
                    results={logResults}
                    onResultClick={onResultClick}
                    hoverColor="hover:bg-cyan-500/20"
                />
            )}

            {commitResults.length > 0 && (
                 <SearchResultSection 
                    title="Commits"
                    count={commitResults.length}
                    results={commitResults}
                    onResultClick={onResultClick}
                    hoverColor="hover:bg-yellow-500/20"
                />
            )}
        </div>
    );
};
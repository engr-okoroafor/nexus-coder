import React from 'react';

interface CodeReviewProps {
    review: string;
    isReviewing: boolean;
}

// A simple Markdown-to-HTML renderer
const renderMarkdown = (text: string) => {
    // This is a very basic renderer. A library like 'marked' would be more robust.
    const html = text
        .replace(/^### (.*$)/gim, '<h3 class="text-lg font-orbitron text-purple-300 mt-4 mb-2">$1</h3>')
        .replace(/^## (.*$)/gim, '<h2 class="text-xl font-orbitron text-cyan-300 mt-6 mb-3 border-b border-purple-500/20 pb-2">$1</h2>')
        .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-orbitron text-white mt-8 mb-4 border-b-2 border-cyan-400/50 pb-3">$1</h1>')
        .replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code class="bg-black/50 text-cyan-300 font-fira-code px-1.5 py-0.5 rounded-md text-sm">$1</code>')
        .replace(/```([\s\S]*?)```/g, '<pre class="bg-black/50 p-4 rounded-lg my-4 overflow-x-auto custom-scrollbar"><code class="font-fira-code text-sm">$1</code></pre>')
        .replace(/^\* (.*$)/gim, '<li class="ml-6 list-disc">$1</li>')
        .replace(/\n/g, '<br />');
        
    return { __html: html };
}

export const CodeReview: React.FC<CodeReviewProps> = ({ review, isReviewing }) => {
    if (isReviewing) {
        return (
            <div className="w-full h-full bg-black/30 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-8 h-8 border-4 border-t-cyan-400 border-r-cyan-400 border-b-gray-600 border-l-gray-600 rounded-full animate-spin mb-4"></div>
                <h3 className="font-orbitron text-xl text-cyan-300">Agent is Reviewing Code...</h3>
                <p className="text-gray-400 mt-2">Please wait while the AI analyzes the generated files.</p>
            </div>
        );
    }
    
    if (!review) {
         return (
            <div className="w-full h-full bg-black/30 flex items-center justify-center p-8 text-center">
                <p className="text-gray-400 font-fira-code">Generate a project to see the code review.</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full bg-black/30 p-6 overflow-y-auto custom-scrollbar">
            <div 
                className="prose prose-invert prose-sm max-w-none" 
                dangerouslySetInnerHTML={renderMarkdown(review)}
            />
        </div>
    );
};

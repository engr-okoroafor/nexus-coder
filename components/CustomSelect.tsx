
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronIcon } from './Icons';

interface CustomSelectProps {
    options: string[];
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    direction?: 'top' | 'bottom' | 'auto';
}

export const CustomSelect: React.FC<CustomSelectProps> = ({ options, value, onChange, disabled, direction = 'auto' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState<'top' | 'bottom'>('top');
    const [isAnimating, setIsAnimating] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const prevValueRef = useRef(value);

    // Effect to trigger animation on value change from props
    useEffect(() => {
        if (prevValueRef.current !== value) {
            setIsAnimating(true);
            const timer = setTimeout(() => setIsAnimating(false), 500); // Animation duration
            prevValueRef.current = value;
            return () => clearTimeout(timer);
        }
    }, [value]);

    const handleToggle = useCallback(() => {
        if (wrapperRef.current) {
            if (direction !== 'auto') {
                setPosition(direction);
            } else {
                const rect = wrapperRef.current.getBoundingClientRect();
                if (window.innerHeight - rect.bottom < 200) { // Check if not enough space below
                    setPosition('top');
                } else {
                    setPosition('bottom');
                }
            }
        }
        setIsOpen(prev => !prev);
    }, [direction]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (option: string) => {
        onChange(option);
        setIsOpen(false);
    };

    return (
        <div ref={wrapperRef} className="relative">
            <button
                type="button"
                onClick={handleToggle}
                disabled={disabled}
                className={`appearance-none cursor-pointer bg-purple-500/20 border border-purple-500/50 text-purple-200 rounded-3xl text-xs px-3 py-2.5 focus:ring-2 focus:ring-purple-400 focus:outline-none font-normal transition-all duration-300 hover:border-purple-400 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] w-full flex items-center justify-between ${isAnimating ? 'animate-flash' : ''}`}
            >
                <span className="truncate max-w-[120px]">{value}</span>
                <ChevronIcon direction="down" isOpen={isOpen} className="w-4 h-4 text-purple-300 ml-2 flex-shrink-0" />
            </button>
            {isOpen && (
                <div
                    className={`absolute z-20 w-full bg-gray-800/90 backdrop-blur-md border border-purple-500/50 rounded-3xl shadow-2xl py-1 mt-1 transition-all duration-300 ${position === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'}`}
                >
                    {options.map(option => (
                        <button
                            key={option}
                            onClick={() => handleSelect(option)}
                            className="w-full text-left px-3 py-2 text-xs text-gray-200 hover:bg-purple-500/20"
                        >
                            {option}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

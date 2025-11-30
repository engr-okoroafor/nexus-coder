/**
 * @file __tests__/utils.test.ts
 * @description Unit tests for utility functions.
 * 
 * NOTE: This is a sample test file to demonstrate structure. It cannot be executed
 * in the current web-based environment, which lacks a test runner like Jest.
 * In a standard development setup, you would run these tests via the command line.
 */

import { generateId, findFileByPath, formatRelativeTime } from '../utils';
import type { FileNode } from '../types';

// Mock test functions (these would be provided by Jest or Vitest)
const describe = (name: string, fn: () => void) => {
    console.log(`\n--- DESCRIBE: ${name} ---`);
    fn();
};
const it = (name: string, fn: () => void) => {
    try {
        fn();
        console.log(`  ✓ IT: ${name}`);
    } catch (error) {
        console.error(`  ✗ IT: ${name}`);
        console.error(error);
    }
};
const expect = (actual: any) => ({
    toBe: (expected: any) => { if (actual !== expected) throw new Error(`Expected ${actual} to be ${expected}`); },
    not: {
        toBeNull: () => { if (actual === null) throw new Error(`Expected not to be null`); }
    },
    toBeNull: () => { if (actual !== null) throw new Error(`Expected to be null`); },
    toBeTruthy: () => { if (!actual) throw new Error(`Expected to be truthy`); },
    stringContaining: (str: string) => { if (!actual.includes(str)) throw new Error(`Expected "${actual}" to contain "${str}"`); }
});

// --- Tests Start Here ---

describe('generateId', () => {
    it('should generate a non-empty string', () => {
        const id = generateId();
        expect(typeof id).toBe('string');
        expect(id.length > 0).toBeTruthy();
    });

    it('should generate unique IDs', () => {
        const id1 = generateId();
        const id2 = generateId();
        expect(id1 !== id2).toBeTruthy();
    });
});


describe('findFileByPath', () => {
    const fileTree: FileNode[] = [
        { id: '1', name: 'public', type: 'folder', path: '/public', children: [
            { id: '2', name: 'index.html', type: 'file', path: '/public/index.html', content: '' }
        ]},
        { id: '3', name: 'README.md', type: 'file', path: '/README.md', content: '' }
    ];

    it('should find a file at the root', () => {
        const found = findFileByPath('/README.md', fileTree);
        expect(found).not.toBeNull();
        expect(found?.id).toBe('3');
    });

    it('should find a nested file', () => {
        const found = findFileByPath('/public/index.html', fileTree);
        expect(found).not.toBeNull();
        expect(found?.id).toBe('2');
    });

    it('should return null for a non-existent file', () => {
        const found = findFileByPath('/src/app.js', fileTree);
        expect(found).toBeNull();
    });
});

describe('formatRelativeTime', () => {
    it('should return "just now" for times less than 5 seconds ago', () => {
        const date = new Date(Date.now() - 3 * 1000).toISOString();
        expect(formatRelativeTime(date)).toBe('just now');
    });

    it('should return seconds ago correctly', () => {
        const date = new Date(Date.now() - 30 * 1000).toISOString();
        expect(formatRelativeTime(date)).toBe('30 seconds ago');
    });

    it('should return minutes ago correctly', () => {
        const date = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        expect(formatRelativeTime(date)).toBe('5 minutes ago');
    });

    it('should return hours ago correctly', () => {
        const date = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
        expect(formatRelativeTime(date)).toBe('2 hours ago');
    });

    it('should return days ago correctly', () => {
        const date = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
        expect(formatRelativeTime(date)).toBe('3 days ago');
    });
});

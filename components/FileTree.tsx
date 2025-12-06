
import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import type { FileNode } from '../types';
import { NeonFolderIcon, FileIcon as DefaultFileIcon, ChevronIcon, TrashIcon, EditIcon, NewFileIcon, NewFolderIcon, CopyIcon, TargetIcon, LockIcon, CutIcon, HtmlFileIcon, CssFileIcon, JsFileIcon, TsxFileIcon, JsonFileIcon, PasteIcon } from './Icons';
import { ConfirmationModal } from './ConfirmationModal';
import { NewItemModal } from './NewItemModal';

type MenuItem = {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    isDestructive?: boolean;
    disabled?: boolean;
} | { isSeparator: true };

interface ContextMenuProps {
    x: number;
    y: number;
    items: MenuItem[];
    onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose }) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ top: y, left: x });

    useLayoutEffect(() => {
        if (menuRef.current) {
            const rect = menuRef.current.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            let newTop = y;
            let newLeft = x;

            if (y + rect.height > viewportHeight) {
                newTop = y - rect.height;
            }

            if (x + rect.width > viewportWidth) {
                newLeft = x - rect.width;
            }

            setPosition({ top: Math.max(0, newTop), left: Math.max(0, newLeft) });
        }
    }, [x, y]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const menuElement = (
        <div ref={menuRef} style={{ top: position.top, left: position.left }} className="fixed z-50 bg-gray-800/90 backdrop-blur-md border border-white/20 rounded-lg shadow-2xl w-52 py-2 animate-fade-in">
            {items.map((item, index) => (
                'isSeparator' in item ? <div key={index} className="h-px bg-white/10 my-1" /> :
                <button
                    key={index}
                    onClick={() => { if (!item.disabled) { item.onClick(); onClose(); } }}
                    disabled={item.disabled}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left ${item.isDestructive ? 'text-red-400 hover:bg-red-500/20' : 'text-gray-200 hover:bg-white/10'} ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''} transition-colors`}
                >
                    {item.icon}
                    {item.label}
                </button>
            ))}
        </div>
    );
    
    return createPortal(menuElement, document.body);
};

interface FileTreeItemProps {
    node: FileNode;
    selectedNodeIds: string[];
    onNodeClick: (node: FileNode, event: React.MouseEvent) => void;
    level: number;
    onContextMenu: (e: React.MouseEvent, node: FileNode) => void;
    onRenameNode: (nodeId: string, newName: string) => void;
    onSetEditingNode: (nodeId: string) => void;
    onMoveNode: (draggedId: string, targetId: string, position: 'before' | 'after' | 'inside') => void;
    onCreateNode: (name: string, type: 'file' | 'folder', parentId: string | null) => void;
    onDeleteNode: (nodeId: string) => void;
    onCopyPath: (path: string) => void;
    onCutNode: (node: FileNode) => void;
    onCopyNode: (node: FileNode) => void;
    onPasteNode: (parentId: string | null) => void;
    canPaste: boolean;
}

const FileTreeItem: React.FC<FileTreeItemProps> = ({ 
    node, selectedNodeIds, onNodeClick, level, onContextMenu, onRenameNode, onSetEditingNode, onMoveNode,
    onCreateNode, onDeleteNode, onCopyPath, onCutNode, onCopyNode, onPasteNode, canPaste
}) => {
    const [isOpen, setIsOpen] = useState(true);
    const [renameValue, setRenameValue] = useState(node.name);
    const [dragOverPosition, setDragOverPosition] = useState<'before' | 'after' | 'inside' | null>(null);
    const itemRef = useRef<HTMLDivElement>(null);

    const isSelected = selectedNodeIds.includes(node.id);
    const paddingLeft = `${level * 16 + 4}px`;

    const handleRename = () => {
        if (renameValue.trim() && renameValue.trim() !== node.name) {
            onRenameNode(node.id, renameValue.trim());
        } else {
            onRenameNode(node.id, node.name);
        }
    };

    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData('application/nexus-coder-node', node.id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        const rect = itemRef.current?.getBoundingClientRect();
        if (!rect) return;
        const hoverY = e.clientY - rect.top;
        const height = rect.height;
        
        // Define drop zones with clearer boundaries
        if (hoverY < height * 0.25) setDragOverPosition('before');
        else if (hoverY > height * 0.75 && node.type === 'folder') setDragOverPosition('after');
        else if (node.type === 'folder') setDragOverPosition('inside');
        else setDragOverPosition('after');
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const draggedId = e.dataTransfer.getData('application/nexus-coder-node');
        if (draggedId && draggedId !== node.id && dragOverPosition) {
            onMoveNode(draggedId, node.id, dragOverPosition);
        }
        setDragOverPosition(null);
    };

    const getDropIndicatorClass = () => {
        if (!dragOverPosition) return '';
        // Enhanced drag feedback: Brighter neon, clearer positioning, thicker borders
        if (dragOverPosition === 'before') return 'border-t-4 border-cyan-400 shadow-[0_-2px_8px_rgba(34,211,238,0.8)] z-10';
        if (dragOverPosition === 'after') return 'border-b-4 border-cyan-400 shadow-[0_2px_8px_rgba(34,211,238,0.8)] z-10';
        if (dragOverPosition === 'inside') return 'bg-cyan-500/30 ring-2 ring-inset ring-cyan-400';
        return '';
    };
    
    const getFileIcon = (filename: string) => {
        const iconClass = "h-5 w-5 mr-2 flex-shrink-0";
        const extension = filename.split('.').pop()?.toLowerCase();
        switch (extension) {
            case 'html': return <HtmlFileIcon className={iconClass} />;
            case 'css': return <CssFileIcon className={iconClass} />;
            case 'js': return <JsFileIcon className={iconClass} />;
            case 'ts':
            case 'tsx':
            case 'jsx': return <TsxFileIcon className={iconClass} />;
            case 'json': return <JsonFileIcon className={iconClass} />;
            default: return <DefaultFileIcon className={iconClass} />;
        }
    };

    const handleItemClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (node.type === 'folder') {
            setIsOpen(!isOpen);
        }
        onNodeClick(node, e);
    };

    const handleChevronClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
    }

    return (
        // Wrapper for drag/cut state
        <div className={`flex flex-col gap-0`}>
            <div 
                ref={itemRef} 
                className={`relative ${getDropIndicatorClass()} transition-all duration-75 group`}
                draggable="true"
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragLeave={() => setDragOverPosition(null)}
                onDrop={handleDrop}
                onContextMenu={(e) => onContextMenu(e, node)}
            >
                {/* Vertical Guide Line */}
                {level > 0 && <span className="absolute left-0 top-0 bottom-0 w-px bg-white/5" style={{ left: `${(level - 1) * 16 + 11}px` }}></span>}
                
                <div
                    className={`flex items-center h-10 px-1 rounded-sm cursor-pointer select-none transition-colors duration-100 ${
                        isSelected 
                            ? 'bg-purple-600/40 text-white' 
                            : dragOverPosition 
                                ? '' 
                                : 'hover:bg-white/5 text-gray-300 hover:text-white'
                    } ${node.isCut ? 'opacity-50 border border-dashed border-gray-500/50 rounded' : 'border border-transparent'}`}
                    style={{ paddingLeft }}
                    onClick={handleItemClick}
                    onDoubleClick={() => onSetEditingNode(node.id)}
                >
                    {node.type === 'folder' && (
                        <div 
                            className="mr-0.5 flex-shrink-0 text-gray-500 hover:text-white transition-colors p-0.5"
                            onClick={handleChevronClick}
                        >
                            <ChevronIcon isOpen={isOpen} className="h-4 w-4" />
                        </div>
                    )}
                    {node.type === 'file' && <div className="w-5 mr-0.5 flex-shrink-0" />}
                    
                    {node.type === 'folder' ? <NeonFolderIcon isOpen={isOpen} className="h-6 w-6 mr-2 flex-shrink-0" /> : getFileIcon(node.name)}
                    
                    {node.isEditing ? (
                        <input
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onBlur={handleRename}
                            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                            autoFocus
                            onClick={(e) => e.stopPropagation()} 
                            className="bg-black/50 border border-cyan-400 text-white text-base font-bold w-full p-1 focus:ring-1 focus:ring-cyan-500 rounded h-8"
                        />
                    ) : (
                        <span className={`truncate text-sm font-medium tracking-normal ${node.isCut ? 'italic text-gray-400' : ''}`}>{node.name}</span>
                    )}
                </div>
            </div>
            
            {node.type === 'folder' && isOpen && (
                <div className="flex flex-col gap-0">
                    {node.children && node.children.length > 0 && (
                        <FileTree
                            files={node.children}
                            parentId={node.id}
                            onNodeClick={onNodeClick} 
                            selectedNodeIds={selectedNodeIds} 
                            level={level + 1}
                            onRenameNode={onRenameNode} 
                            onSetEditingNode={onSetEditingNode} 
                            onMoveNode={onMoveNode}
                            onCreateNode={onCreateNode}
                            onDeleteNode={onDeleteNode}
                            onCopyPath={onCopyPath}
                            onCutNode={onCutNode}
                            onCopyNode={onCopyNode}
                            onPasteNode={onPasteNode}
                            canPaste={canPaste}
                        />
                    )}
                </div>
            )}
        </div>
    );
}

interface FileTreeProps {
    files: FileNode[];
    parentId?: string | null;
    selectedNodeIds: string[];
    onNodeClick: (node: FileNode, event: React.MouseEvent) => void;
    level?: number;
    onCreateNode: (name: string, type: 'file' | 'folder', parentId: string | null) => void;
    onDeleteNode: (nodeId: string) => void;
    onRenameNode: (nodeId: string, newName: string) => void;
    onMoveNode: (draggedId: string, targetId: string, position: 'before' | 'after' | 'inside') => void;
    onSetEditingNode: (nodeId: string) => void;
    onCopyPath: (path: string) => void;
    onCutNode: (node: FileNode) => void;
    onCopyNode: (node: FileNode) => void;
    onPasteNode: (parentId: string | null) => void;
    canPaste: boolean;
}

export const FileTree: React.FC<FileTreeProps> = (props) => {
    const { files, level = 0, parentId = null, onCreateNode, onDeleteNode, onCutNode, onCopyNode, onPasteNode, canPaste, onCopyPath, onSetEditingNode } = props;
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node: FileNode | null; targetId: string | null } | null>(null);
    const [nodeToDelete, setNodeToDelete] = useState<FileNode | null>(null);
    const [newItemInfo, setNewItemInfo] = useState<{ type: 'file' | 'folder'; parentId: string | null } | null>(null);

    const handleContextMenu = (e: React.MouseEvent, node: FileNode | null) => {
        e.preventDefault();
        e.stopPropagation();
        
        let targetId = parentId;
        if (node) {
            if (node.type === 'folder') {
                targetId = node.id;
            }
        }
        
        // Calculate viewport-aware position to prevent truncation
        let x = e.clientX;
        let y = e.clientY;
        
        // Adjust if menu would go off bottom of screen
        if (y + 300 > window.innerHeight) {
            y = y - 300; // Flip upwards
        }

        setContextMenu({ x, y, node, targetId });
    };

    const getContextMenuItems = (): MenuItem[] => {
        if (!contextMenu) return [];
        
        const { node, targetId } = contextMenu;

        if (node) {
            return [
                { label: 'New File...', icon: <NewFileIcon className="w-4 h-4"/>, onClick: () => setNewItemInfo({ type: 'file', parentId: targetId }) },
                { label: 'New Folder...', icon: <NewFolderIcon className="w-4 h-4"/>, onClick: () => setNewItemInfo({ type: 'folder', parentId: targetId }) },
                { isSeparator: true },
                { label: 'Cut', icon: <CutIcon className="w-4 h-4"/>, onClick: () => onCutNode(node) },
                { label: 'Copy', icon: <CopyIcon className="w-4 h-4"/>, onClick: () => onCopyNode(node) },
                { label: 'Paste', icon: <PasteIcon className="w-4 h-4"/>, onClick: () => onPasteNode(targetId), disabled: !canPaste },
                { isSeparator: true },
                { label: 'Copy Path', icon: <CopyIcon className="w-4 h-4"/>, onClick: () => onCopyPath(node.path) },
                { label: 'Copy Relative Path', icon: <CopyIcon className="w-4 h-4"/>, onClick: () => onCopyPath(node.path.startsWith('/') ? node.path.substring(1) : node.path) },
                { isSeparator: true },
                { label: 'Rename...', icon: <EditIcon className="w-4 h-4"/>, onClick: () => onSetEditingNode(node.id) },
                { label: 'Delete', icon: <TrashIcon className="w-4 h-4"/>, onClick: () => setNodeToDelete(node), isDestructive: true }
            ];
        }
        
        return [
            { label: 'New File...', icon: <NewFileIcon className="w-4 h-4"/>, onClick: () => setNewItemInfo({ type: 'file', parentId: targetId }) },
            { label: 'New Folder...', icon: <NewFolderIcon className="w-4 h-4"/>, onClick: () => setNewItemInfo({ type: 'folder', parentId: targetId }) },
            { label: 'Paste', icon: <PasteIcon className="w-4 h-4"/>, onClick: () => onPasteNode(targetId), disabled: !canPaste },
            { isSeparator: true },
            { label: 'Copy Path', icon: <CopyIcon className="w-4 h-4"/>, onClick: () => onCopyPath('/') },
            { label: 'Copy Relative Path', icon: <CopyIcon className="w-4 h-4"/>, onClick: () => onCopyPath('') }
        ];
    };

    // Conditional styling to fix uneven spacing issues in recursive rendering
    // Only apply the full container styles (min-height, bottom padding) to the top-level tree
    const containerClasses = level === 0 
        ? "text-base min-h-full pb-10 select-none flex flex-col gap-0" 
        : "text-base flex flex-col gap-0 select-none";

    return (
        <div className={containerClasses} onContextMenu={(e) => {
            if (e.target === e.currentTarget) {
                handleContextMenu(e, null);
            }
        }}>
            {files.map((node) => (
                <FileTreeItem
                    key={node.id}
                    node={node}
                    level={level}
                    onContextMenu={handleContextMenu}
                    {...props}
                />
            ))}

            {contextMenu && <ContextMenu x={contextMenu.x} y={contextMenu.y} items={getContextMenuItems()} onClose={() => setContextMenu(null)} />}
            
            {nodeToDelete && (
                <ConfirmationModal
                    title={`Delete ${nodeToDelete.name}?`}
                    message={`Are you sure you want to permanently delete this ${nodeToDelete.type}? This action cannot be undone.`}
                    onConfirm={() => { onDeleteNode(nodeToDelete.id); setNodeToDelete(null); }}
                    onCancel={() => setNodeToDelete(null)}
                />
            )}

            {newItemInfo && (
                <NewItemModal
                    itemType={newItemInfo.type}
                    onConfirm={(name) => { onCreateNode(name, newItemInfo.type, newItemInfo.parentId); setNewItemInfo(null); }}
                    onCancel={() => setNewItemInfo(null)}
                />
            )}
        </div>
    );
};

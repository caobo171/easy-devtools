import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button.tsx';
import { Tools } from '../types';

export type Tool = {
	id: keyof typeof Tools;
	name: string;
	icon: string;
	keywords?: string[];
};

interface SidebarProps {
	tools: Tool[];
	selectedTool: string | null;
	onSelectTool: (toolId: keyof typeof Tools) => void;
}

export default function Sidebar({ tools, selectedTool, onSelectTool }: SidebarProps) {
	const [isExpanded, setIsExpanded] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [hovering, setHovering] = useState(false);
	const expandTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const sidebarRef = useRef<HTMLDivElement>(null);

	// Filter tools based on search query
	const filteredTools = tools.filter(tool => {
		if (!searchQuery) return true;
		const query = searchQuery.toLowerCase();
		return (
			tool.name.toLowerCase().includes(query) ||
			tool.keywords?.some(keyword => keyword.toLowerCase().includes(query))
		);
	});

	// Handle mouse enter/leave with delay
	const handleMouseEnter = () => {
		setHovering(true);
		if (expandTimeoutRef.current) {
			clearTimeout(expandTimeoutRef.current);
		}
		expandTimeoutRef.current = setTimeout(() => {
			setIsExpanded(true);
		}, 300); // Delay expansion to prevent flicker on quick mouse movements
	};

	const handleMouseLeave = () => {
		setHovering(false);
		if (expandTimeoutRef.current) {
			clearTimeout(expandTimeoutRef.current);
		}
		expandTimeoutRef.current = setTimeout(() => {
			if (!hovering) {
				setIsExpanded(false);
				setSearchQuery(''); // Clear search when sidebar collapses
			}
		}, 300);
	};

	// Click outside handler to collapse sidebar
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
				setIsExpanded(false);
				setSearchQuery('');
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	return (
		<div 
			ref={sidebarRef}
			className={cn(
				"h-full flex flex-col border-l bg-gray-50 dark:bg-gray-900 transition-all duration-300 ease-in-out z-10",
				isExpanded ? "w-64" : "w-16"
			)}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
		>
			{/* Header */}
			<div className="p-3 border-b flex items-center justify-between">
				{isExpanded ? (
					<div className="w-full">
						<Input
							type="text"
							placeholder="Search tools..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full text-sm"
						/>
					</div>
				) : (
					<div className="w-full flex justify-center">
						<span className="text-lg">🧰</span>
					</div>
				)}
			</div>

			{/* Tools list */}
			<div className="flex-1 p-2 overflow-y-auto">
				{filteredTools.map((tool) => (
					<button
						key={tool.id}
						onClick={() => onSelectTool(tool.id)}
						className={cn(
							"w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors mb-2",
							selectedTool === tool.id
								? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
								: "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
						)}
					>
						<span className="text-lg flex-shrink-0">{tool.icon}</span>
						{isExpanded && (
							<span className="text-sm font-medium truncate">{tool.name}</span>
						)}
					</button>
				))}

				{filteredTools.length === 0 && (
					<div className="text-center text-gray-500 p-4">
						No tools found
					</div>
				)}
			</div>

			{/* Expand/collapse button */}
			<div className="p-2 border-t">
				<button 
					className="w-full flex justify-center p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
					onClick={() => setIsExpanded(!isExpanded)}
				>
					{isExpanded ? '◀' : '▶'}
				</button>
			</div>
		</div>
	);
}

import React, { useEffect, useState } from 'react';
import './App.module.css';
import '../../assets/main.css'
import { browser } from "wxt/browser";
import ExtMessage, { MessageType } from "@/entrypoints/types.ts";
import { useTheme } from "@/components/theme-provider.tsx";
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import DateFormat from './Tools/DateFormat';
import BeautifyJSON from './Tools/BeautifyJSON';
import URLEncoder from './Tools/URLEncoder';
import Base64Encoder from './Tools/Base64Encoder';
import HashGenerator from './Tools/HashGenerator';
import ColorConverter from './Tools/ColorConverter';
import MarkdownPreview from './Tools/MarkdownPreview';
import ScreenshotTool from './Tools/ScreenshotTool';
import VideoRecordingTool from './Tools/VideoEditingTool';
import { ToolStateProvider, useToolState } from '@/lib/toolStateContext';
import Sidebar, { Tool } from './Sidebar';
import GenerateFile from './Tools/GenerateFile';

type ToolWithComponent = Tool & {
	component: React.ComponentType;
};

const tools: ToolWithComponent[] = [
	{ id: 'dateformat', name: 'Date Format', icon: '📅', keywords: ['time', 'calendar', 'date'], component: DateFormat },
	{ id: 'beautifyjson', name: 'JSON Beautifier', icon: '🎨', keywords: ['format', 'json', 'pretty'], component: BeautifyJSON },
	{ id: 'urlencoder', name: 'URL Encoder', icon: '🔗', keywords: ['encode', 'decode', 'url'], component: URLEncoder },
	{ id: 'base64encoder', name: 'Base64 Encoder', icon: '🔐', keywords: ['encode', 'decode', 'base64'], component: Base64Encoder },
	{ id: 'hashgenerator', name: 'Hash Generator', icon: '🔐', keywords: ['md5', 'sha', 'hash'], component: HashGenerator },
	{ id: 'colorconverter', name: 'Color Converter', icon: '🎨', keywords: ['hex', 'rgb', 'hsl', 'color'], component: ColorConverter },
	{ id: 'markdownpreview', name: 'Markdown Preview', icon: '📝', keywords: ['md', 'markdown', 'preview'], component: MarkdownPreview },
	{ id: 'screenshot', name: 'Screenshot Tool', icon: '📸', keywords: ['capture', 'image', 'screen', 'crop'], component: ScreenshotTool },
	{ id: 'videorecording', name: 'Video Recording', icon: '🎥', keywords: ['record', 'video', 'screen', 'capture'], component: VideoRecordingTool },
	{ id: 'translate', name: 'Translate', icon: '🌐', keywords: ['language', 'translation'], component: () => <div>Translate Tool</div> },
	{ id: 'ocr', name: 'OCR', icon: '📄', keywords: ['text', 'image', 'recognition'], component: () => <div>OCR Tool</div> },
	{ id: 'grammar', name: 'Grammar', icon: '✍️', keywords: ['spelling', 'check', 'writing'], component: () => <div>Grammar Tool</div> },
	{ id: 'generatefile', name: 'Generate File', icon: '📄', keywords: ['text', 'image', 'recognition'], component: GenerateFile },
];

// Main app component that will be wrapped with ToolStateProvider
const AppContent = () => {
	const { lastSelectedTool, setLastSelectedTool } = useToolState();
	const [selectedTool, setSelectedTool] = useState<string | null>(lastSelectedTool);
	const { theme, toggleTheme } = useTheme();
	const { t, i18n } = useTranslation();
	
	// Update global state when selected tool changes
	const handleToolSelect = (toolId: string) => {
		setSelectedTool(toolId);
		setLastSelectedTool(toolId);
	};

	async function initI18n() {
		let data = await browser.storage.local.get('i18n');
		if (data.i18n) {
			await i18n.changeLanguage(data.i18n)
		}
	}

	useEffect(() => {
		browser.runtime.onMessage.addListener((message: ExtMessage, sender, sendResponse) => {
			console.log('sidepanel:')
			console.log(message)
			if (message.messageType == MessageType.changeLocale) {
				i18n.changeLanguage(message.content)
			} else if (message.messageType == MessageType.changeTheme) {
				toggleTheme(message.content)
			} else if (message.messageType == MessageType.convertToReadableDate) {
				// Show DateFormat tool when date conversion is requested
				handleToolSelect('dateformat');
			} else if (message.messageType == MessageType.openInSidebar) {
				// Handle opening content in sidebar - you can customize which tool to show
				// For now, let's show the first tool or a default tool
				handleToolSelect('dateformat'); // or any other appropriate tool
			} else if (message.messageType == MessageType.takeScreenshot) {
				// Handle take screenshot from context menu
				handleToolSelect('screenshot');
			} else if (message.messageType == MessageType.analyzeText) {
				// Handle analyze text from context menu
				handleToolSelect('translate'); // or create a dedicated analyze tool
			}
		});

		initI18n();
	}, []);


	const renderSelectedTool = () => {
		if (!selectedTool) {
			return (
				<div className="flex items-center justify-center h-full text-gray-500">
					<div className="text-center">
						<h2 className="text-2xl font-semibold mb-2">Welcome to DevTools</h2>
						<p>Select a tool from the sidebar to get started</p>
					</div>
				</div>
			);
		}

		const tool = tools.find(t => t.id === selectedTool);
		if (!tool) return null;

		const ToolComponent = tool.component;
		return <ToolComponent />;
	};


	return (
		<div className={cn(theme, 'h-full flex overflow-hidden')}>  
			{/* Main workspace */}
			<div className="flex-1 flex flex-col min-w-0">
				{/* Header */}
				<div className="border-b p-4">
					<h1 className="text-xl font-semibold">DevTools Extension</h1>
				</div>
				
				{/* Main content area */}
				<div className="flex-1 p-4 overflow-auto">
					<div className="w-full min-w-0">
						{renderSelectedTool()}
					</div>
				</div>
			</div>

			{/* Tools sidebar */}
			<Sidebar 
				tools={tools}
				selectedTool={selectedTool}
				onSelectTool={handleToolSelect}
			/>
		</div>
	)
};

// Export the main component wrapped with ToolStateProvider
export default () => {
	return (
		<ToolStateProvider>
			<AppContent />
		</ToolStateProvider>
	);
};

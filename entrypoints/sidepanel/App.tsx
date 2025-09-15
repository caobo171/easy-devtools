import React, { useEffect, useState } from 'react';
import './App.module.css';
import '../../assets/main.css'
import { browser } from "wxt/browser";
import ExtMessage, { MessageType, Tools } from "@/entrypoints/types.ts";
import { useTheme } from "@/components/theme-provider.tsx";
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import DateFormatTool from './Tools/DateFormatTool';
import BeautifyJSON from './Tools/BeautifyJSON';
import URLEncoder from './Tools/URLEncoder';
import Base64Encoder from './Tools/Base64Encoder';
import HashGenerator from './Tools/HashGenerator';
import ColorConverter from './Tools/ColorConverter';
import MarkdownPreview from './Tools/MarkdownPreview';
import ScreenshotTool from './Tools/ScreenshotTool';
import VideoRecordingTool from './Tools/VideoEditingTool';
import { ToolStateProvider, useToolState } from '@/lib/toolStateContext';
import ToolsPopup, { Tool } from './ToolsPopup';
import GenerateFile from './Tools/GenerateFile';

type ToolWithComponent = Tool & {
	component: React.ComponentType;
};

const tools: ToolWithComponent[] = [
	{ id: 'convertToReadableDate', name: 'Date Format', icon: '📅', keywords: ['time', 'calendar', 'date'], component: DateFormatTool },
	{ id: 'beautifyJSON', name: 'JSON Beautifier', icon: '🎨', keywords: ['format', 'json', 'pretty'], component: BeautifyJSON },
	{ id: 'urlEncoder', name: 'URL Encoder', icon: '🔗', keywords: ['encode', 'decode', 'url'], component: URLEncoder },
	{ id: 'base64Encoder', name: 'Base64 Encoder', icon: '🔐', keywords: ['encode', 'decode', 'base64'], component: Base64Encoder },
	{ id: 'hashGenerator', name: 'Hash Generator', icon: '🔐', keywords: ['md5', 'sha', 'hash'], component: HashGenerator },
	{ id: 'colorConverter', name: 'Color Converter', icon: '🎨', keywords: ['hex', 'rgb', 'hsl', 'color'], component: ColorConverter },
	{ id: 'markdownPreview', name: 'Markdown Preview', icon: '📝', keywords: ['md', 'markdown', 'preview'], component: MarkdownPreview },
	{ id: 'generateFile', name: 'Generate File', icon: '📄', keywords: ['text', 'image', 'recognition'], component: GenerateFile },
];

// Main app component that will be wrapped with ToolStateProvider
const AppContent = () => {
	const { currentSelectedTool, setCurrentSelectedTool, toolState, updateToolState } = useToolState();
	const { theme, toggleTheme } = useTheme();
	const { t, i18n } = useTranslation();

	// Update global state when selected tool changes
	const handleToolSelect = (toolId: keyof typeof Tools) => {
		setCurrentSelectedTool(toolId);
	};

	async function initI18n() {
		let data = await browser.storage.local.get('i18n');
		if (data.i18n) {
			await i18n.changeLanguage(data.i18n)
		}
	}


	useEffect(() => {

		// Set up message listener
		browser.runtime.onMessage.addListener((message: ExtMessage, sender, sendResponse) => {
			console.log('sidepanel:')
			console.log(message)
			if (message.messageType == MessageType.changeLocale) {
				i18n.changeLanguage(message.content)
			} else if (message.messageType == MessageType.changeTheme) {
				toggleTheme(message.content)
			} else if (message.messageType == MessageType.convertToReadableDateInSidepanel) {
				// Show DateFormat tool when date conversion is requested
				handleToolSelect('convertToReadableDate');
			} else if (message.messageType == MessageType.takeScreenshot) {
				// Handle take screenshot from context menu
				handleToolSelect('takeScreenshot');
			}
		});

		initI18n();
	}, []);


	const renderSelectedTool = () => {
		if (!currentSelectedTool) {
			return (
				<div className="flex items-center justify-center h-full text-gray-500">
					<div className="text-center">
						<h2 className="text-2xl font-semibold mb-2">Welcome to DevTools</h2>
						<p>Select a tool from the sidebar to get started</p>
					</div>
				</div>
			);
		}

		const tool = tools.find(t => t.id === currentSelectedTool);
		if (!tool) return null;

		const ToolComponent = tool.component;
		return <ToolComponent />;
	};


	return (
		<div className={cn(theme, 'h-full flex flex-col overflow-hidden relative')}>
			{/* Main content area */}
			<div className="flex-1 p-4 overflow-auto">
				<div className="w-full min-w-0">
					{renderSelectedTool()}
				</div>
			</div>

			{/* Tools popup */}
			<ToolsPopup
				tools={tools}
				selectedTool={currentSelectedTool}
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

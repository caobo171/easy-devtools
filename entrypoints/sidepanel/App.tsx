import React, { useEffect, useRef, useState } from 'react';
import './App.module.css';
import '../../assets/main.css'
import Sidebar, { SidebarType } from "@/entrypoints/sidebar.tsx";
import { browser } from "wxt/browser";
import ExtMessage, { MessageType } from "@/entrypoints/types.ts";
import { Button } from "@/components/ui/button.tsx";
import { Card } from "@/components/ui/card.tsx";
import { Home } from "@/entrypoints/sidepanel/home.tsx";
import { SettingsPage } from "@/entrypoints/sidepanel/settings.tsx";
import { useTheme } from "@/components/theme-provider.tsx";
import { useTranslation } from 'react-i18next';
import Header from "@/entrypoints/sidepanel/header.tsx";
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import DateFormat from './Tools/DateFormat';
import BeautifyJSON from './Tools/BeautifyJSON';
import URLEncoder from './Tools/URLEncoder';
import Base64Encoder from './Tools/Base64Encoder';
import HashGenerator from './Tools/HashGenerator';
import ColorConverter from './Tools/ColorConverter';
import MarkdownPreview from './Tools/MarkdownPreview';

type Tool = {
	id: string;
	name: string;
	icon: string;
	component: React.ComponentType;
};

const tools: Tool[] = [
	{ id: 'dateformat', name: 'Date Format', icon: '📅', component: DateFormat },
	{ id: 'beautifyjson', name: 'JSON Beautifier', icon: '🎨', component: BeautifyJSON },
	{ id: 'urlencoder', name: 'URL Encoder', icon: '🔗', component: URLEncoder },
	{ id: 'base64encoder', name: 'Base64 Encoder', icon: '🔐', component: Base64Encoder },
	{ id: 'hashgenerator', name: 'Hash Generator', icon: '🔐', component: HashGenerator },
	{ id: 'colorconverter', name: 'Color Converter', icon: '🎨', component: ColorConverter },
	{ id: 'markdownpreview', name: 'Markdown Preview', icon: '📝', component: MarkdownPreview },
	{ id: 'translate', name: 'Translate', icon: '🌐', component: () => <div>Translate Tool</div> },
	{ id: 'ocr', name: 'OCR', icon: '📄', component: () => <div>OCR Tool</div> },
	{ id: 'grammar', name: 'Grammar', icon: '✍️', component: () => <div>Grammar Tool</div> },
];

export default () => {
	const [selectedTool, setSelectedTool] = useState<string | null>(null);
	const { theme, toggleTheme } = useTheme();
	const { t, i18n } = useTranslation();

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
				setSelectedTool('dateformat');
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
		<div className={cn(theme, 'h-full flex')}>
			{/* Main workspace */}
			<div className="flex-1 flex flex-col">
				{/* Header */}
				<div className="border-b p-4">
					<h1 className="text-xl font-semibold">DevTools Extension</h1>
					<p className="text-sm text-gray-600">Your development toolkit</p>
				</div>
				
				{/* Main content area */}
				<div className="flex-1 p-4">
					{renderSelectedTool()}
				</div>
			</div>

			{/* Tools sidebar */}
			<div className="w-64 border-l bg-gray-50 dark:bg-gray-900 flex flex-col">
				<div className="p-4 border-b">
					<h2 className="font-semibold text-sm text-gray-700 dark:text-gray-300">TOOLS</h2>
				</div>
				
				<div className="flex-1 p-2">
					{tools.map((tool) => (
						<button
							key={tool.id}
							onClick={() => setSelectedTool(tool.id)}
							className={cn(
								"w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors mb-2",
								selectedTool === tool.id
									? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
									: "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
							)}
						>
							<span className="text-lg">{tool.icon}</span>
							<span className="text-sm font-medium">{tool.name}</span>
						</button>
					))}
				</div>
			</div>
		</div>
	)
};

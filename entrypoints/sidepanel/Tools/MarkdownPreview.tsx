import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { marked } from 'marked';

export default function MarkdownPreview() {
    const [markdown, setMarkdown] = useState('# Welcome to Markdown Preview\n\nType your **markdown** here and see the *preview* on the right!\n\n## Features\n- **Bold text**\n- *Italic text*\n- `Code snippets`\n- [Links](https://example.com)\n- Lists and more!\n\n```javascript\nconst hello = "world";\nconsole.log(hello);\n```');

    // Configure marked options for better security and features
    marked.setOptions({
        breaks: true,
        gfm: true
    });

    // Convert markdown to HTML using marked library
    const convertMarkdownToHTML = (md: string): string => {
        try {
            return marked(md) as string;
        } catch (error) {
            return '<p>Error parsing markdown</p>';
        }
    };

    const copyMarkdown = () => {
        navigator.clipboard.writeText(markdown);
    };

    const copyHTML = () => {
        navigator.clipboard.writeText(convertMarkdownToHTML(markdown));
    };

    const clearAll = () => {
        setMarkdown('');
    };

    const loadSample = () => {
        setMarkdown(`# Markdown Preview Sample

## Introduction
This is a **comprehensive markdown document** to demonstrate all supported features.

### Text Formatting
- **Bold text** with \`**text**\` or \`__text__\`
- *Italic text* with \`*text*\` or \`_text_\`
- ***Bold and italic*** with \`***text***\`
- ~~Strikethrough~~ with \`~~text~~\`
- \`Inline code\` with backticks

### Links and Images
- [External link](https://example.com) - \`[text](url)\`
- [Link with title](https://example.com "Example Site") - \`[text](url "title")\`
- ![Sample Image](https://via.placeholder.com/300x200/4F46E5/FFFFFF?text=Sample+Image) - \`![alt](url)\`

### Headers
# Header 1 (\`# Header 1\`)
## Header 2 (\`## Header 2\`)
### Header 3 (\`### Header 3\`)
#### Header 4 (\`#### Header 4\`)
##### Header 5 (\`##### Header 5\`)
###### Header 6 (\`###### Header 6\`)

### Lists

#### Unordered Lists
- First item
- Second item
  - Nested item
  - Another nested item
- Third item

#### Ordered Lists
1. First item
2. Second item
   1. Nested numbered item
   2. Another nested item
3. Third item

#### Task Lists
- [x] Completed task
- [ ] Incomplete task
- [ ] Another task

### Code Blocks

#### JavaScript
\`\`\`javascript
function greet(name) {
    return \`Hello, \${name}!\`;
}

console.log(greet("World"));
\`\`\`

#### Python
\`\`\`python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print(fibonacci(10))
\`\`\`

### Tables
| Feature | Supported | Notes |
|---------|-----------|-------|
| Headers | ✅ | All 6 levels |
| Links | ✅ | External and internal |
| Images | ✅ | With alt text |
| Tables | ✅ | With alignment |
| Code | ✅ | Inline and blocks |

### Blockquotes
> This is a blockquote.
> 
> It can span multiple lines and contain other markdown elements like **bold text** and [links](https://example.com).

### Horizontal Rule
---

### Advanced Features
1. **Nested formatting**: You can combine ***bold and italic*** text
2. **Code in lists**: Use \`console.log()\` in your JavaScript
3. **Links in tables**: [GitHub](https://github.com) works in tables
4. **Images with links**: [![Alt text](https://via.placeholder.com/100x50)](https://example.com)

Happy writing! 🚀 All these features are now properly styled and rendered.`);
    };

    return (
        <div className="space-y-6">
            <style>{`
                .markdown-content {
                    line-height: 1.6;
                }
                .markdown-content h1 {
                    font-size: 2rem;
                    font-weight: bold;
                    margin: 1.5rem 0 1rem 0;
                    color: #1f2937;
                }
                .markdown-content h2 {
                    font-size: 1.5rem;
                    font-weight: bold;
                    margin: 1.25rem 0 0.75rem 0;
                    color: #374151;
                }
                .markdown-content h3 {
                    font-size: 1.25rem;
                    font-weight: bold;
                    margin: 1rem 0 0.5rem 0;
                    color: #4b5563;
                }
                .markdown-content h4 {
                    font-size: 1.125rem;
                    font-weight: bold;
                    margin: 0.875rem 0 0.5rem 0;
                    color: #6b7280;
                }
                .markdown-content h5 {
                    font-size: 1rem;
                    font-weight: bold;
                    margin: 0.75rem 0 0.25rem 0;
                    color: #6b7280;
                }
                .markdown-content h6 {
                    font-size: 0.875rem;
                    font-weight: bold;
                    margin: 0.75rem 0 0.25rem 0;
                    color: #9ca3af;
                }
                .markdown-content p {
                    margin: 0.75rem 0;
                }
                .markdown-content ul, .markdown-content ol {
                    margin: 0.75rem 0;
                    padding-left: 1.5rem;
                }
                .markdown-content li {
                    margin: 0.25rem 0;
                }
                .markdown-content ul {
                    list-style-type: disc;
                }
                .markdown-content ol {
                    list-style-type: decimal;
                }
                .markdown-content a {
                    color: #3b82f6;
                    text-decoration: underline;
                }
                .markdown-content a:hover {
                    color: #1d4ed8;
                }
                .markdown-content code {
                    background-color: #f3f4f6;
                    padding: 0.125rem 0.25rem;
                    border-radius: 0.25rem;
                    font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
                    font-size: 0.875rem;
                }
                .markdown-content pre {
                    background-color: #f3f4f6;
                    padding: 1rem;
                    border-radius: 0.5rem;
                    overflow-x: auto;
                    margin: 1rem 0;
                }
                .markdown-content pre code {
                    background-color: transparent;
                    padding: 0;
                }
                .markdown-content blockquote {
                    border-left: 4px solid #d1d5db;
                    padding-left: 1rem;
                    margin: 1rem 0;
                    font-style: italic;
                    color: #6b7280;
                }
                .markdown-content table {
                    border-collapse: collapse;
                    width: 100%;
                    margin: 1rem 0;
                }
                .markdown-content th, .markdown-content td {
                    border: 1px solid #d1d5db;
                    padding: 0.5rem;
                    text-align: left;
                }
                .markdown-content th {
                    background-color: #f9fafb;
                    font-weight: bold;
                }
                .markdown-content img {
                    max-width: 100%;
                    height: auto;
                    border-radius: 0.5rem;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }
                .markdown-content hr {
                    border: none;
                    border-top: 1px solid #d1d5db;
                    margin: 2rem 0;
                }
                /* Dark mode styles */
                .dark .markdown-content h1 {
                    color: #f9fafb;
                }
                .dark .markdown-content h2 {
                    color: #f3f4f6;
                }
                .dark .markdown-content h3 {
                    color: #e5e7eb;
                }
                .dark .markdown-content h4, .dark .markdown-content h5 {
                    color: #d1d5db;
                }
                .dark .markdown-content h6 {
                    color: #9ca3af;
                }
                .dark .markdown-content code {
                    background-color: #374151;
                    color: #f9fafb;
                }
                .dark .markdown-content pre {
                    background-color: #374151;
                }
                .dark .markdown-content blockquote {
                    border-left-color: #6b7280;
                    color: #9ca3af;
                }
                .dark .markdown-content th, .dark .markdown-content td {
                    border-color: #6b7280;
                }
                .dark .markdown-content th {
                    background-color: #374151;
                }
                .dark .markdown-content a {
                    color: #60a5fa;
                }
                .dark .markdown-content a:hover {
                    color: #93c5fd;
                }
            `}</style>
            <div>
                <h2 className="text-2xl font-bold mb-2">📝 Markdown Preview</h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Write markdown on the left and see the live preview on the right.
                </p>
            </div>

            <div className="flex gap-2 mb-4">
                <Button onClick={loadSample} variant="outline">
                    📄 Load Sample
                </Button>
                <Button onClick={copyMarkdown} variant="outline">
                    📋 Copy Markdown
                </Button>
                <Button onClick={copyHTML} variant="outline">
                    🔗 Copy HTML
                </Button>
                <Button onClick={clearAll} variant="outline">
                    🗑️ Clear
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Markdown Input */}
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Markdown Input
                    </label>
                    <textarea
                        value={markdown}
                        onChange={(e) => setMarkdown(e.target.value)}
                        placeholder="Type your markdown here..."
                        className="w-full h-96 p-3 border rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* HTML Preview */}
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Live Preview
                    </label>
                    <Card className="h-96 overflow-auto">
                        <div 
                            className="p-4 markdown-content"
                            dangerouslySetInnerHTML={{ __html: convertMarkdownToHTML(markdown) }}
                        />
                    </Card>
                </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                    💡 Supported Markdown:
                </h4>
                <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <p><strong>Text Formatting:</strong></p>
                            <ul className="list-disc list-inside space-y-1">
                                <li><code>**bold**</code> or <code>__bold__</code></li>
                                <li><code>*italic*</code> or <code>_italic_</code></li>
                                <li><code>***bold italic***</code></li>
                                <li><code>~~strikethrough~~</code></li>
                                <li><code>`inline code`</code></li>
                            </ul>
                        </div>
                        <div>
                            <p><strong>Structure:</strong></p>
                            <ul className="list-disc list-inside space-y-1">
                                <li><code># Header 1-6</code></li>
                                <li><code>- List item</code> or <code>1. Numbered</code></li>
                                <li><code>- [x] Task list</code></li>
                                <li><code>{'>'} Blockquote</code></li>
                                <li><code>---</code> Horizontal rule</li>
                            </ul>
                        </div>
                        <div>
                            <p><strong>Media & Links:</strong></p>
                            <ul className="list-disc list-inside space-y-1">
                                <li><code>[Link](url)</code></li>
                                <li><code>![Image](url)</code></li>
                                <li><code>| Table | Cell |</code></li>
                                <li><code>```code blocks```</code></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
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
                            className="p-4 prose prose-sm max-w-none dark:prose-invert prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:mb-4 prose-ul:list-disc prose-ol:list-decimal prose-li:ml-4 prose-a:text-blue-600 prose-a:underline hover:prose-a:text-blue-800 prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded prose-pre:bg-gray-100 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-4 prose-blockquote:italic prose-table:border-collapse prose-th:border prose-th:border-gray-300 prose-th:p-2 prose-th:bg-gray-50 prose-td:border prose-td:border-gray-300 prose-td:p-2 prose-img:max-w-full prose-img:h-auto prose-img:rounded-lg prose-img:shadow-md dark:prose-code:bg-gray-800 dark:prose-pre:bg-gray-800 dark:prose-th:bg-gray-800 dark:prose-a:text-blue-400"
                            dangerouslySetInnerHTML={{ __html: convertMarkdownToHTML(markdown) }}
                            style={{
                                lineHeight: '1.6',
                            }}
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
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';

// 将来可以从实际文件系统读取
const getPromptContent = (slug: string, fileType: string): string => {
  // 示例内容，实际项目应从文件读取
  return `# ${slug} 的 ${fileType} 内容

这里是 ${slug} 工具的 ${fileType} 详细内容。

\`\`\`
function exampleFunction() {
  console.log("这是示例代码");
  return "Hello World";
}
\`\`\`

## 系统提示词解释

这部分内容展示系统提示词的工作原理。

- 第一点说明
- 第二点说明
- 第三点说明

`;
};

// 获取文件类型的显示名称
const getFileTypeName = (fileType: string): string => {
  switch (fileType) {
    case 'v0-prompt':
      return 'v0 系统提示词';
    case 'v0-tools':
      return 'v0 内部工具';
    case 'cursor-prompt':
      return 'Cursor 系统提示词';
    case 'manus-prompt':
      return 'Manus 系统提示词';
    case 'manus-tools':
      return 'Manus 代理工具';
    case 'same-dev-prompt':
      return 'Same.dev 系统提示词';
    case 'lovable-prompt':
      return 'Lovable 系统提示词';
    case 'devin-prompt':
      return 'Devin AI 系统提示词';
    case 'replit-prompt':
      return 'Replit 代理系统提示词';
    case 'windsurf-prompt':
      return 'Windsurf Agent 系统提示词';
    case 'vscode-prompt':
      return 'VSCode Agent 系统提示词';
    case 'codex-cli-prompt':
      return 'Codex CLI 系统提示词';
    case 'cline-prompt':
      return 'Cline 系统提示词';
    case 'bolt-prompt':
      return 'Bolt 系统提示词';
    case 'roocode-prompt':
      return 'RooCode 系统提示词';
    default:
      return fileType;
  }
};

// 获取工具名称
const getToolName = (slug: string): string => {
  switch (slug) {
    case 'v0':
      return 'v0';
    case 'cursor':
      return 'Cursor';
    case 'manus':
      return 'Manus';
    case 'same-dev':
      return 'Same.dev';
    case 'lovable':
      return 'Lovable';
    case 'devin':
      return 'Devin AI';
    case 'replit':
      return 'Replit';
    case 'windsurf':
      return 'Windsurf Agent';
    case 'vscode':
      return 'VSCode Agent';
    case 'open-source':
      return '开源提示词';
    default:
      return slug;
  }
};

export default function PromptDetailPage({ 
  params 
}: { 
  params: { slug: string; fileType: string } 
}) {
  const { slug, fileType } = params;
  
  try {
    const content = getPromptContent(slug, fileType);
    const fileTypeName = getFileTypeName(fileType);
    const toolName = getToolName(slug);
    
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 flex items-center">
            <Link 
              href={`/tools/${slug}`}
              className="text-blue-400 hover:underline mr-4"
            >
              ← 返回{toolName}
            </Link>
            <h1 className="text-3xl font-bold">{fileTypeName}</h1>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-blue-500/30 flex items-center justify-center mr-4">
                  <span className="text-lg text-blue-400">
                    {fileType.includes('tool') ? 'T' : 'P'}
                  </span>
                </div>
                <h2 className="text-2xl font-semibold">{fileTypeName}</h2>
              </div>
              <button 
                className="button"
                onClick={() => {
                  // 复制内容到剪贴板的功能
                  navigator.clipboard.writeText(content);
                }}
              >
                复制全部
              </button>
            </div>
            
            <div className="prose prose-lg prose-invert max-w-none">
              <Suspense fallback={<div>正在加载...</div>}>
                <div>
                  {/* 这里应该使用Markdown渲染，简化版使用pre标签 */}
                  <pre className="whitespace-pre-wrap break-words bg-gray-900 p-4 rounded-lg overflow-auto">
                    {content}
                  </pre>
                </div>
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    notFound();
  }
} 
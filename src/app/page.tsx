'use client';

import { useState, useEffect } from 'react';
import fs from 'fs';
import path from 'path';
import { useSearchParams, useRouter } from 'next/navigation';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { 
  FileText, 
  Code, 
  Database, 
  Search, 
  Copy, 
  FolderOpen, 
  ExternalLink,
  ChevronRight,
  LayoutList,
  FileCode,
  AlertCircle,
  Terminal,
  Pencil,
  Bot,
  Globe,
  Heart,
  TerminalSquare,
  Wind,
  Cloud,
  Laptop
} from 'lucide-react';

type ToolCategory = {
  name: string;
  description: string;
  slug: string;
  icon: React.ReactNode;
};

type FileItem = {
  name: string;
  path: string;
  type: 'prompt' | 'tool' | 'model';
};

// 工具分类 - 删除开源提示词并添加图标
const toolCategories: ToolCategory[] = [
  {
    name: 'v0',
    description: 'v0 系统提示词和工具',
    slug: 'v0',
    icon: <Terminal size={16} className="mr-1.5" />,
  },
  {
    name: 'Cursor',
    description: 'Cursor 系统提示词',
    slug: 'cursor',
    icon: <Pencil size={16} className="mr-1.5" />,
  },
  {
    name: 'Manus',
    description: 'Manus 代理工具和提示词',
    slug: 'manus',
    icon: <Bot size={16} className="mr-1.5" />,
  },
  {
    name: 'Same.dev',
    description: 'Same.dev 系统提示词',
    slug: 'same-dev',
    icon: <Globe size={16} className="mr-1.5" />,
  },
  {
    name: 'Lovable',
    description: 'Lovable 系统提示词',
    slug: 'lovable',
    icon: <Heart size={16} className="mr-1.5" />,
  },
  {
    name: 'Devin',
    description: 'Devin AI 系统提示词',
    slug: 'devin',
    icon: <TerminalSquare size={16} className="mr-1.5" />,
  },
  {
    name: 'Replit',
    description: 'Replit 代理系统提示词',
    slug: 'replit',
    icon: <Code size={16} className="mr-1.5" />,
  },
  {
    name: 'Windsurf',
    description: 'Windsurf Agent 系统提示词',
    slug: 'windsurf',
    icon: <Wind size={16} className="mr-1.5" />,
  },
  {
    name: 'VSCode',
    description: 'VSCode (Copilot) Agent 系统提示词',
    slug: 'vscode',
    icon: <Laptop size={16} className="mr-1.5" />,
  },
];

// 文件夹映射 - 保留映射以便API依然能访问
const folderMap: Record<string, string> = {
  'v0': 'v0 Prompts and Tools',
  'cursor': 'Cursor Prompts',
  'manus': 'Manus Agent Tools & Prompt',
  'same-dev': 'Same.dev',
  'lovable': 'Lovable',
  'devin': 'Devin AI',
  'replit': 'Replit',
  'windsurf': 'Windsurf',
  'vscode': 'VSCode Agent',
  'open-source': 'Open Source prompts'
};

// 检测语言
function detectLanguage(content: string): string {
  if (content.includes('function') || content.includes('const') || content.includes('let') || content.includes('var')) {
    return 'javascript';
  }
  if (content.includes('def ') || content.includes('import ') && content.includes('print(')) {
    return 'python';
  }
  if (content.includes('```json') || content.match(/\{[\s\S]*"[^"]+"\s*:[\s\S]*\}/)) {
    return 'json';
  }
  if (content.includes('<html') || content.includes('<!DOCTYPE')) {
    return 'html';
  }
  if (content.includes('#include') || content.includes('int main(')) {
    return 'cpp';
  }
  return 'markdown';
}

// 自定义柔和的高亮主题
const customHighlightTheme = {
  ...oneLight,
  'comment': { color: '#789688', fontStyle: 'italic' },
  'string': { color: '#698759' },
  'property': { color: '#7a54c9' },
  'keyword': { color: '#3b6ea8', fontWeight: 'normal' },
  'function': { color: '#5a6273' },
  'boolean': { color: '#3b6ea8' },
  'number': { color: '#3b6ea8' },
  'operator': { color: '#5c6773' },
  'punctuation': { color: '#5c6773' },
  'tag': { color: '#3d9a5a' },
  'selector': { color: '#3d9a5a' },
  'attr-name': { color: '#7a54c9' },
  'attr-value': { color: '#395f8a' },
  'char': { color: '#698759' },
  'builtin': { color: '#3b6ea8' },
  'inserted': { color: '#3d9a5a' },
  'deleted': { color: '#b85a68' },
  'changed': { color: '#b77746' },
  'class-name': { color: '#7a54c9' },
  'constant': { color: '#276eac' },
};

// 高亮文本中的关键词
function highlightKeywords(content: string): JSX.Element {
  // 使用SyntaxHighlighter组件进行整体高亮
  const language = detectLanguage(content);
  
  return (
    <SyntaxHighlighter
      language={language}
      style={customHighlightTheme}
      customStyle={{
        fontSize: '0.9rem',
        borderRadius: '0.5rem',
        padding: '1.25rem',
        backgroundColor: '#fcfcfc',
        color: '#444',
        border: '1px solid #eaecf0',
        width: '100%',
        overflowX: 'hidden',
        wordBreak: 'break-word',
        lineHeight: '1.6',
        boxShadow: 'inset 0 0 0.5px 0.5px rgba(0, 0, 0, 0.03)',
      }}
      wrapLines={true}
      wrapLongLines={true}
      lineProps={{ style: { 
        wordBreak: 'break-all', 
        whiteSpace: 'pre-wrap',
        paddingRight: '1rem',
      } }}
      codeTagProps={{
        style: {
          fontFamily: 'Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        }
      }}
    >
      {content}
    </SyntaxHighlighter>
  );
}

// 获取文件类型图标
const getFileTypeIcon = (fileType: 'prompt' | 'tool' | 'model') => {
  switch(fileType) {
    case 'prompt':
      return <FileText size={16} />;
    case 'tool':
      return <Code size={16} />;
    case 'model':
      return <Database size={16} />;
    default:
      return <FileText size={16} />;
  }
};

export default function Home() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('v0');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // 处理URL参数
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && toolCategories.some(t => t.slug === tab)) {
      setActiveTab(tab);
    }
    
    const file = searchParams.get('file');
    if (file) {
      setSelectedFile(file);
    }
  }, [searchParams]);

  // 当标签改变时加载文件列表
  useEffect(() => {
    async function loadFileList() {
      try {
        const response = await fetch(`/api/files?tool=${activeTab}`);
        if (response.ok) {
          const data = await response.json();
          setFiles(data.files);
          
          // 如果没有选中文件但有文件列表，默认选中第一个
          if (!selectedFile && data.files.length > 0) {
            setSelectedFile(data.files[0].name);
            
            // 更新URL
            router.push(`/?tab=${activeTab}&file=${encodeURIComponent(data.files[0].name)}`);
          }
        } else {
          setFiles([]);
        }
      } catch (error) {
        console.error('加载文件列表失败:', error);
        setFiles([]);
      }
    }
    
    // 仅在客户端加载文件，这部分将通过API路由实现
    if (typeof window !== 'undefined') {
      loadFileList();
    }
  }, [activeTab]);

  // 当选择文件时加载文件内容
  useEffect(() => {
    async function loadFileContent() {
      if (!selectedFile) return;
      
      setLoading(true);
      try {
        const response = await fetch(`/api/content?tool=${activeTab}&file=${encodeURIComponent(selectedFile)}`);
        if (response.ok) {
          const data = await response.json();
          setFileContent(data.content);
        } else {
          setFileContent('无法加载文件内容');
        }
      } catch (error) {
        console.error('加载文件内容失败:', error);
        setFileContent('加载文件内容时出错');
      } finally {
        setLoading(false);
      }
    }
    
    // 仅在客户端加载文件内容
    if (typeof window !== 'undefined' && selectedFile) {
      loadFileContent();
    }
  }, [selectedFile, activeTab]);

  // 处理标签点击
  const handleTabClick = (slug: string) => {
    setActiveTab(slug);
    setSelectedFile(null);
    setFileContent('');
    
    // 更新URL
    router.push(`/?tab=${slug}`);
  };

  // 处理文件点击
  const handleFileClick = (fileName: string) => {
    setSelectedFile(fileName);
    
    // 更新URL
    router.push(`/?tab=${activeTab}&file=${encodeURIComponent(fileName)}`);
  };
  
  // 复制内容到剪贴板
  const copyToClipboard = () => {
    navigator.clipboard.writeText(fileContent)
      .then(() => {
        alert('内容已复制到剪贴板');
      })
      .catch(err => {
        console.error('复制失败:', err);
      });
  };

  // 获取文件类型图标和样式
  const getFileTypeInfo = (fileName: string) => {
    let type: 'prompt' | 'tool' | 'model' = 'prompt';
    if (fileName.toLowerCase().includes('tool')) {
      type = 'tool';
    } else if (fileName.toLowerCase().includes('model')) {
      type = 'model';
    }
    
    const bgColor = type === 'prompt' 
      ? 'bg-blue-100' 
      : type === 'tool' 
      ? 'bg-green-100'
      : 'bg-purple-100';
      
    const textColor = type === 'prompt' 
      ? 'text-blue-600' 
      : type === 'tool' 
      ? 'text-green-600'
      : 'text-purple-600';
    
    const icon = getFileTypeIcon(type);
    
    return { bgColor, textColor, icon, type };
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-700">
            AI 工具系统提示词
          </h1>
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <p className="text-lg">
              内容来源自：
            </p>
            <a 
              href="https://github.com/x1xhlol/system-prompts-and-models-of-ai-tools" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 flex items-center"
            >
              @x1xhlol/system-prompts-and-models-of-ai-tools
              <ExternalLink size={16} className="ml-1" />
            </a>
          </div>
        </header>

        {/* 标签导航 */}
        <div className="flex flex-wrap items-center justify-center mb-8 gap-2">
          {toolCategories.map((category) => (
            <button
              key={category.slug}
              onClick={() => handleTabClick(category.slug)}
              className={`px-4 py-2 rounded-full transition-all duration-200 text-sm md:text-base flex items-center ${
                activeTab === category.slug 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.icon}
              {category.name}
            </button>
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* 文件列表侧边栏 */}
          <div className="w-full md:w-1/5">
            <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
              <div className="flex items-center mb-4 text-gray-800">
                <LayoutList size={18} className="mr-2" />
                <h2 className="text-lg font-semibold">文件列表</h2>
              </div>
              
              {files.length > 0 ? (
                <ul className="space-y-1.5">
                  {files.map((file) => {
                    const { textColor, icon, type } = getFileTypeInfo(file.name);
                    
                    return (
                      <li key={file.name}>
                        <button 
                          onClick={() => handleFileClick(file.name)}
                          className={`w-full text-left px-2.5 py-2 rounded-md flex items-center group transition-all duration-200 ${
                            selectedFile === file.name 
                              ? 'bg-blue-50 text-blue-700' 
                              : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <span className={`mr-2 ${selectedFile === file.name ? textColor : 'text-gray-500'}`}>
                            {icon}
                          </span>
                          <span className={`text-sm truncate ${selectedFile === file.name ? 'font-medium' : ''}`}>
                            {file.name}
                          </span>
                          {selectedFile === file.name && (
                            <ChevronRight size={16} className="ml-auto text-blue-500" />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="text-gray-500 text-center py-6 flex flex-col items-center">
                  <AlertCircle size={24} className="mb-2 text-gray-400" />
                  <p>未找到文件</p>
                </div>
              )}
            </div>
          </div>
          
          {/* 文件内容区域 */}
          <div className="w-full md:w-4/5">
            {selectedFile ? (
              <div className="bg-white rounded-lg shadow-md border border-gray-200">
                {/* 文件头部 */}
                <div className="flex justify-between items-center p-4 border-b border-gray-200">
                  <div className="flex items-center min-w-0 max-w-[70%]">
                    {selectedFile && (
                      <>
                        {(() => {
                          const { textColor, icon } = getFileTypeInfo(selectedFile);
                          return (
                            <span className={`flex-shrink-0 mr-2 ${textColor}`}>
                              <FileCode size={20} />
                            </span>
                          );
                        })()}
                        <h3 className="text-lg font-semibold text-gray-800 truncate">
                          {selectedFile}
                        </h3>
                      </>
                    )}
                  </div>
                  <button 
                    onClick={copyToClipboard}
                    className="button text-sm py-1.5 px-3 flex items-center flex-shrink-0"
                  >
                    <Copy size={16} className="mr-1.5" />
                    复制内容
                  </button>
                </div>
                
                {/* 文件内容 */}
                <div className="p-4">
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  ) : (
                    <div className="h-[70vh] max-h-[70vh] overflow-y-auto overflow-x-hidden w-full">
                      {highlightKeywords(fileContent)}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-8 border border-gray-200 flex flex-col items-center justify-center min-h-[400px]">
                <FolderOpen size={48} className="text-gray-300 mb-4" />
                <p className="text-gray-500 mb-4">请从左侧选择一个文件查看内容</p>
                {files.length === 0 && (
                  <p className="text-gray-400 text-sm">当前选择的工具无可用文件</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, Suspense } from 'react';
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
  Laptop,
  ToggleLeft,
  ToggleRight,
  Check
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

// 高亮文本中的关键词
function highlightKeywords(content: string): JSX.Element {
  // 使用SyntaxHighlighter组件进行整体高亮
  const language = detectLanguage(content);
  
  return (
    <SyntaxHighlighter
      language={language}
      style={oneLight}
      customStyle={{
        fontSize: '0.9rem',
        borderRadius: '0.5rem',
        padding: '1rem',
        backgroundColor: '#fafafa',
        color: '#333',
        border: '1px solid #e5e7eb',
        width: '100%',
        overflowX: 'hidden',
        wordBreak: 'break-word',
      }}
      wrapLines={true}
      wrapLongLines={true}
      lineProps={{ style: { wordBreak: 'break-all', whiteSpace: 'pre-wrap' } }}
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

// 添加Suspense包裹的组件用于处理URL参数
function SearchParamsHandler({ onParamsChange }: { onParamsChange: (tab: string | null, file: string | null) => void }) {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const tab = searchParams.get('tab');
    const file = searchParams.get('file');
    onParamsChange(tab, file);
  }, [searchParams, onParamsChange]);
  
  return null;
}

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('v0');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [displayMode, setDisplayMode] = useState<'raw' | 'style'>('style');
  const [copySuccess, setCopySuccess] = useState(false);

  // 处理URL参数的回调函数
  const handleParamsChange = (tab: string | null, file: string | null) => {
    if (tab && toolCategories.some(t => t.slug === tab)) {
      setActiveTab(tab);
    }
    
    if (file) {
      setSelectedFile(file);
    }
  };

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
        setCopySuccess(true);
        setTimeout(() => {
          setCopySuccess(false);
        }, 2000);
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

  // 解析并显示分块内容
  const renderStyledContent = (content: string): JSX.Element => {
    // 创建一个函数用于解析匹配标签的内容
    const parseBlocks = (text: string): { type: string; content: string; blockType?: string; subBlocks?: any[] }[] => {
      const result = [];
      let remainingText = text;
      
      // 用于查找标签的正则表达式
      const tagNameRegex = /[a-zA-Z][a-zA-Z0-9_-]*/;
      
      // 逐步查找所有可能的标签
      while (remainingText.length > 0) {
        // 查找下一个可能的结束标签
        const endTagMatch = remainingText.match(new RegExp(`<\/(${tagNameRegex.source})>`));
        
        if (!endTagMatch || endTagMatch.index === undefined) {
          // 如果没有找到结束标签，则将剩余文本作为普通文本添加
          if (remainingText.trim().length > 0) {
            result.push({
              type: 'text',
              content: remainingText
            });
          }
          break;
        }
        
        const endTagName = endTagMatch[1];
        const endTagIndex = endTagMatch.index;
        
        // 查找对应的开始标签
        const startTagRegex = new RegExp(`<(${endTagName})>`, 'g');
        let startTagMatch;
        let lastStartTagIndex = -1;
        
        // 找到匹配的最后一个开始标签
        let tempText = remainingText.substring(0, endTagIndex);
        while ((startTagMatch = startTagRegex.exec(tempText)) !== null) {
          lastStartTagIndex = startTagMatch.index;
        }
        
        if (lastStartTagIndex === -1) {
          // 如果没有找到匹配的开始标签，将结束标签之前的内容作为普通文本添加
          const textBeforeEndTag = remainingText.substring(0, endTagIndex + endTagMatch[0].length);
          if (textBeforeEndTag.trim().length > 0) {
            result.push({
              type: 'text',
              content: textBeforeEndTag
            });
          }
          remainingText = remainingText.substring(endTagIndex + endTagMatch[0].length);
          continue;
        }
        
        // 找到了匹配的标签对
        // 添加开始标签之前的文本
        if (lastStartTagIndex > 0) {
          const textBeforeStartTag = remainingText.substring(0, lastStartTagIndex);
          if (textBeforeStartTag.trim().length > 0) {
            result.push({
              type: 'text',
              content: textBeforeStartTag
            });
          }
        }
        
        // 提取标签内容
        const startTagLength = endTagName.length + 2; // <tagname>
        const tagContent = remainingText.substring(lastStartTagIndex + startTagLength, endTagIndex);
        const fullTagContent = remainingText.substring(lastStartTagIndex, endTagIndex + endTagMatch[0].length);
        
        // 特殊处理 functions 标签
        if (endTagName.toLowerCase() === 'functions') {
          // 递归解析 functions 内部的 function 标签
          const functionBlocks = [];
          
          // 寻找 function 标签
          const functionRegex = /<function>([\s\S]*?)<\/function>/g;
          let functionMatch;
          let functionLastIndex = 0;
          
          while ((functionMatch = functionRegex.exec(tagContent)) !== null) {
            // 添加匹配前的普通文本
            if (functionMatch.index > functionLastIndex) {
              const textBefore = tagContent.substring(functionLastIndex, functionMatch.index);
              if (textBefore.trim().length > 0) {
                functionBlocks.push({
                  type: 'text',
                  content: textBefore
                });
              }
            }
            
            // 添加 function 块
            functionBlocks.push({
              type: 'function',
              content: functionMatch[1]
            });
            
            functionLastIndex = functionMatch.index + functionMatch[0].length;
          }
          
          // 添加最后一部分普通文本
          if (functionLastIndex < tagContent.length) {
            const textAfter = tagContent.substring(functionLastIndex);
            if (textAfter.trim().length > 0) {
              functionBlocks.push({
                type: 'text',
                content: textAfter
              });
            }
          }
          
          if (functionBlocks.length > 0) {
            result.push({
              type: 'functions',
              content: fullTagContent,
              blockType: endTagName,
              subBlocks: functionBlocks
            });
          } else {
            result.push({
              type: 'block',
              blockType: endTagName,
              content: fullTagContent
            });
          }
        } else {
          // 其他普通标签
          result.push({
            type: 'block',
            blockType: endTagName,
            content: fullTagContent
          });
        }
        
        // 更新剩余文本
        remainingText = remainingText.substring(endTagIndex + endTagMatch[0].length);
      }
      
      return result;
    };
    
    // 解析内容
    const matches = parseBlocks(content);
    
    // 如果没有匹配项，则整个内容作为普通文本
    if (matches.length === 0) {
      matches.push({
        type: 'text',
        content: content
      });
    }
    
    // 渲染解析后的内容
    return (
      <div className="space-y-6">
        {matches.map((item, index) => {
          if (item.type === 'text') {
            // 只有在有内容且不仅仅是空白时才渲染普通文本
            if (!item.content || item.content.trim().length === 0) {
              return null;
            }
            
            // 渲染普通文本
            return (
              <SyntaxHighlighter
                key={index}
                language={detectLanguage(item.content)}
                style={oneLight}
                customStyle={{
                  fontSize: '0.9rem',
                  borderRadius: '0.25rem',
                  padding: '1rem',
                  backgroundColor: '#fafafa',
                  color: '#333',
                  border: 'none',
                  width: '100%',
                  overflowX: 'hidden',
                  wordBreak: 'break-word',
                }}
                wrapLines={true}
                wrapLongLines={true}
                lineProps={{ style: { wordBreak: 'break-all', whiteSpace: 'pre-wrap' } }}
              >
                {item.content}
              </SyntaxHighlighter>
            );
          } else if (item.type === 'functions') {
            // 为 functions 块设置样式
            return (
              <div key={index} className="rounded-lg border border-blue-200 overflow-hidden shadow-sm bg-white p-4">
                <div className="mb-2 p-1 bg-blue-50 text-blue-700 text-sm font-mono inline-block rounded">
                  &lt;{item.blockType}&gt;
                </div>
                
                <div className="space-y-4">
                  {item.subBlocks && item.subBlocks.map((subItem, subIndex) => {
                    if (subItem.type === 'text') {
                      // 渲染functions块中的普通文本
                      if (!subItem.content || subItem.content.trim().length === 0) {
                        return null;
                      }
                      
                      return (
                        <SyntaxHighlighter
                          key={`${index}-${subIndex}`}
                          language={detectLanguage(subItem.content)}
                          style={oneLight}
                          customStyle={{
                            fontSize: '0.9rem',
                            borderRadius: '0.25rem',
                            padding: '0.75rem',
                            backgroundColor: '#fafafa',
                            color: '#333',
                            border: 'none',
                            width: '100%',
                            overflowX: 'hidden',
                            wordBreak: 'break-word',
                          }}
                          wrapLines={true}
                          wrapLongLines={true}
                          lineProps={{ style: { wordBreak: 'break-all', whiteSpace: 'pre-wrap' } }}
                        >
                          {subItem.content}
                        </SyntaxHighlighter>
                      );
                    } else if (subItem.type === 'function') {
                      // 渲染function块
                      return (
                        <div key={`${index}-${subIndex}`} className="rounded-lg border border-green-200 overflow-hidden shadow-sm bg-white">
                          <div className="p-1 bg-green-50 text-green-700 text-sm font-mono">
                            &lt;function&gt;
                          </div>
                          <div className="p-3">
                            <SyntaxHighlighter
                              language={detectLanguage(subItem.content)}
                              style={oneLight}
                              customStyle={{
                                fontSize: '0.9rem',
                                borderRadius: '0.25rem',
                                padding: '0.75rem',
                                backgroundColor: '#fafafa',
                                color: '#333',
                                border: 'none',
                                width: '100%',
                                overflowX: 'hidden',
                                wordBreak: 'break-word',
                                margin: 0,
                              }}
                              wrapLines={true}
                              wrapLongLines={true}
                              lineProps={{ style: { wordBreak: 'break-all', whiteSpace: 'pre-wrap' } }}
                            >
                              {subItem.content}
                            </SyntaxHighlighter>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
                
                <div className="mt-2 p-1 bg-blue-50 text-blue-700 text-sm font-mono inline-block rounded">
                  &lt;/{item.blockType}&gt;
                </div>
              </div>
            );
          } else {
            // 为不同类型的块应用不同的样式
            let borderColor = 'border-gray-200';
            
            // 根据块类型设置不同的样式
            if (item.blockType) {
              switch(item.blockType.toLowerCase()) {
                case 'function':
                case 'functions':
                case 'tool':
                case 'tools':
                  borderColor = 'border-green-200';
                  break;
                case 'system':
                case 'instructions':
                  borderColor = 'border-blue-200';
                  break;
                case 'example':
                case 'examples':
                  borderColor = 'border-purple-200';
                  break;
                case 'user':
                case 'human':
                  borderColor = 'border-yellow-200';
                  break;
                case 'assistant':
                case 'ai':
                case 'bot':
                  borderColor = 'border-indigo-200';
                  break;
              }
            }
            
            // 渲染块内容，将标签和内容一起显示在内容区
            return (
              <div key={index} className={`rounded-lg border ${borderColor} overflow-hidden shadow-sm bg-white p-0`}>
                <SyntaxHighlighter
                  language={detectLanguage(item.content)}
                  style={oneLight}
                  customStyle={{
                    fontSize: '0.9rem',
                    borderRadius: '0.25rem',
                    padding: '1rem',
                    backgroundColor: '#fafafa',
                    color: '#333',
                    border: 'none',
                    width: '100%',
                    overflowX: 'hidden',
                    wordBreak: 'break-word',
                    margin: 0,
                  }}
                  wrapLines={true}
                  wrapLongLines={true}
                  lineProps={{ style: { wordBreak: 'break-all', whiteSpace: 'pre-wrap' } }}
                >
                  {item.content}
                </SyntaxHighlighter>
              </div>
            );
          }
        })}
      </div>
    );
  };

  // 切换显示模式
  const toggleDisplayMode = () => {
    setDisplayMode(displayMode === 'raw' ? 'style' : 'raw');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* 添加Suspense包裹的SearchParamsHandler组件 */}
      <Suspense fallback={null}>
        <SearchParamsHandler onParamsChange={handleParamsChange} />
      </Suspense>
      
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
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={toggleDisplayMode}
                      className={`text-sm py-1.5 px-3 flex items-center flex-shrink-0 rounded-md border transition-all duration-150 ${
                        displayMode === 'style' 
                          ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100' 
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                      title={displayMode === 'raw' 
                        ? "切换到样式模式：将内容按<标签>格式分块显示" 
                        : "切换到原始模式：显示完整内容"}
                    >
                      {displayMode === 'raw' ? (
                        <ToggleLeft size={16} className="mr-1.5" />
                      ) : (
                        <ToggleRight size={16} className="mr-1.5" />
                      )}
                      {displayMode === 'raw' ? 'Raw' : 'Style'}
                    </button>
                    <button 
                      onClick={copyToClipboard}
                      className="text-sm py-1.5 px-3 flex items-center flex-shrink-0 border border-gray-200 rounded-md bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all duration-150"
                      title="复制原始文本内容"
                    >
                      {copySuccess ? (
                        <>
                          <Check size={16} className="mr-1.5 text-green-500" />
                          <span className="text-green-500">已复制</span>
                        </>
                      ) : (
                        <>
                          <Copy size={16} className="mr-1.5" />
                          复制内容
                        </>
                      )}
                    </button>
                  </div>
                </div>
                
                {/* 文件内容 */}
                <div className="p-4">
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  ) : (
                    <div className="h-[70vh] max-h-[70vh] overflow-y-auto overflow-x-hidden w-full">
                      {displayMode === 'raw' ? (
                        highlightKeywords(fileContent)
                      ) : (
                        renderStyledContent(fileContent)
                      )}
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

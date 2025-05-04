import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 配置为动态路由以避免静态生成问题
export const dynamic = 'force-dynamic';

// 文件夹映射 - 保留开源提示词的映射以便能够处理该请求
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tool = searchParams.get('tool');
    
    if (!tool || !(tool in folderMap)) {
      return NextResponse.json({ error: 'Invalid tool parameter' }, { status: 400 });
    }
    
    const publicPath = path.join(process.cwd(), 'public');
    const folderPath = path.join(publicPath, folderMap[tool]);
    
    if (!fs.existsSync(folderPath)) {
      return NextResponse.json({ files: [] });
    }
    
    const files = fs.readdirSync(folderPath, { withFileTypes: true });
    
    const fileList = files
      .filter(file => file.isFile())
      .map(file => {
        // 确定文件类型
        let type: 'prompt' | 'tool' | 'model' = 'prompt';
        if (file.name.toLowerCase().includes('tool')) {
          type = 'tool';
        } else if (file.name.toLowerCase().includes('model')) {
          type = 'model';
        }
        
        return {
          name: file.name,
          path: `/${tool}/${encodeURIComponent(file.name)}`,
          type
        };
      });
      
    return NextResponse.json({ files: fileList });
  } catch (error) {
    console.error('Error fetching file list:', error);
    return NextResponse.json({ error: 'Failed to fetch file list' }, { status: 500 });
  }
} 
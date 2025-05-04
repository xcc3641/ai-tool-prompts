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
    const file = searchParams.get('file');
    
    if (!tool || !(tool in folderMap) || !file) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }
    
    const publicPath = path.join(process.cwd(), 'public');
    const folderPath = path.join(publicPath, folderMap[tool]);
    const filePath = path.join(folderPath, file);
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    return NextResponse.json({ content });
  } catch (error) {
    console.error('Error fetching file content:', error);
    return NextResponse.json({ error: 'Failed to fetch file content' }, { status: 500 });
  }
} 
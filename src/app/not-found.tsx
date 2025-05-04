import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-700">
          404
        </h1>
        <h2 className="text-2xl font-semibold mb-6 text-gray-800">页面未找到</h2>
        <p className="text-gray-600 mb-8">
          您访问的页面不存在或已被移除。
        </p>
        <Link
          href="/"
          className="button inline-block"
        >
          返回首页
        </Link>
      </div>
    </div>
  );
} 
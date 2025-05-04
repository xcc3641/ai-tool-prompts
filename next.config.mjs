/** @type {import('next').NextConfig} */
const nextConfig = {
  // 禁用静态导出，因为我们使用动态API路由
  // output: 'export', // 不要使用这个，会导致API路由不可用
  
  // 配置为可以在Vercel上部署
  reactStrictMode: true,
  swcMinify: true,
};

export default nextConfig; 
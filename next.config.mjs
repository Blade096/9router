/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true
  },
  env: {},

  // 添加空配置以支持 Turbopack
  turbopack: {},

  // 核心：排除 tracing 中的受限 Windows 系统路径（避免 scandir 权限错误）
  outputFileTracingExcludes: {
    // '/*' 通配所有路由/页面，排除这些 glob 模式（从项目根相对路径）
    '/*': [
      '**/AppData/**',
      '**/WindowsApps/**',
      '**/Roaming/**',
      '**/Local/**',
      'C:\\Users\\admin\\AppData\\Local\\Microsoft\\WindowsApps\\**',  // 精确匹配这个错误路径
      'C:\\Users\\admin\\AppData\\Roaming\\Microsoft\\Windows\\Start Menu\\**',
      '**\\程序\\**',  // 中文开始菜单
    ],
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }

    // watchOptions.ignored 必须是字符串 glob 数组（Webpack 不接受 RegExp）
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        '**/logs/**',
        '**/.next/**',
        '**/node_modules/**',  // 额外安全
      ],
    };

    return config;
  },

  async rewrites() {
    return [
      {
        source: "/v1/v1/:path*",
        destination: "/api/v1/:path*"
      },
      {
        source: "/v1/v1",
        destination: "/api/v1"
      },
      {
        source: "/codex/:path*",
        destination: "/api/v1/responses"
      },
      {
        source: "/v1/:path*",
        destination: "/api/v1/:path*"
      },
      {
        source: "/v1",
        destination: "/api/v1"
      }
    ];
  }
};

export default nextConfig;
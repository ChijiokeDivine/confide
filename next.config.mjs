const nextConfig = {
  webpack: (config, { isServer }) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      topLevelAwait: true,
    };

    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        util: false,
        buffer: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
      };
    }

    return config;
  },

  turbopack: {}, // 🔥 THIS FIXES YOUR ERROR
};

export default nextConfig;
const { mergeConfig } = require('vite');

module.exports = (config) => {
  // Important: always return the modified config
  return mergeConfig(config, {
    // Add allowedHosts
    server: {
      allowedHosts: true,
    },
  });
};

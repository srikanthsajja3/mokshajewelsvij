module.exports = function(api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', {
        unstable_transformImportMeta: true,
      }]
    ],
    // Ensure we transform any import.meta that might slip through
    plugins: [
      ['@babel/plugin-syntax-import-meta'],
    ],
  };
};

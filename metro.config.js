const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const { resolver } = config;

config.resolver = {
  ...resolver,
  // Add .bin and .glb to assetExts for TensorFlow.js models and 3D assets
  assetExts: [...resolver.assetExts, 'bin', 'glb', 'binarypb'],
  // Prioritize 'react-native' and 'browser' to avoid ESM issues (like import.meta) in dual-environment packages
  resolverMainFields: ['react-native', 'browser', 'main'],
  
  resolveRequest: (context, moduleName, platform) => {
    if (moduleName === 'react-native-fs') {
      return {
        filePath: path.resolve(__dirname, 'src/utils/emptyModule.js'),
        type: 'sourceFile',
      };
    }
    if (moduleName === 'stream') {
      return {
        filePath: path.resolve(__dirname, 'src/utils/emptyModule.js'),
        type: 'sourceFile',
      };
    }
    if (moduleName === '@react-native-async-storage/async-storage') {
      if (platform === 'web') {
        return {
          filePath: path.resolve(__dirname, 'src/utils/asyncStorageMock.js'),
          type: 'sourceFile',
        };
      }
    }
    // Chain to the default Metro resolver
    return context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = config;

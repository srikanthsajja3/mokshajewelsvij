const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const { resolver } = config;

config.resolver = {
  ...resolver,
  // Add .bin and .glb to assetExts for TensorFlow.js models and 3D assets
  assetExts: [...resolver.assetExts, 'bin', 'glb'],
  // Prioritize 'browser' and 'react-native' to avoid Node.js standard library issues in dual-environment packages like papaparse
  resolverMainFields: ['browser', 'react-native', 'main'],
  extraNodeModules: {
    ...resolver.extraNodeModules,
    'react-native-fs': path.resolve(__dirname, 'src/utils/emptyModule.js'),
    '@react-native-async-storage/async-storage': path.resolve(__dirname, 'src/utils/emptyModule.js'),
    'stream': path.resolve(__dirname, 'src/utils/emptyModule.js'),
  },
};

module.exports = config;

const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Redirige memoize-one al paquete raíz (no el nested de react-native-web)
  if (moduleName === 'memoize-one') {
    return {
      filePath: require.resolve('memoize-one'),
      type: 'sourceFile',
    };
  }
  // En web, expo-sqlite no existe como nativo: redirigir al shim en memoria
  if (platform === 'web' && moduleName === 'expo-sqlite') {
    return {
      filePath: require.resolve('./src/db/sqlite-web.ts'),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

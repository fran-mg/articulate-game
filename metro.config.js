const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Force Metro to recognize and correctly link WebAssembly binary files
// Add wasm to both sourceExts and assetExts to ensure compatibility
config.resolver.sourceExts.push("wasm");
config.resolver.assetExts.push("wasm");

// Add support for .m4a audio asset files
config.resolver.assetExts.push("m4a");

module.exports = withNativeWind(config, { input: "./app/global.css" });

const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Forces Metro to resolve web entries correctly without crashing on import.meta (Zustand v5)
config.resolver.unstable_conditionNames = [
  "browser",
  "require",
  "react-native",
];

// Force Metro to recognize and correctly link WebAssembly binary files
config.resolver.sourceExts.push("wasm");
config.resolver.assetExts.push("wasm");

// Add support for .m4a audio asset files
config.resolver.assetExts.push("m4a");

module.exports = withNativeWind(config, { input: "./app/global.css" });

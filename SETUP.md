# Project & Directory Setup

```bash
# Configure VS Code Setting

{
"editor.formatOnSave": true,
"editor.defaultFormatter": "esbenp.prettier-vscode",
"typescript.tsdk": "node_modules/typescript/lib",
"editor.codeActionsOnSave": {
"source.fixAll.eslint": true
},
"tailwindCSS.experimental.classRegex": [
["className\\s*=\\s*['\"`]([^'"`]*)['\"`]", "([^'\"`]\*)"]
]
}
```

```bash
# Set Up Project Directory in WSL

mkdir -p ~/projects
cd ~/projects

git clone https://github.com/fran-mg/rumble-game.git
cd rumble-game

code .
pwd
```

# Create the Expo Project

```bash
# Create the Expo app with tabs template

npx create-expo-app@sdk-54 . --template tabs
OR
npx create-expo-app@latest . --template tabs@54
```

# Install All Dependencies

```bash
# UI & Styling

npm install nativewind
npm install --save-dev tailwindcss@3.3.2
npm install @gluestack-ui/themed @gluestack-style/react react-native-svg

# State Management

npm install zustand

# Database & Storage

npx expo install expo-sqlite
npm install @react-native-async-storage/async-storage

# Sensors & Hardware

npx expo install expo-sensors expo-haptics

# Animations

npm install react-native-reanimated
npm install lottie-react-native

# AI SDK (for card generation)

npm install ai @ai-sdk/openai

# Utilities

npx expo install expo-font expo-splash-screen react-native-safe-area-context expo-constants expo-linking

# Development tools

npm install --save-dev prettier eslint
```

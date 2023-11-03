echo "----- Start installing npm dependencies -----"

npm install --prefix srcs
npm cache clean --force

# npm install --prefix srcs --save redux react-redux @reduxjs/toolkit react-devtools react-router-dom react-cookie jsonwebtoken
# npm install --prefix srcs --save react-unity-webgl nextjs-unity-webgl
# npm install --prefix srcs --save axios axios-auth-refresh
# npm install --prefix srcs --save ws socket.io utf-8-validate bufferutil
# npm install --prefix srcs --save @typescript-eslint
# npm install --prefix srcs --save babel-loader @babel/preset-react @babel/preset-env ts-loader
# npm install --prefix srcs --save @mui/material @mui/styles @emotion/react @emotion/styled @fontsource/roboto @mui/icons-material

echo "----- 😎 Successfully installed -----"

npm --prefix srcs run build
npm --prefix srcs run start
# npm --prefix srcs run dev

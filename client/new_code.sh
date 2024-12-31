#!/usr/bin/env bash

#############################################
# PHASE 16 UPDATE SCRIPT
# Final prep for production deployment
#############################################

# 1) Update package.json with separate "build" script & clarifications
cat << 'EOF' > package.json
{
  "name": "hex_island_client",
  "version": "1.0.0",
  "description": "React rewrite of the Hex Island (Catan-like) game",
  "scripts": {
    "start": "webpack serve --mode development --open",
    "build": "webpack --mode production"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.14.2",
    "socket.io-client": "^4.6.1",
    "@react-three/fiber": "^8.9.1",
    "@react-three/drei": "^9.57.5",
    "three": "^0.153.0"
  },
  "devDependencies": {
    "@babel/core": "^7.22.9",
    "@babel/preset-env": "^7.22.9",
    "@babel/preset-react": "^7.22.5",
    "babel-loader": "^9.1.2",
    "css-loader": "^6.8.1",
    "html-webpack-plugin": "^5.5.3",
    "style-loader": "^3.3.3",
    "webpack": "^5.88.2",
    "webpack-cli": "^5.1.4",
    "webpack-dev-server": "^4.15.0"
  }
}
EOF

# 2) Update webpack.config.js for production build clarity
cat << 'EOF' > webpack.config.js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.jsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    publicPath: '/'
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(png|jpg|gif|svg|glb|gltf)$/,
        use: ['file-loader']
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html'
    })
  ],
  devServer: {
    historyApiFallback: true,
    static: {
      directory: path.join(__dirname, 'public')
    },
    port: 3000
  },
  optimization: {
    splitChunks: {
      chunks: 'all'
    }
  }
};
EOF

# 3) Create a basic Dockerfile (if you want container deployment)
cat << 'EOF' > Dockerfile
# Use a Node base image
FROM node:18-alpine AS build

WORKDIR /app

# Copy package.json, package-lock.json first (for caching)
COPY package.json package-lock.json /app/
RUN npm install

# Copy the rest of the client code
COPY . /app

# Build production bundle
RUN npm run build

# Stage 2: Use a minimal server (like nginx) to serve dist
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
EOF

# 4) Provide a short .dockerignore if desired
cat << 'EOF' > .dockerignore
node_modules
dist
.git
EOF

echo "Phase 16 files created/updated successfully!"
echo "Next steps:"
echo "1) npm install (if needed) to ensure correct deps."
echo "2) npm run build -> produces a production bundle in /dist."
echo "3) Deploy that /dist folder as static assets (Netlify, Vercel, S3, or behind your Node server)."
echo "4) Or build Docker image: 'docker build -t hex-island-client .' then run the container."
echo "Congratulations on your final production-ready client!"
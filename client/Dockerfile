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

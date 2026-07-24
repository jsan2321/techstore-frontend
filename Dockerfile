# techstore-frontend/Dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# creates dist/ folder
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist/techstore-frontend/browser /usr/share/nginx/html
EXPOSE 80

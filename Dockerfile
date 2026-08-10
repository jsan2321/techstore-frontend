# techstore-frontend/Dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# creates dist/ folder
RUN npm run build

FROM nginx:alpine
ENV NGINX_ENVSUBST_FILTER=BACKEND_UPSTREAM
COPY --from=build /app/dist/techstore-frontend/browser /usr/share/nginx/html
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY nginx/runtime-config.template.js /usr/share/nginx/html/runtime-config.template.js
COPY nginx/40-runtime-config.sh /docker-entrypoint.d/40-runtime-config.sh
RUN chmod +x /docker-entrypoint.d/40-runtime-config.sh
EXPOSE 80

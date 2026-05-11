FROM node:20-alpine AS development

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps --no-audit

COPY . .

ENV CHOKIDAR_USEPOLLING=true
ENV WATCHPACK_POLLING=true
ENV BROWSER=none
ENV WDS_SOCKET_PORT=0

EXPOSE 3000

CMD ["npm", "start"]

FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps --no-audit

COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS production

COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

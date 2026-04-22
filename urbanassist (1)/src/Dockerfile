FROM node:22-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY server.ts package*.json ./
RUN npm install --production
EXPOSE 3000
CMD ["node", "--experimental-strip-types", "server.ts"]

FROM node:20-alpine
WORKDIR /app
COPY package.json server.js ./
COPY dist ./dist
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]

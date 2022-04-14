FROM node:lts-alpine
WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "tsconfig.json", "./"]
COPY src ./src
RUN npm install
RUN npm run build

FROM node:lts-alpine
WORKDIR /usr/src/app
ENV NODE_ENV=production
COPY ["package.json", "words.txt", "./"]
RUN npm install --production --silent && mv node_modules ../
COPY --from=0 /usr/src/app/dist .
EXPOSE 5000
RUN chown -R node /usr/src/app
USER node
CMD ["node", "app.js"]

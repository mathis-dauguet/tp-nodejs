FROM node:26.12.1-alpine3.24 AS development
USER node
WORKDIR /home/node
RUN mkdir -p node_modules data

FROM node:26.12.1-alpine3.24 AS build
USER node
WORKDIR /home/node
COPY --chown=node:node . .
RUN npm install && npm run build

FROM node:26.12.1-alpine3.24 AS production
ENV NODE_ENV=production
USER node
WORKDIR /home/node
COPY --from=build --chown=node:node /home/node/dist /home/node/dist
COPY --from=build --chown=node:node /home/node/package.json /home/node/package.json
COPY --from=build --chown=node:node /home/node/package-lock.json /home/node/package-lock.json
RUN npm install --omit=dev && mkdir -p data
CMD [ "node", "dist/server.js" ]
EXPOSE 8000

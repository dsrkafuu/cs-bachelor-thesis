# source image
FROM node:lts
# install & build app
RUN npm install -g pnpm pm2
RUN pnpm install && pnpm run build
# run pm2 with custom args support
EXPOSE 3000
ENTRYPOINT ["pm2-runtime"]
CMD ["pm2.config.js"]

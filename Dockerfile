FROM node:15-buster as build

WORKDIR /app
COPY . ./
RUN yarn install
RUN yarn build
RUN npx next export

FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
RUN rm /usr/share/nginx/html/index.html
COPY --from=build /app/out /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

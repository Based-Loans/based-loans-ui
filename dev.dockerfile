FROM node:15-buster as build

WORKDIR /app
COPY . ./
RUN yarn install
RUN yarn build
RUN npx next export

FROM nginx:stable-alpine
COPY dev.nginx.conf /etc/nginx/conf.d/default.conf
RUN rm /usr/share/nginx/html/index.html
COPY --from=build /app/out /usr/share/nginx/html
RUN apk update && apk add apache2-utils
RUN htpasswd -cb /etc/nginx/.htpasswd dustin donottrustsmitty
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

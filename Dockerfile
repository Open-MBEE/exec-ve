################################################################################
# Dockerfile
#
# Enquier
# openmbee@gmail.com
#
# This is the Dockerfile for View Editor (VE).
# To build the container, run the following command: `docker build -t ve .`
# To run the container, run `docker run -it -p 80:9000 --name ve ve`
#
################################################################################
FROM node:16-alpine as builder

ENV VE_ENV 'example'

WORKDIR /opt/mbee/ve
COPY ./ /opt/mbee/ve

# Configures git to use https:// instead of git://
RUN apk add --update git
RUN apk add --update openssh
RUN git config --global url."https://".insteadOf git://

# Install dependencies
RUN yarn install

# Build App
RUN yarn build


FROM nginx:mainline-alpine as production

COPY --from=builder /opt/mbee/ve/dist /usr/share/nginx/html

COPY ./config/default.nginx.template /etc/nginx/templates/default.conf.template

# Expose ports
EXPOSE ${NGINX_PORT}


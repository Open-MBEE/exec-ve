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

RUN apk add --update git openssh ca-certificates

# Configures git to use https:// instead of git://
RUN git config --global url."https://".insteadOf git://

WORKDIR /opt/mbee/ve
COPY ./ /opt/mbee/ve

RUN mv certs/*.crt  /usr/local/share/ca-certificates/ && \
    update-ca-certificates

ENV NODE_EXTRA_CA_CERTS=/opt/mbee/ve/certs/snc_ca.pem \
    NODE_ENV=dev
# Install dependencies
RUN npm install --include=dev

# Build App
RUN npm run  build

FROM nginx:mainline-alpine as production

ENV NGINX_PORT=80

COPY --from=builder /opt/mbee/ve/dist /usr/share/nginx/html
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt

COPY ./config/default.nginx.template /etc/nginx/templates/default.conf.template

# Expose ports
EXPOSE ${NGINX_PORT}


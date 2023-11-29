
FROM registry-cli-docker.wseasttest.navair.navy.mil:5001/node:19.1.0-bullseye as build_env

# WORKDIR /opt/mbee/ve
# COPY ./ /opt/mbee/ve
# set working directory

ENV VE_ENV 'example'

WORKDIR /opt/mbee/ve
COPY ./ /opt/mbee/ve

# RUN mkdir /usr/src/app
# WORKDIR /usr/src/app

ARG NEXUS_USERNAME
ARG NEXUS_PASSWORD


# Use Arena for nexus repos using npm (used in 1st stage)
RUN wget --no-check-certificate -O /opt/mbee/ve/.npmrc https://wcf-serve.apps.arena-workspace.navair.navy.mil/config/nexusiq/.npmrc
RUN export nexus_creds=$(echo -n ${NEXUS_USERNAME}:${NEXUS_PASSWORD} | openssl base64 -A) && sed -i "s/<credentials>/$nexus_creds/g" ./.npmrc

# Use Arena for nexus repos using apt (used in 2nd stage)
RUN wget --no-check-certificate -O /etc/apt/sources.list https://wcf-serve.apps.arena-workspace.navair.navy.mil/config/debian/bullseye-sources.list
RUN sed -i "s/<username>/$NEXUS_USERNAME/g" /etc/apt/sources.list
RUN sed -i "s/<password>/$NEXUS_PASSWORD/g" /etc/apt/sources.list

# install certs. this url is not reachable outside the openshift environment.
RUN wget --no-check-certificate -r -np -nd -R "index.html*" https://wcf-serve.apps.arena-workspace.navair.navy.mil/wcf/latest/crt/ -P /usr/local/share/ca-certificates/WCF  
RUN wget --no-check-certificate -r -np -nd -R "index.html*" https://wcf-serve.apps.arena-workspace.navair.navy.mil/dod/latest/ -P /usr/local/share/ca-certificates/WCF

RUN update-ca-certificates
RUN sed -i "s/CipherString = DEFAULT@SECLEVEL=2/CipherString = DEFAULT/g" /etc/ssl/openssl.cnf

# install dependencies
# RUN apt-get update && apt-get upgrade -y

COPY . .

#allows to pull from github without using ssh
RUN git config --global url."https://".insteadOf git://

#RUN npm install -g bower-update-all
RUN cat ~/.npmrc || true
RUN npm config ls

RUN python --version || true
#Resolve Node SASS issue
# RUN apt-get update && apt-get install -y python make g++
# RUN which python
RUN apt-get update && apt-get install -y python2
ENV PYTHON=python2

RUN python --version || true

RUN rm -rf node_modules && rm -rf package-lock.json && yarn.lock || true
RUN ls -lah 
RUN npm cache clean --force
RUN npm install -g grunt-cli
RUN npm install phantomjs-prebuilt@2.1.16 --ignore-scripts
RUN npm install

# RUN npm install node-sass@4.14.1
# RUN npm update && npm install
# RUN node ./node_modules/node-sass/scripts/install.js
# RUN npm rebuild node-sass



RUN cat app/config/config.example.js || true

RUN apt-get install -y ruby && apt-get install -y sass
RUN grunt build --env=example

FROM registry-cli-docker.wseasttest.navair.navy.mil:5001/nginx:1.22

COPY --from=build_env /etc/apt/sources.list /etc/apt/
COPY --from=build_env /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt
# COPY --from=build_env /usr/local/share/ca-certificates/ /etc/ssl/certs/ca-certificates.crt

# Install curl, ping, dslookup and dig commands
RUN apt-get update && apt-get install -y iputils-ping curl dnsutils|| true

RUN useradd -ms /bin/bash username || true
RUN echo 'username ALL=(ALL:ALL) NOPASSWD: /bin/ping, /usr/bin/dig, /usr/bin/nslookup' >> /etc/sudoer || true

# install dependencies
# Original Commands will raise high vulnerability due to libxpm4
# RUN apt-mark hold libxpm4
# RUN apt-get update && apt-get upgrade -y \ 
#     curl \
#     ca-certificates

# Resolve the libxpm4 vulnerability
# install dependencies
RUN apt-get update && \
    apt-get install -y \
    libxpm4=1:3.5.12-1.1~deb11u1 \
    curl \
    ca-certificates && \
    apt-mark hold libxpm4 && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# # set working directory
# RUN mkdir /usr/src/appx
# WORKDIR /usr/src/app
WORKDIR /opt/mbee/ve

# copy files from build image
COPY --from=build_env /etc/ssl/openssl.cnf /etc/ssl/openssl.cnf
COPY --from=build_env /opt/mbee/ve/dist  /usr/share/nginx/html/
COPY --from=build_env /opt/mbee/ve/app/config/config.example.js /usr/share/nginx/html/
COPY --from=build_env /opt/mbee/ve/nginx.conf /etc/nginx/conf.d/default.conf
# COPY --from=build_env /opt/mbee/ve/json_data/ usr/share/nginx/html/


# OpenMBEE default dockerfile uses the following line. This line lead to our permission errors 
# TODO: to test behavior use this line and change line 96 to RUN sed -i.bak 's/^user/#user/' /etc/nginx/templates/default.conf.template
# COPY ./config/default.nginx.template /etc/nginx/templates/default.conf.template

# # configure and copy nginx config
# ## support running as arbitrary user which belogs to the root group
RUN chmod g+rwx /var/cache/nginx /var/run /var/log/nginx
# ## comment user directive as master process is run as user in OpenShift
RUN sed -i.bak 's/^user/#user/' /etc/nginx/nginx.conf

EXPOSE 8080
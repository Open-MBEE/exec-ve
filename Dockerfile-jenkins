FROM node:8

# prevent git errors
RUN git config --system core.logallrefupdates false
RUN git config --global url."https://".insteadOf git://

# need this to install some binaries otherwise they fail in jenkins build
WORKDIR /opt/ve
RUN npm install node-sass
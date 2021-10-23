FROM ubuntu:latest
RUN apt-get -y update
RUN apt-get -y install git

COPY ./script.sh /
RUN ./script.sh 

WORKDIR /example



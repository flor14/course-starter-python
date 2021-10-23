FROM ubuntu:20.04

RUN apt-get -y update
RUN apt-get -y install git

RUN bash -c "mkdir example && cd example"
# WORKDIR /example

RUN bash -c  "touch somefile.txt && touch other_file.txt"
RUN bash -c  "git init"

RUN apt-get install -y python3-pip
RUN pip install --no-cache-dir notebook
RUN pip install --no-cache-dir jupyterhub

ARG NB_USER=jovyan
ARG NB_UID=1000
ENV USER ${NB_USER}
ENV NB_UID ${NB_UID}
ENV HOME /home/${NB_USER}

RUN adduser --disabled-password \
    --gecos "Default user" \
    --uid ${NB_UID} \
    ${NB_USER}

# Make sure the contents of our repo are in ${HOME}
COPY . ${HOME}
USER root
RUN chown -R ${NB_UID} ${HOME}
USER ${NB_USER}

WORKDIR /tmp

FROM	node:latest

WORKDIR /usr/app

RUN		apt-get update \
		&& apt-get install -y dumb-init \
		&& npm install -g npm

COPY	init.sh .

RUN		chmod 777 init.sh

ENTRYPOINT	["/usr/bin/dumb-init", "--"]

CMD		["./init.sh"]
#CMD		["tail", "-f"]

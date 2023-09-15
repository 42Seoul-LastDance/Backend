NAME	= .transcendence

all		: $(NAME)

$(NAME) :
	mkdir -p ./srcs/postgresql
	@if docker info | grep -q "ERROR"; then \
		echo "\033[0;96m--- Docker will be running soon ---"; \
		echo "y" | ./utils/init_docker.sh; \
		while docker info | grep -q "ERROR"; do \
			sleep 1; \
		done >/dev/null 2>&1; \
		docker-compose up --build; \
	else \
		echo "\033[0;96m--- Docker is already running ---"; \
		docker-compose up --build; \
	fi

down	: 
	docker-compose down
	@rm -rf $(NAME)

clean	:
	make down
	@docker system prune -af

fclean	:
	make clean
	@docker volume rm $$(docker volume ls -q -f dangling=true) || docker volume ls

re		:
	make fclean
	make all

docker	:
	echo "y" | ./utils/init_docker.sh

stest	:
	docker exec nest curl http://localhost:3000

xtest	:
	docker exec next curl http://localhost:4242

exec	:
	docker exec -it react /bin/bash

.PHONY	: all down clean fclean docker cntest stest xtest next

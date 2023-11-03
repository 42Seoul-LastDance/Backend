#!/bin/bash

add_env_line() {
    local key="$1"
    local value="$2"
    echo "$key=$value" >> .env
}

if ! grep -q "#network" .env; then
    IP_ADDRESS="$(ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1' | head -1)"
    echo "" >> .env
    echo "#network" >> .env
    add_env_line "NEXT_PUBLIC_BACK_URL" "http://$IP_ADDRESS:3000"
    add_env_line "FRONT_URL" "http://$IP_ADDRESS:4242"
    add_env_line "FT_CALLBACK" "http://$IP_ADDRESS:3000/auth/callback"
fi

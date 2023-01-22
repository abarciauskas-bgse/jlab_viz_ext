#!/bin/bash 
# docker run --entrypoint entrypoint.sh -it mas.ops.maap-project.org/root/jupyter-image/vanilla:develop
jupyter lab --ip=0.0.0.0 --port=3100 --allow-root --ServerApp.token='' --no-browser --debug

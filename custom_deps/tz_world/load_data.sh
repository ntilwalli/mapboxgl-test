#!/bin/bash
DATA_DIR=2016b
unzip -o ${DATA_DIR}/tz_world.zip -d ${DATA_DIR}
#shp2pgsql -S -s 4326 -I ${DATA_DIR}/world/tz_world | psql -d spotlight_repo -U spotlight
shp2pgsql -S -s 4326 -I ${DATA_DIR}/world/tz_world | heroku pg:psql --app hitpost
#!/bin/sh
export LIBVA_DRIVERS_PATH=/opt/intel/mediasdk/lib64
export LIBVA_DRIVER_NAME=iHD
export MFX_HOME=/opt/intel/mediasdk
export PKG_CONFIG_PATH=/opt/intel/opencl:
( /usr/local/bin/recpt1 --device /dev/$1 --b25 --sid $3 $2 - - | ffmpeg -y -i - -vf yadif=0 -q:v 18 -b:v 8000k -vcodec h264_qsv -vcm 0 -look_ahead 0 -preset veryslow -profile:v main -acodec aac -ar 44100 -f dash -live 1 -min_seg_duration 3000000 -window_size 4 -extra_window_size 2 -remove_at_exit 1 ~/dash/data/$1.mpd ) > /tmp/tacchin.log 2>&1

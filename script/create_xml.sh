#!/bin/bash
PATH=/usr/local/bin:$PATH
TMP=$HOME/dash
GR_Time="60"
BS_Time="180"
CS_Time="180"

for i in `seq 13 62` ; do
        TSFILE="${TMP}/$i.ts"
        JSON="${TMP}/program/GR$i.json"
        recpt1 --b25 $i ${GR_Time} "${TSFILE}" >/dev/null 2>&1
	if [ -e "${TSFILE}" ]; then
        	epgdump json "${TSFILE}" "${JSON}"
	fi
	rm "${TSFILE}" 
done

TSFILE="${TMP}/BS.ts"
JSON="${TMP}/program/BS.json"
recpt1 --b25 101 ${BS_Time} "${TSFILE}" >/dev/null 2>&1
epgdump json "${TSFILE}" "${JSON}"
rm "${TSFILE}" 

TSFILE="${TMP}/CS.ts"
JSON_PREFIX="${TMP}/program/CS"
recpt1 --b25 CS8 ${CS_Time} "${TSFILE}" >/dev/null 2>&1
epgdump json "${TSFILE}" "${JSON_PREFIX}8.json"
recpt1 --b25 CS24 ${CS_Time} "${TSFILE}" >/dev/null 2>&1
epgdump json "${TSFILE}" "${JSON_PREFIX}24.json"
rm "${TSFILE}" 

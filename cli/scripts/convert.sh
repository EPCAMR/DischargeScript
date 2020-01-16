#!/bin/bash
if [ -z "$1" ]; then
	echo "Not enough parameters"
	echo "Example: $0 input_geotiff.tif output_png.png"
	exit 1
fi
if [ -z "$2" ]; then
	echo "Missing output parameter"
	echo "Example: $0 input_geotiff.tif output_png.png"
	exit 1
fi

if [ -n $1 ]; then
	if [ -n $2 ]; then
		gdal_translate $1 -of PNG $2 -b 3 -b 2 -b 1
	fi
fi

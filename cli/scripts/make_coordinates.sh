#!/bin/bash
if [ -z "$1" ]; then
	echo "Not enough parameters"
	echo "Example: $0 input_geotiff.tif pixel_coordinates.txt utm_coordinates.txt"
	exit 1
fi
if [ -z "$2" ]; then
	echo "Missing input pixel coordinates parameter"
	echo "Example: $0 input_geotiff.tif pixel_coordinates.txt utm_coordinates.txt"
	exit 1
fi

if [ -z "$3" ]; then
	echo "Missing output UTM parameter"
	echo "Example: $0 input_geotiff.tif pixel_coordinates.txt utm_coordinates.txt"
	exit 1
fi

if [ -n $1 ]; then
	if [ -n $2 ]; then
		gdaltransform $1 < $2 >> $3
	fi
fi

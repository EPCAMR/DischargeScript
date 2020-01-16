# USAGE
# python3 amd.py -i <image_name>

# import the necessary packages
import argparse
import imutils
import cv2
import numpy as np
from osgeo import osr

def get_coords(coordinate_list):
	src = osr.SpatialReference()
	tgt = osr.SpatialReference()
# construct the argument parser and parse the arguments
ap = argparse.ArgumentParser()
ap.add_argument("-i", "--image", required=True,
	help="path to input image")
args = vars(ap.parse_args())

# load the input image (whose path was supplied via command line
# argument) and display the image to our screen
image = cv2.imread(args["image"])
hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)

## mask of green (36,25,25) ~ (86, 255,255)
# mask = cv2.inRange(hsv, (36, 25, 25), (86, 255,255))
#[ 98 110 176] [118 130 256]
mask = cv2.inRange(hsv, (98, 110, 176), (118, 130,256))

## slice the orange
imask = mask>0
green = np.zeros_like(image, np.uint8)
green[imask] = image[imask]

## save 
cv2.imwrite("orange.png", green.copy())

h, s, v1 = cv2.split(green)

thresh = cv2.threshold(v1, 90, 255, cv2.THRESH_BINARY)[1]
cv2.imwrite("thresh.png", thresh)
cnts = cv2.findContours(thresh.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
cnts = imutils.grab_contours(cnts)
output = image.copy()

out_arr = []
# loop over the contours
for c in cnts:
	# draw each contour on the output image with a 30px thick purple
	# outline, then display the output contours one at a time

	# append contour pixel locations to an array for further processing
	for coords in c:
		out_arr.append(coords[0].tolist())
	cv2.drawContours(output, [c], -1, (240, 0, 159), 30)
	cv2.waitKey(0)

cv2.imwrite("contours.png", output)
out_str = ""

# collect all contour pixel locations for later use in gdaltransform
for points in out_arr:
	out_str += str(points[0])+" "+str(points[1])+"\n"

# write out the file
# gdaltransform use: gdaltransform <image> < pixel_coords.txt
f = open("pixel_coords.txt", "w+")
f.write(out_str)
f.close()
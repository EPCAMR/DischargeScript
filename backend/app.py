from flask import Flask, request, Response
from imageai.Detection.Custom import CustomObjectDetection
import json
import random
import string
# import os
from base64 import b64decode, b64encode
app = Flask(__name__)
detector = CustomObjectDetection()
detector.setModelTypeAsYOLOv3()
detector.setModelPath("/home/ubuntu/epcamr_flask/epcamr/scripts/data/models/6loss.h5")
detector.setJsonPath("/home/ubuntu/epcamr_flask/epcamr/scripts/data/json/detection_config.json")
detector.loadModel()
# print(os.getcwd())

@app.route('/api/', methods = ["POST", "GET"])
def normal():
    return {"error": "No route to delegate to."}

@app.route('/api/epcamr/', methods = ["POST", "GET"])
def do_detection():
    try:
        if request.method == "GET":
            return {"error":"disallowed."}
        try:
            json_data = request.json
        except:
            return {"error":"parse error"}
        
        r = {"analyzed":None, "status":True}
        data_uri = json_data.get("image")
        if(data_uri is None):
            return {"error":"unable to parse image."}
        
        voc_file_name = json_data.get("VOC")

        letters = string.ascii_lowercase
        rand_file = ''.join(random.choice(letters) for i in range(10))

        if voc_file_name is not None:
            file_voc_out = open(rand_file+".xml", "w+")
            file_voc_out.write(voc_file_name)
            file_voc_out.close()

        header, encoded = data_uri.split(",", 1)
        img_data = b64decode(encoded)

        file_img_out = open(rand_file+".png", "wb")
        file_img_out.write(img_data)
        file_img_out.close()
        detections = detector.detectObjectsFromImage(input_image=rand_file+".png", output_image_path=rand_file+".analysis.png")
        file_returned = open(rand_file+".analysis.png", "rb")
        r['analyzed'] = (b64encode(file_returned.read())).decode("utf-8")
        file_returned.close()
        return json.dumps(r)
    except Exception as e:
        return {"error":str(e)}



if __name__ == '__main__':
    app.run()
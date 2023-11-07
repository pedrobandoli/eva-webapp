import base64
from flask import Flask, request
from domain.convert_xml_to_evaml import MacroExpander, GenerateKeys, GenerateLinks
from domain.convert_json_to_evaml import convert_json
from domain.convert_xml_to_json import ParserXMLToJSON
import xml.etree.ElementTree as ET
import re


app = Flask(__name__)


def check_if_evaml(tree):
    return any(t.tag == 'links' for t in tree.getroot())

@app.route('/api/create-xml', methods=['POST'])
def create_xml_script():
    data = request.get_data()
    file = request.files['file']
    is_json: bool = False
    if request.mimetype == 'application/xml':
        # Client envia uma string contendo um xml válido
        tree = ET.ElementTree(ET.fromstring(data))
    else:
        if file.content_type == 'text/xml':
        # Client envia um blob file .xml
            xml = re.search(r'Content-Type: text/xml\r\n\r\n(.*?)\r\n--', data.decode('utf-8', 'ignore'), re.DOTALL)
            tree = ET.ElementTree(ET.fromstring(xml.group(1)))
        elif file.content_type == 'application/json':
            json = re.search(r'Content-Type: application/json\r\n\r\n(.*?)\r\n--', data.decode('utf-8', 'ignore'), re.DOTALL)
            tree = ET.ElementTree(convert_json(json.group(1)))
            is_json = True
        
    
    if not is_json:
        MacroExpander.run(tree)
        GenerateKeys.run(tree)
        GenerateLinks.run(tree)

    xml_string = ET.tostring(tree.getroot(), encoding='utf-8', method='xml').decode('utf-8')
    b64 = base64.b64encode(xml_string.encode('utf-8')).decode('utf-8')

    return b64

@app.route('/api/create-json-file', methods=['POST'])
def create_json_script():
    data = request.get_data()
    file = request.files['file']
    if file.content_type == 'text/xml':
        xml = re.search(r'Content-Type: text/xml\r\n\r\n(.*?)\r\n--', data.decode('utf-8', 'ignore'), re.DOTALL)
        tree = ET.ElementTree(ET.fromstring(xml.group(1)))
    else:
        raise Exception('O content_type do arquivo deve ser "text/xml"')
    
    evaml: bool = check_if_evaml(tree)
    if not evaml:
        MacroExpander.run(tree)
        GenerateKeys.run(tree)
        GenerateLinks.run(tree)

    json_string = ParserXMLToJSON.parse(tree)
    b64 = base64.b64encode(json_string.encode('utf-8')).decode('utf-8')

    return b64
import base64
from flask import Flask, request
from domain.convert_xml_to_evaml import MacroExpander, GenerateKeys, GenerateLinks
import xml.etree.ElementTree as ET
import re


app = Flask(__name__)

@app.route('/api/create-xml', methods=['POST'])
def create_xml_script():
    data = request.get_data()
    xml = re.search(r'Content-Type: text/xml\r\n\r\n(.*?)\r\n--', data.decode('utf-8', 'ignore'), re.DOTALL)
    tree = ET.ElementTree(ET.fromstring(xml.group(1)))
    MacroExpander.run(tree)
    GenerateKeys.run(tree)
    GenerateLinks.run(tree)

    xml_string = ET.tostring(tree.getroot(), encoding='utf-8', method='xml').decode('utf-8')
    b64 = base64.b64encode(xml_string.encode('utf-8')).decode('utf-8')

    return b64
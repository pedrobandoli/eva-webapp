import base64
from flask import Flask, request
from domain.convert_xml_to_evaml import MacroExpander, GenerateKeys, GenerateLinks
from domain.convert_json_to_evaml import convert_json
from domain.create_quiz_from_text import create_quiz
from domain.convert_xml_to_json import ParserXMLToJSON
import xml.etree.ElementTree as ET
import re
import json


app = Flask(__name__)


def check_if_evaml(tree):
    return any(t.tag == 'links' for t in tree.getroot())

@app.route('/api/create-xml', methods=['POST'])
def create_xml_script():
    data = request.get_data()
    file = request.files.get('file')
    is_json: bool = False
    if request.mimetype == 'application/xml':
        # Client envia uma string contendo um xml válido
        tree = ET.ElementTree(ET.fromstring(data))
    else:
        if file and file.content_type == 'text/xml':
        # Client envia um blob file .xml
            xml = re.search(r'Content-Type: text/xml\r\n\r\n(.*?)\r\n--', data.decode('utf-8', 'ignore'), re.DOTALL)
            tree = ET.ElementTree(ET.fromstring(xml.group(1)))
        elif file and file.content_type == 'application/json':
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


@app.route('/api/create-quiz-from-text', methods=['POST'])
def create_quiz_from_text():
    data = request.get_json()
    amount, text = data['amount'], data['text']

    return {
    "0": {
        "Qual o período da Guerra Fria?": "1947-1991"
    },
    "1": {
        "Quais eram as duas superpotências envolvidas no conflito?": "União Soviética e Estados Unidos"
    },
    "2": {
        "O que significa o termo 'corta' em Guerra Fria?": "Não houve combates em larga escala"
    },
    "3": {
        "O que eram as guerras por procuração?": "Conflitos regionais apoiados pelas superpotências"
    },
    "4": {
        "Além da luta ideológica, como a disputa foi expressa?": "Por meio de guerra psicológica, propaganda, espionagem, embargos econômicos, eventos esportivos e competições tecnológicas"
    },
    "5": {
        "O que a doutrina da destruição mutuamente assegurada desencorajou?": "Ataque nuclear preventivo"
    },
    "6": {
        "Quais ferramentas de disputa não foram mencionadas no texto?": "Não mencionadas"
    },
    "7": {
        "Quem venceu a Segunda Guerra Mundial?": "Aliança temporária entre União Soviética e Estados Unidos"
    },
    "8": {
        "Qual foi um dos aspectos importantes do conflito durante a Guerra Fria?": "Desenvolvimento do arsenal nuclear"
    },
    "9": {
        "Por que o termo 'corta' é utilizado para descrever a Guerra Fria?": "Porque não houve combates em larga escala"
    }
}
    quiz = create_quiz(text, amount)
    return json.loads(quiz)
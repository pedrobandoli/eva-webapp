import json
from typing import List
import xml.etree.ElementTree as ET
import re

def convert_json(file_str: str):
  data = json.loads(file_str)
  nodes = data['data']['node']
  links = data['data']['link']
  evaml = ET.Element('evaml', {'name': data['nombre']})

  _script = ET.SubElement(evaml, 'script')
  _links = ET.SubElement(evaml, 'links')

  assembly_settings(evaml, nodes)
  processa_nos(_script, nodes)
  processa_links(_links, links)

  return evaml

def assembly_settings(evaml, nodes: List[dict]):
    settings = ET.SubElement(evaml, 'settings')

    try:
        voice_node = nodes[0]
        ET.SubElement(settings, 'voice', {'tone': voice_node['voice'], 'key': str(voice_node['key'])})
        nodes.remove(voice_node)
    except KeyError:
        raise Exception('O elemento Voice não foi encontrado! Este deve ser o primeiro elemento do script.')

    ET.SubElement(settings, "lightEffects", {'mode': 'on'})
    ET.SubElement(settings, "audioEffects", {"mode":"on",  "vol":"100%"})

def assembly_if(script: ET.Element, node: dict):
    key, tag, expressao, opt = str(node['key']), 'case', node['text'], node['opt']

    if (opt == 4): # Exact
        var, op, value = '$', 'exact', expressao
        tag = tag if value != '' else 'default'
    elif (opt == 2): # Contain
        var, op, value = '$', 'contain', expressao
    elif (opt == 5): # Comparação matemática
        operator_mapping = {
            "==": "eq",
            ">=": "gte",
            "<=": "lte",
            "!=": "ne",
            ">": "gt",
            "<": "lt"
        }

        regex = r'(==|>=|<=|!=|>|<)'
        op = operator_mapping[re.findall(regex, expressao)[0]]
        expressao = re.sub(regex, "  ", expressao)
        var = '$' if '$' in expressao else re.findall(r'\#[a-zA-Z]+[0-9]*', expressao)
        if var == '$':
            _values = re.findall(r'[0-9]+', expressao) # Busca um número na expressão lógica
            value = re.findall(r'\#[a-zA-Z]+[0-9]*', expressao)[0] if len(_values) == 0 else _values[0]
        else:
            if len(var) == 1:
              var, value = var[0][1:], re.findall(r'[0-9]+', expressao)[0]
            else:
               var = var[0][1:]
               value = var[1]

    ET.SubElement(script, tag, {"key" : str(node["key"]), "op" : op, "value" : value, "var" : var})

def processa_nos(script: ET.Element, nodes: List[dict]):
  for node in nodes:
    type, key = node['type'], str(node['key'])
    if type == 'mov':
        motion = {
            "n": "YES",
            "s": "NO",
            "c": "CENTER",
            "l": "LEFT",
            "r": "RIGHT",
            "u": "UP",
            "d": "DOWN",
            "a": "ANGRY",
            "U": "2UP",
            "D": "2DOWN",
            "R": "2RIGHT"
        }.get(node['mov'], '2LEFT')

        ET.SubElement(script, 'motion', {"key" : str(node["key"]), "type" : motion})
    elif type == 'light':
        key, state, color = key, node['state'].upper(), node['lcolor'].upper()
        ET.SubElement(script, 'light', {'key': key, 'state': state, 'color': color})
    elif type == 'sound':
        key, source, block = key, node['src'], str(node['wait']).upper()
        ET.SubElement(script, 'audio', {'key': key, 'source': source, 'block': block})
    elif type == 'emotion':
        emotion = {
            "anger": "ANGRY",
            "joy": "HAPPY",
            "ini": "NEUTRAL"
        }.get(node['emotion'], 'SAD')
        ET.SubElement(script, 'evaEmotion', {'key': key, 'emotion': emotion})
    elif type == 'led':
        animation = {
            "anger": "ANGRY",
            "joy": "HAPPY",
            "escuchaT": "LISTEN",
            "sad": "SAD",
            "hablaT_v2": "SPEAK",
            "stop": "STOP",
            "surprise": "SURPRISE"
        }.get(node['anim'], None)

        ET.SubElement(script, "led", {'key': key, 'animation': animation})
    
    elif type == 'wait':
        ET.SubElement(script, 'wait', {'key': key, 'duration': str(node['time'])})
    elif type == "listen":
        ET.SubElement(script, "listen", {"key" : key})
    elif type == "random":
        ET.SubElement(script, "random", {"key" : key, "min" : str(node["min"]), "max" : str(node["max"])})
    elif node["type"] == "speak":
        talk = ET.SubElement(script, "talk", {"key" : key})
        talk.text = node["text"]
    elif node["type"] == "user_emotion":
        ET.SubElement(script, "userEmotion", {"key" : key})
    elif type == 'counter':
        operation = {
            "assign": "=",
            "rest": "%",
            "mul": "*",
            "sum": "+",
            "div": "/"
        }.get(node['ops'], None)

        ET.SubElement(script, "counter", {"key" : key, "var" : node["count"],
                                           "op" : operation , "value" : str(node["value"])})
    elif type == 'if':
       assembly_if(script, node)
    else:
       raise Exception('Um elemento não suportado da VPL foi encontrado. Por favor, cheque seu .json')
  
def processa_links(links_element: ET.Element, links: List[dict]):
    for link in links:
        _to, _from = str(link['to']), str(link['from'])
        ET.SubElement(links_element, 'link', {'to': _to, 'from': _from })
import xml.etree.ElementTree as ET
from enum import Enum
import re

class ElementsEnum(str, Enum):
    script = 'script'
    switch = 'switch'
    stop = 'stop'
    motion = 'motion'
    audio = 'audio'
    light = 'light'
    led = 'led'
    wait = 'wait'
    talk = 'talk'
    random = 'random'
    listen = 'listen'
    counter = 'counter'
    evaEmotion = 'evaEmotion'
    userEmotion = 'userEmotion'
    case = 'case'
    default = 'default'
    goto = 'goto'

class ParserXMLToJSON:
    
    @staticmethod
    def parse(tree: ET.ElementTree):
        root = tree.getroot()
        script_node = root.find(ElementsEnum.script)
        output, goshashid = '', 0

        output += ParserXMLToJSON.head_process(root)
        output += ParserXMLToJSON.settings_process(root.find('settings'), goshashid)

        for elem in script_node.iter():
            if not elem.tag in [ElementsEnum.script, ElementsEnum.switch, ElementsEnum.stop, ElementsEnum.goto]: 
                goshashid += 1
                output += ',\n {}'.format(ParserXMLToJSON.process_element(elem, goshashid, root))

        output += ParserXMLToJSON.saida_links(root.find('links'))
        return output


    def head_process(root: ET.Element):
        root.attrib['key'] = '0'
        id, name = root.attrib['id'], root.attrib['name']
        return """{
            "_id": """ + '"' + id + '",' + """
            "nombre": """ + '"' + name + '",' + """
            "data": {
                "node": [
        """

    def settings_process(settings: ET.Element, hash):
        voice = settings.find('voice')
        key, tone = voice.attrib['key'], voice.attrib['tone']
        return """      {
                "key": """ + key + """,
                "name": "Voice",
                "type": "voice",
                "color": "#0020ff",
                "isGroup": false,
                "voice": """ + '"' + tone + '",' + """
                "__gohashid": """ + str(hash) + """
        }"""

    def saida_links(links: ET.Element):
        if len(links) == 0:
            raise Exception('No execution flow found. Please, check your code.')
        _to, _from, hash = links[0].attrib['to'], links[0].attrib['from'], 0
        node = """
            ],
            "link": [""" + """
            { 
                "from": """ + _from + "," + """
                "to": """ + _to + "," + """
                "__gohashid": 0
            }"""
        
        for i in range(len(links) - 1):
            node  += """,
                { 
                    "from": """ + links[i+1].attrib["from"] + "," + """
                    "to": """ + links[i+1].attrib["to"] + "," + """
                    "__gohashid": """ + str(i + 1) + """
                }"""
        
        return node + """
            ]
        }
        }"""

    def process_element(elem: ET.Element, goshashid: int, root: ET.Element):
        return {
            ElementsEnum.motion: ParserXMLToJSON.motion_process,
            ElementsEnum.audio: ParserXMLToJSON.audio_process,
            ElementsEnum.light: ParserXMLToJSON.light_process,
            ElementsEnum.led: ParserXMLToJSON.led_process,
            ElementsEnum.wait: ParserXMLToJSON.wait_process,
            ElementsEnum.talk: ParserXMLToJSON.talk_process,
            ElementsEnum.random: ParserXMLToJSON.random_process,
            ElementsEnum.counter: ParserXMLToJSON.counter_process,
            ElementsEnum.evaEmotion: ParserXMLToJSON.eva_emotion_process,
            ElementsEnum.userEmotion: ParserXMLToJSON.user_emotion_process,
            ElementsEnum.case: ParserXMLToJSON.case_process,
            ElementsEnum.default: ParserXMLToJSON.case_process,
            ElementsEnum.listen: ParserXMLToJSON.listen_process,

        }[ElementsEnum[elem.tag]](elem, goshashid, root)
    
    def motion_process(elem: ET.Element, hash: int, root = None):
        type, key = elem.attrib['type'], elem.attrib['key']
        mapped_type = {
            'YES': 'n',
            'NO': 's',
            "CENTER": 'c',
            "LEFT": 'l',
            "RIGHT": 'r',
            "UP": 'u',
            "DOWN": 'd',
            "ANGRY": 'a',
            "2UP": 'U',
            "2DOWN": 'D',
            "2RIGHT": 'R',
            "2LEFT": 'L',
        }.get(type, type)
        
        return """      {
            "key": """ + key + """,
            "name": "Motion",
            "type": "mov",
            "color": "lightblue",
            "isGroup": false,
            "mov": """ + '"' + mapped_type + '",' + """
            "__gohashid": """ + str(hash) + """
        }"""

    def audio_process(elem: ET.Element, hash: int, root: ET.Element):
        key, block, audio_source = elem.attrib['key'], elem.attrib['block'].lower(), elem.attrib['source']
        audio_effects = root.find('settings').find('audio_effects')
        
        if audio_effects and audio_effects.attrib['mode'] == 'OFF':
            audio_source = 'MUTED_SOUND'

        return """      {
        "key": """ + key + """,
        "name": "Audio",
        "type": "sound",
        "color": "lightblue",
        "isGroup": false,
        "src": """ + '"' + audio_source + '",' + """
        "wait": """ + block + ',' + """
        "__gohashid": """ + str(hash) + """
      }"""
    
    def light_process(elem: ET.Element, hash: int, root: ET.Element):
        key, bulb_state, color = elem.attrib['key'], elem.attrib['state'], elem.attrib.get('color')

        light_effects = root.find('settings').find('lightEffects')
        if light_effects and light_effects.attrib['mode'] == 'OFF':
            bulb_state == 'OFF'

        if bulb_state == 'OFF': color = '#000000'
        elif bulb_state == 'ON': color = '#ffffff'
        else:
            color = {
                'RED': '#ff0000',
                'PINK': "#e6007e",
                'GREEN': "#00ff00",
                'YELLOW': "#ffff00",
                'BLUE': "#0000ff",
            }.get(color)

        return """      {
            "key": """ + key + """,
            "name": "Light",
            "type": "light",
            "color": "#ffa500",
            "isGroup": false,
            "group": "",
            "lcolor": """ + '"' + color + '",' + """
            "state": """ + '"' + bulb_state.lower() + '",' + """
            "__gohashid": """ + str(hash) + """
      }"""

    def led_process(elem: ET.Element, hash: int, root = None):
        key, animation = elem.attrib['key'], elem.attrib['animation']
        
        animation = {
            "STOP": 'stop',
            "LISTEN": "escuchaT",
            "SPEAK": "hablaT_v2",
            "ANGRY": "anger",
            "HAPPY": "joy",
            "SAD": "sad",
            "SURPRISE": "surprise",
        }.get(animation, animation)

        return """      {
            "key": """ + key + """,
            "name": "Leds",
            "type": "led",
            "color": "lightblue",
            "isGroup": false,
            "group": "",
            "anim": """ + '"' + animation + '",' + """
            "__gohashid": """ + str(hash) + """
      }"""
    
    def wait_process(elem: ET.Element, hash: int, root = None):
        key, duration = elem.attrib['key'], elem.attrib['duration']
        return """      {
            "key": """ + key + """,
            "name": "Wait",
            "type": "wait",
            "color": "lightblue",
            "isGroup": false,
            "time": """ + duration + ',' + """
            "__gohashid": """ + str(hash) + """
      }"""

    def talk_process(elem: ET.Element, hash: int, root = None):
        key, text = elem.attrib['key'], elem.text
        
        if not text:
            raise Exception('There is a <talk> command without a text.')
        
        text = re.sub(r'[\n\t]', ' ', text)

        return """      {
        "key": """ + key + """,
        "name": "Talk",
        "type": "speak",
        "color": "#00ff00",
        "isGroup": false,
        "text": """ + '"' + text + '",' + """
        "__gohashid": """ + str(hash) + """
      }"""
    
    def random_process(elem: ET.Element, hash: int, root = None):
        key, min, max = elem.attrib['key'], elem.attrib['min'], elem.attrib['max']

        return """      {
            "key": """ + key + """,
            "name": "Random",
            "type": "random",
            "color": "pink",
            "isGroup": false,
            "group": "",
            "min": """ + min + ',' + """
            "max": """ + max + ',' + """
            "__gohashid": """ + str(hash) + """
      }"""
    
    def counter_process(elem: ET.Element, hash: int, root = None):
        key, op, var, value = elem.attrib['key'], elem.attrib['op'], elem.attrib['var'], elem.attrib['value']

        op = {
            "=": 'assign',
            "+": 'sum',
            "*": 'mul',
            "/": 'div',
            "%": 'rest'
        }.get(op, op)

        return """      {
        "key": """ + key + """,
        "name": "Counter",
        "type": "counter",
        "color": "lightblue",
        "isGroup": false,
        "group": "",
        "count": """ + '"' + var + '",' + """
        "ops": """ + '"' + op + '",' + """
        "value": """ + value + ',' + """
        "__gohashid": """ + str(hash) + """
      }"""
    
    def eva_emotion_process(elem: ET.Element, hash: int, root = None):
        key, emotion = elem.attrib['key'], elem.attrib['emotion']

        emotion = {
             "HAPPY": 'joy',
            "ANGRY": 'anger',
            "NEUTRAL": 'ini'
        }.get(emotion, emotion)

        return """      {
            "key": """ + key + """,
            "name": "Eva_Emotion",
            "type": "emotion",
            "color": "lightcoral",
            "isGroup": false,
            "group": "",
            "emotion": """ + '"' + emotion.lower() + '",' + """
            "level": 0,
            "speed": 0,
            "__gohashid": """ + str(hash) + """
      }"""
    
    def user_emotion_process(elem: ET.Element, hash: int, root = None):
        key = elem.attrib['key']
        return """      {
            "key": """ + key + """,
            "name": "User_Emotion",
            "type": "user_emotion",
            "color": "lightgreen",
            "isGroup": false,
            "group": "",
            "vision": "capture",
            "__gohashid": """ + str(hash) + """
      }"""
    
    def case_process(elem: ET.Element, hash: int, root = None):
        key, op, value = elem.attrib['key'], elem.attrib['op'], elem.attrib['value']

        if op in ('contain', 'exact'):
            return """      {
                "key": """ + key + """,
                "name": "Condition",
                "type": "if",
                "color": "white",
                "isGroup": false,
                "text": """ + '"' + value + '",' + """
                "opt": 4,
                "__gohashid": """ + str(hash) + """
            }"""
        else:
            var = elem.attrib['var']
            sep = '"' if var == '$' else '#'

            op = {
                "lt": '<',
                "gt": '>',
                "eq": '==',
                "lte": '<=',
                "gte": '>=',
                "ne": '!=',
            }.get(op, op)
            
            text = "{}{} {} {}".format(sep, var, op, value)
            return """      {
                "key": """ + key + """,
                "name": "Condition",
                "type": "if",
                "color": "white",
                "isGroup": false,
                "text": """ + '"' + text + '"' + """,
                "opt": 5,
                "__gohashid": """ + str(hash) + """
            }"""

    def listen_process(elem: ET.Element, hash: int, root = None):
        key = elem.attrib['key']
        return """      {
        "key": """ + key + """,
        "name": "Listen",
        "type": "listen",
        "color": "#ffff00",
        "isGroup": false,
        "opt": "",
        "__gohashid": """ + str(hash) + """
      }"""
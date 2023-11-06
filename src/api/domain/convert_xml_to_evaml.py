import xml.etree.ElementTree as ET
import xmlschema
import logging
import copy
import hashlib

class MacroExpander:


    @staticmethod
    def run(tree: ET):
        root = tree.getroot()
        script_node, macros_node = root.find('script'), root.find('macros')

        if tree:
            MacroExpander.expand_macros(script_node, macros_node)
            MacroExpander.process_loop(script_node)
            MacroExpander.process_default(script_node)
            return tree

    def expand_macros(script_node, macros):        
        def expand_recursive(script_node, macros):
            for i_node in range(len(script_node)):
                node = script_node[i_node]
                if len(node) != 0: expand_recursive(node, macros)
                if node.tag == 'useMacro':
                    if not macros: raise Exception('You are using <useMacro> but the section macros does not exist.')
                    for i_macro in range(len(macros)):
                        macro = macros[i_macro]
                        id_macro_node, id_macro =  node.attrib['macro'], macro.attrib['id']
                        if id_macro_node == id_macro:
                            if len(macro) == 0:
                                logging.error('The <useMacro> references the macro {}, which is empty.'.format(id_macro_node))
                                node.attrib.update({
                                    'type': 'macro_is_empty',
                                    'macro_id': id_macro,
                                    'tag': 'error',
                                })
                                node.attrib.pop('macro')
                            else:
                                script_node.remove(node)
                            for i_macro_el in range(len(macros[i_macro])):
                                mac_elem_aux = copy.deepcopy(macros[i_macro][i_macro_el])
                                script_node.insert(i_node + i_macro_el, mac_elem_aux)
                            break
                    if not (id_macro_node == id_macro):
                        node.attrib.update({
                            'type': 'undefined_macro',
                            'macro_id': id_macro,
                            'tag': 'error',
                        })
                        node.attrib.pop("macro")
                        logging.error('The <useMacro> references the macro {}, which is empty.'.format(id_macro_node))

                    expand_recursive(script_node, macros)

        expand_recursive(script_node, macros)
                
    def process_loop(script_node: ET.Element):
        id_loop = 1

        def loop_recursive(script_node, id_loop):
            for i_node in range(len(script_node)):
                node = script_node[i_node]

                if len(node) != 0: loop_recursive(node, id_loop)
                if node.tag == 'loop':
                    loop_cpy = copy.deepcopy(node)
                    counter_el = ET.Element('counter')

                    if node.get('id') != None:
                        counter_el.attrib['id'] = node.attrib['id']

                    loop_var = node.attrib['var'] if node.attrib.get('var') else 'ITERATION_VAR{}'.format(id_loop)
                    loop_amount = node.attrib['times']
                    loop_id_str = 'LOOP_ID{}_{}'.format(id_loop, loop_var)
                    
                    counter_el.attrib.update({
                        'var': loop_var,
                        'op': '=',
                        'value': '1'
                    })

                    switch_el = ET.Element('switch')
                    switch_el.attrib.update({
                        'id': loop_id_str,
                        'var': loop_var,
                    })

                    case_el = ET.Element('case')
                    case_el.attrib.update({
                        'op': 'lte',
                        'value': loop_amount
                    })

                    case_el.extend(loop_cpy)

                    counter_el = ET.Element('counter')
                    counter_el.attrib.update({
                        'var': loop_var,
                        'op': '+',
                        'value': '1',
                    })

                    goto_el = ET.Element('goto')
                    goto_el['target'] = loop_id_str

                    case_el.append(counter_el)
                    case_el.append(goto_el)

                    default_el = ET.Element('default')
                    switch_el.insert(0, case_el)
                    switch_el.insert(1, default_el)

                    script_node.remove(node)
                    script_node.insert(i_node, counter_el)
                    script_node.insert(i_node +1, switch_el)


                    loop_recursive(script_node, id_loop + 1)

        loop_recursive(script_node, id_loop)

    def process_default(script_node: ET.Element):
        for i_node in range(len(script_node)):
            node = script_node[i_node]
            if len(node) != 0: MacroExpander.process_default(node)
            if node.tag == "switch":
                if node[len(node) - 1].tag != "default":
                    node.insert(len(node), ET.Element("default"))


class GenerateKeys:

    @staticmethod
    def run(tree: ET):
        root = tree.getroot()
        hash_object = hashlib.md5(root.attrib["name"].encode())
        root.attrib["id"] = hash_object.hexdigest()

        key = 1000
        root.find('settings').find('voice').attrib['key'] = str(key)
        for node in root.find('script').iter():
            if (node.tag in ('switch', 'script', 'stop', 'goto')): continue
            if node.tag == 'light': 
                if node.get('state') == 'ON' and node.get('color') == None:
                    node.attrib['color'] = 'WHITE'
            if (node.tag == 'case' or node.tag == 'default'):
                node.attrib['child_proc'] = 'false'

            key += 1
            node.attrib['key'] = str(key + 1)

        return tree
    
class GenerateLinks:

    def search_for_errors(script_node, links_node):
        def link_existe(node_key, links_node):
            for link in links_node.iter():
                if node_key == link.get('to'): return True

        for node in script_node.iter():
            if node.tag in ('voice', 'script', 'switch', 'stop', 'goto'): continue
            if not (link_existe(node.attrib.get('key'), links_node)):
                err_str = ', '.join(['(' + ' = '.join(info) + ')' for info in node.attrib.items()])
                logging.warning(' The element {} is disconnected from the execution flow. Attrs: {}'.format(node.tag, err_str))
    
    def insert_voice_element(root: ET.Element):
        script = root.find('script')
        script.insert(0, root.find('settings').find('voice'))

    def remove_voice_element(root: ET.Element):
        root.find('script').remove(root.find('script').find('voice'))

    def process_links(script_node, links):

        def create_link(_from, _to):
            if _to.tag == 'stop' or _from.tag == 'goto': return
            
            if _from.tag == 'switch':
                for el in _from:
                    if (len(el) == 0): create_link(el, _to)
                    else:
                        previous_el = el[len(el) - 1]
                        if (previous_el.tag == 'stop' or previous_el.tag == 'goto'): pass
                        else: create_link(previous_el, _to)
                return
            
            if _to.tag == 'goto':
                target_found = False
                for node in script_node.iter():
                    if node.attrib.get('id') == _to.attrib['target']: 
                        create_link(_from, node)
                        target_found = True
                
                if not target_found:
                    raise Exception('The <goto> target attribute was not found: {}'.format(_to.attrib['target']))
                
                return
            
            if len(_to) == 0: links.append('{},{}'.format(_from.attrib['key'], _to.attrib['key']))
            elif (_to.tag == 'switch'):
                for el in _to:
                    if el.tag == 'case':
                        _to_var = _to.attrib['var']
                        el.attrib['var'], _to_op, _to_value = _to_var, el.attrib['op'], el.attrib['value']
                        if _to_var.isnumeric():
                            raise Exception('The use of constants of any type in the "var" attribute of the <switch> command is not allowed. Please, check var: "{}"'.format(_to_var))
                        if _to_op == 'exact' and '$' not in _to_var:
                            raise Exception('The "exact" comparison type should only be used with var="$" and not with var="{}"'.format(_to_var))
                        if _to_op == 'contain' and '$' not in _to_var:
                            raise Exception('The "contain" comparison type should only be used with var="$" and not with var="{}"'.format(_to_var))
                        if '$' in _to_var and len(_to_var) > 1:
                            raise Exception('Do not use "$" associated with an index in a "var" attribute of a <switch>, only use it in the texts of the <talk> command')
                        if '$' in _to_value and len(_to_value) > 1:
                            raise Exception('Do not use "$" associated with an index in a "value" attribute of a <case>, only use it in the texts of the <talk> command')
                    elif el.tag == 'default':
                        el.attrib.update({
                            'value': '',
                            'op': 'exact',
                        })

                    create_link(_from, el)
            elif (_to.tag == 'case' or _to.tag == 'default'):
                links.append('{},{}'.format(_from.attrib['key'], _to.attrib['key']))
                if len(_to) == 0: pass
                else:
                    if _to.attrib['child_proc'] == "false":
                        _to.attrib['child_proc'] = "true"
                        create_link(_to, _to[0])
                        GenerateLinks.process_links(_to, links)
                        
        for i_node in range(len(script_node) - 1):
            _from = script_node[i_node]
            _to = script_node[i_node + 1]
            
            if _from.tag == 'goto':
                logging.warning('There are elements after the <goto>. These elements may not be reached.')
            if _from.tag == 'stop':
                for _ in range(i_node, len(script_node) - 1):
                    warning_msg = 'Removing unused (unreachable) commands ... <{}>'.format(_to.tag)
                    if _to.get('id'): warning_msg += '| ALERT! This element has an attribute id and it is "{}"'.format(_to.attrib['id'])
                    script_node.remove(_to)

                    logging.warning(warning_msg)
                break
            else:
                create_link(_from, _to)

    def generate_links_tag(root, links):
        root.insert(len(root), ET.Element('links'))

        for i_link in range(len(links)):
            from_id, to_id = links[i_link].split(',')
            root[len(root) - 1].insert(i_link, ET.Element('link', attrib={'from': from_id, 'to': to_id}))
            

    def run(tree: ET):
        root = tree.getroot()
        script_node, links = root.find("script"), []

        GenerateLinks.insert_voice_element(root)
        GenerateLinks.process_links(script_node, links)
        GenerateLinks.generate_links_tag(root, links)
        GenerateLinks.search_for_errors(script_node, root.find('links'))
        GenerateLinks.remove_voice_element(root)

        return tree
        

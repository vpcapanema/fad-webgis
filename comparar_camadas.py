# Script para comparar camadas do frontend (layers.js) com o GetCapabilities do GeoServer
# Gera um relatório de correspondência e sugere atualização do arquivo JS

import xml.etree.ElementTree as ET
import re
import json
from difflib import SequenceMatcher

# Caminhos dos arquivos
JS_PATH = r'c:/Users/vinic/fad-webgis/js/layers.js'
XML_PATH = r'c:/Users/vinic/fad-webgis/geoserverfad.xml'
RELATORIO_PATH = r'c:/Users/vinic/fad-webgis/relatorio_camadas.txt'

# 1. Extrair nomes das camadas do JS (layerConfig)
def extrair_layers_recursivo(obj):
    layers = set()
    if isinstance(obj, dict):
        for v in obj.values():
            if isinstance(v, dict) and 'layer' in v:
                layers.add(v['layer'])
            elif isinstance(v, dict):
                layers.update(extrair_layers_recursivo(v))
            elif isinstance(v, list):
                for item in v:
                    layers.update(extrair_layers_recursivo(item))
    return layers

def extrair_camadas_js(js_path):
    import re
    layers = set()
    with open(js_path, encoding='utf-8') as f:
        conteudo = f.read()
    # Extrai todos os valores de layer: "alguma_coisa"
    layers.update(re.findall(r'layer\s*:\s*["\\\']([^"\'\,}]+)', conteudo))
    # Extrai camadas geradas dinamicamente (ex: fad:INVENTARIO_FLORESTAL_UGRHI...)
    for m in re.finditer(r'for \(let i=(\d+); i<=(\d+); i\+\+\)[\s\S]+?layer: `([^`]+)`', conteudo):
        start, end, template = m.groups()
        for i in range(int(start), int(end)+1):
            idx = str(i).zfill(2)
            layers.add(template.replace('${idx}', idx).replace('{idx}', idx))
    return layers

# 2. Extrair nomes das camadas do XML (GeoServer)
def extrair_camadas_xml(xml_path):
    tree = ET.parse(xml_path)
    root = tree.getroot()
    ns = {'wms': 'http://www.opengis.net/wms'}
    # Busca todos os <Name> dentro de <Layer>
    nomes = set()
    for elem in root.iter():
        if elem.tag.endswith('Name') and elem.text:
            nomes.add(elem.text)
    return nomes

# 3. Comparar e gerar relatório
def gerar_relatorio(js_names, xml_names, relatorio_path):
    correspondentes = js_names & xml_names
    so_js = js_names - xml_names
    so_xml = set(filter(None, xml_names - js_names))  # Remove None
    with open(relatorio_path, 'w', encoding='utf-8') as f:
        f.write('=== Camadas presentes em ambos (GeoServer e frontend) ===\n')
        for n in sorted(correspondentes):
            f.write(f'- {n}\n')
        f.write('\n=== Camadas só no frontend (layers.js) ===\n')
        for n in sorted(so_js):
            f.write(f'- {n}\n')
        f.write('\n=== Camadas só no GeoServer (GetCapabilities) ===\n')
        for n in sorted(so_xml):
            f.write(f'- {n}\n')
    print(f'Relatório gerado em: {relatorio_path}')

def similaridade(a, b):
    return SequenceMatcher(None, a, b).ratio()

def gerar_relatorio_correspondencia(js_layers, xml_layers, relatorio_path, tolerancia=0.8):
    with open(relatorio_path, 'w', encoding='utf-8') as f:
        f.write('Camada JS;Encontrada no GeoServer;Nome no GeoServer;Similaridade (%)\n')
        for camada in sorted(js_layers):
            if camada in xml_layers:
                f.write(f'{camada};EXATA;{camada};100\n')
            else:
                # Busca similaridade (case insensitive)
                match = next((x for x in xml_layers if x.lower() == camada.lower()), None)
                if match:
                    f.write(f'{camada};EXATA (case-insensitive);{match};100\n')
                else:
                    # Busca maior similaridade
                    melhor = None
                    melhor_score = 0
                    for x in xml_layers:
                        score = similaridade(camada, x)
                        if score > melhor_score:
                            melhor = x
                            melhor_score = score
                    if melhor_score >= tolerancia:
                        f.write(f'{camada};SIMILAR;{melhor};{int(melhor_score*100)}\n')
                    else:
                        f.write(f'{camada};NÃO;;\n')
    print(f'Relatório de correspondência gerado em: {relatorio_path}')

def atualizar_layers_js(js_path, relatorio_path, output_path):
    # Lê o relatório e monta um dicionário de substituição
    substituicoes = {}
    with open(relatorio_path, encoding='utf-8') as f:
        next(f)  # pula cabeçalho
        for linha in f:
            partes = linha.strip().split(';')
            if len(partes) >= 4 and partes[1] in ('EXATA', 'SIMILAR', 'EXATA (case-insensitive)') and partes[2]:
                substituicoes[partes[0]] = partes[2]
    # Lê o JS original
    with open(js_path, encoding='utf-8') as f:
        conteudo = f.read()
    # Substitui os valores do campo layer
    def substituir_layer(match):
        valor_antigo = match.group(1)
        valor_novo = substituicoes.get(valor_antigo, valor_antigo)
        return f'layer: "{valor_novo}"'
    conteudo_novo = re.sub(r'layer\s*:\s*"([^"]+)"', substituir_layer, conteudo)
    conteudo_novo = re.sub(r"layer\s*:\s*'([^']+)'", substituir_layer, conteudo_novo)
    # Salva novo arquivo
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(conteudo_novo)
    print(f'Arquivo atualizado salvo em: {output_path}')

if __name__ == '__main__':
    js_layers = extrair_camadas_js(JS_PATH)
    xml_layers = extrair_camadas_xml(XML_PATH)
    gerar_relatorio_correspondencia(js_layers, xml_layers, RELATORIO_PATH, tolerancia=0.8)
    atualizar_layers_js(JS_PATH, RELATORIO_PATH, JS_PATH.replace('.js', '_atualizado.js'))

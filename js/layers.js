// js/layers.js
// Exporta a configuração de grupos, subgrupos e camadas (sem alterar nomes originais).
export const GEOSERVER_URL = 'https://fad-webgis.lat/geoserver/fad/ows?v=20250620&';

export const layerConfig = {
    "Bases Administrativas": {
      "Limite UFs/Brasil":                               { type: "wms", layer: "BrasilUF_update"},
      "Limite UF/SP":                                    { type: "wms", layer: "limite_estadual" },
      "Limite Coordenadorias Gerais Regionais (DER/SP)": { type: "wms", layer: "limite_coordenadorias_gerais_regionais_der" },
      "Limite de Sub-bacias Hidrográficas":              { type: "wms", layer: "LimiteSubBacias2013" },
      "Sedes Municipais SP":                             { type: "wms", layer: "SedesMunicipais" },
      "Limite Residências de Conserva (DER/SP)":         { type: "wms", layer: "residencia_conserva_poligonos" },
      "Sede Residências de Conserva (DER/SP)":           { type: "wms", layer: "residencias_conserva_sedes" },
      "Distritos Municipais SP (SMDU)":                  { type: "wms", layer: "DISTRITO_MUNICIPAL_SP_SMDU" }
    },
  
    "Restrição e Proteção Ambiental": {
      "Proteção": {
        "UC Estadual PI":           { type: "wms", layer: "uc_estadual_pi" },
        "Zona Amortecimento UCEPI": {type: "wms", layer: "uc_estadual_pi_anel10km"}, 
        "UC Estadual US":           { type: "wms", layer: "uc_estadual_us" },
        "Zona Amortecimento UCEUS": {type: "wms", layer: "uc_estadual_us_anel10km"}, 
        "UC Federal PI":            { type: "wms", layer: "uc_federal_pi" },
        "Zona Amortecimento UCFPI": {type: "wms", layer: "uc_federal_pi_anel10km"}, 
        "UC Federal US":            { type: "wms", layer: "uc_federal_us" },
        "Zona Amortecimento UCFUS": {type: "wms", layer: "uc_federal_us_anel10km"}, 
        "Sítios Arqueológicos":     { type: "wms", layer: "SitiosArqueologicos" }
      },
      "Restrição": {
        "Terras Indígenas (TI)":            { type: "wms", layer: "terras_indigenas" },
        "Zona Amortecimento TIs":           {type: "wms", layer: "terras_indigenas_anel10km"}, 
        "Áreas Quilombolas (AQ)":           { type: "wms", layer: "quilombolas" },
        "Zona Amortecimento AQs":           {type: "wms", layer: "terras_indigenas_anel10km"},        
        "Restrição CETESB":                 { type: "wms", layer: "AREAS_RESTRICAO_CETESB_POL" },
        "Restrição DAEE":                   { type: "wms", layer: "AREAS_RESTRICAO_DAEE_POL" },
        "Água Subterrânea Jurubatuba":      { type: "wms", layer: "AREA_RESTRICAO_AGUA_SUBTERRANEA_JURUBATUBA" }
      }
    },
  
    "Base Temática": {
      "Inventário Florestal": (function() {
        const o = {};
        for (let i=1; i<=22; i++) {
          const idx = String(i).padStart(2,'0');
          o[`UGRHI${idx}`] = { type: "wms", layer: `fad:INVENTARIO_FLORESTAL_UGRHI${idx}_IPA_2020_POL` };
        }
        return o;
      })(),
      "Sensibilidade Ambiental": {
        "Erosão (IG 2014)":      { type: "wms", layer: "VWM_AREA_RISCO_EROSAO_IG_2014_POL" },
        "Escorregamento (IG 2014)": { type: "wms", layer: "VWM_AREA_RISCO_ESCORREGAMENTO_IG_2014_POL" },
        "Inundação (IG 2014)":   { type: "wms", layer: "VWM_AREA_RISCO_INUNDACAO_IG_2014_POL" },
        "Solapamento (IG 2014)": { type: "wms", layer: "VWM_AREA_RISCO_SOLAPAMENTO_IG_2014_POL" },
        "Risco de Fogo (INPE)":  { type: "wms", layer: "RISCO_FOGO_ATUALIZADO_INPE" }
      }
    },
  
    "Infraestrutura": {
      "Malha Rodoviária Estadual (DER/SP 2025)":   { type: "wms", layer: "malha_rodoviaria_2025" },
      "Dispositivos Rodoviários pol (DER/SP)"  :   { type: "wms", layer: "dispositivos_alca" },
      "Dispositivos Rodoviários ponto (DER/SP)":   { type: "wms", layer: "dispositivos_ponto" },
      "Balanças (DER/SP)"                      :   { type: "wms", layer: "balancas" }
 
    },
  
    "Projetos": {
      "Estadualização": {
        "Favorabilidade - Malha Rodoviária Municipal": { type: "wms", layer: "favorabilidade_multicriterio_trechos_vicinais" },
        "Indicador de Favorabilidade Socioeconômica (IFS)": { type: "wms", layer: "indicador_favorabilidade_socioeconomico" },
        "Indicador de Favorabilidade Multicritério (IFM)": { type: "wms", layer: "ifm_raw" },
        "Sensibilidade do IFM":                          { type: "wms", layer: "sensibilidade_indicador_favorabilidade_multicriterio_geografico_1" }
      }
    }
  };

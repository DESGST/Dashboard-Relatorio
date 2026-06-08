import os
import pandas as pd
import geopandas as gpd
from shapely.geometry import Point
import pyodbc
from dotenv import load_dotenv

# ==========================================
# CONFIGURAÇÕES DO BANCO DE DADOS (SQL SERVER)
# ==========================================
load_dotenv()

SQL_SERVER = r"10.38.124.65\DB_SINISTROS,9880"
DATABASE = "InfosigaDB"
USERNAME = os.getenv("SQL_USERNAME")
PASSWORD = os.getenv("SQL_PASSWORD")

def get_sql_connection():
    """Cria a conexão com o banco de dados SQL Server."""
    conn_str = (
        f"DRIVER={{ODBC Driver 17 for SQL Server}};"
        f"SERVER={SQL_SERVER};"
        f"DATABASE={DATABASE};"
        f"UID={USERNAME};"
        f"PWD={PASSWORD};"
        f"TrustServerCertificate=yes;"
    )
    return pyodbc.connect(conn_str)

# ==========================================
# FUNÇÕES DE BUSCA DE DADOS
# ==========================================

def buscar_contexto(ano, mes):
    contexto = {"populacao": 0, "frota_total": 0, "frota_motos": 0}
    try:
        conn = get_sql_connection()
        
        # População do IBGE
        query_pop = f"SELECT populacao FROM populacao_ibge WHERE YEAR(mes_ano) = {ano} AND MONTH(mes_ano) = {mes}"
        df_pop = pd.read_sql(query_pop, conn)
        if not df_pop.empty:
            contexto["populacao"] = int(df_pop.iloc[0]['populacao'])
            
        # Frota Senatran
        query_frota = f"SELECT TOTAL, MOTOCICLETA FROM FrotaVeiculosHistorico WHERE ANO = {ano} AND MES = {mes}"
        df_frota = pd.read_sql(query_frota, conn)
        if not df_frota.empty:
            contexto["frota_total"] = int(df_frota.iloc[0]['TOTAL'])
            contexto["frota_motos"] = int(df_frota.iloc[0]['MOTOCICLETA'])
            
        conn.close()
    except Exception as e:
        print(f"Erro no contexto: {e}")
    return contexto

def buscar_totais_modais(ano, mes):
    query = f"""
        SELECT 
            COUNT(id_sinistro) as total,
            SUM(CASE WHEN tipo_de_vitima LIKE '%PEDESTRE%' THEN 1 ELSE 0 END) as pedestres,
            SUM(CASE WHEN tipo_veiculo_vitima LIKE '%BICI%' OR tipo_de_vitima LIKE '%CICL%' THEN 1 ELSE 0 END) as ciclistas,
            SUM(CASE WHEN tipo_veiculo_vitima LIKE '%MOTO%' OR tipo_de_vitima LIKE '%MOTO%' THEN 1 ELSE 0 END) as motociclistas,
            SUM(CASE WHEN tipo_veiculo_vitima LIKE '%AUTO%' OR tipo_veiculo_vitima LIKE '%CARRO%' THEN 1 ELSE 0 END) as automoveis
        FROM vw_pessoas_completa
        WHERE ano_sinistro = {ano} AND mes_sinistro = {mes} AND gravidade_lesao = 'FATAL'
    """
    try:
        conn = get_sql_connection()
        df = pd.read_sql(query, conn)
        conn.close()
        
        if not df.empty:
            totais = df.iloc[0].fillna(0).to_dict()
            identificados = int(totais['pedestres'] + totais['ciclistas'] + totais['motociclistas'] + totais['automoveis'])
            return {
                "total_painel": int(totais['total']),
                "pedestres": int(totais['pedestres']), 
                "ciclistas": int(totais['ciclistas']),
                "motociclistas": int(totais['motociclistas']), 
                "automoveis": int(totais['automoveis']),
                "nao_informados": int(totais['total'] - identificados)
            }
    except Exception as e:
        print(f"Erro nos modais: {e}")
    
    return {"total_painel": 0, "pedestres": 0, "ciclistas": 0, "motociclistas": 0, "automoveis": 0, "nao_informados": 0}

def buscar_totais_get(ano, mes):
    query = f"""
        SELECT 
            s.id_sinistro,
            s.tipo_via,
            COALESCE(c.latitude_geocode, c.latitude_original) AS lat,
            COALESCE(c.longitude_geocode, c.longitude_original) AS lon,
            c.GET AS get_banco
        FROM sinistros_infosiga s
        LEFT JOIN Dados_CET_Tratados c ON s.id_sinistro = c.id_sinistro
        WHERE YEAR(s.data_sinistro) = {ano} 
          AND MONTH(s.data_sinistro) = {mes} 
          AND s.tipo_registro = 'SINISTRO FATAL'
    """
    
    totais_get = {
        "get_1_cn": 0, "get_2_no": 0, "get_3_se": 0, "get_4_su": 0,
        "get_5_so": 0, "get_6_mb": 0, "get_7_le": 0, "get_8_oe": 0,
        "rodovias": 0, "sem_informacao": 0, "total_mapa": 0
    }
    
    try:
        conn = get_sql_connection()
        df = pd.read_sql(query, conn)
        conn.close()
        
        if df.empty:
            return totais_get
            
        totais_get['total_mapa'] = len(df)
            
        # Filtra rodovias primeiro
        mask_rodovia = df['tipo_via'].str.contains('RODOVIA', na=False, case=False)
        totais_get['rodovias'] = int(mask_rodovia.sum())
        
        # Pega as vias urbanas e processa GPS
        df_urbanas = df[~mask_rodovia].copy()
        df_urbanas['lat'] = pd.to_numeric(df_urbanas['lat'], errors='coerce')
        df_urbanas['lon'] = pd.to_numeric(df_urbanas['lon'], errors='coerce')
        
        mask_sem_coord = df_urbanas['lat'].isna() | df_urbanas['lon'].isna()
        totais_get['sem_informacao'] = int(mask_sem_coord.sum())
        
        df_validos = df_urbanas[~mask_sem_coord].copy()
        
        if not df_validos.empty:
            # Caminho dinâmico para o geojson que deve estar na mesma pasta do services.py
            pasta_atual = os.path.dirname(os.path.abspath(__file__))
            nome_geojson = os.path.join(pasta_atual, 'geoportal_gerencia_cet.geojson')
            
            if not os.path.exists(nome_geojson):
                print(f"ERRO: Arquivo '{nome_geojson}' não encontrado.")
                totais_get['sem_informacao'] += len(df_validos)
                return totais_get

            geometry = [Point(xy) for xy in zip(df_validos['lon'], df_validos['lat'])]
            gdf_pontos = gpd.GeoDataFrame(df_validos, geometry=geometry, crs="EPSG:4326")
            
            gdf_mapa = gpd.read_file(nome_geojson)
            if gdf_mapa.crs != "EPSG:4326":
                gdf_mapa = gdf_mapa.to_crs("EPSG:4326")
            
            cruzamento = gpd.sjoin(gdf_pontos, gdf_mapa, how="left", predicate="within")
            coluna_get = next((col for col in ['sg_gerencia', 'dc_sigla_gerencia', 'GET'] if col in cruzamento.columns), None)
            
            if coluna_get:
                cruzamento['get_mapa'] = cruzamento[coluna_get].astype(str).str.upper().str.strip()
                contagens = cruzamento['get_mapa'].value_counts().to_dict()
                
                for valor, qtd in contagens.items():
                    if 'CN' in valor: totais_get['get_1_cn'] += qtd
                    elif 'NO' in valor: totais_get['get_2_no'] += qtd
                    elif 'SE' in valor: totais_get['get_3_se'] += qtd
                    elif 'SU' in valor: totais_get['get_4_su'] += qtd
                    elif 'SO' in valor: totais_get['get_5_so'] += qtd
                    elif 'MB' in valor: totais_get['get_6_mb'] += qtd
                    elif 'LE' in valor: totais_get['get_7_le'] += qtd
                    elif 'OE' in valor: totais_get['get_8_oe'] += qtd
                    elif valor != 'NAN': 
                        totais_get['sem_informacao'] += qtd
                        
                sem_poligono = (cruzamento['get_mapa'] == 'NAN').sum()
                totais_get['sem_informacao'] += int(sem_poligono)
            else:
                totais_get['sem_informacao'] += len(df_validos)
                
    except Exception as e:
        print(f"Erro ao cruzar o mapa: {e}")
        
    return totais_get

# ==========================================
# FUNÇÃO PRINCIPAL EXPORTADA PARA A VIEW
# ==========================================

def gerar_relatorio_completo(ano, mes):
    """
    Chama as 3 consultas SQL e empacota os dados no dicionário 
    exato que o views.py do Django está esperando para salvar.
    """
    contexto = buscar_contexto(ano, mes)
    modais = buscar_totais_modais(ano, mes)
    gets = buscar_totais_get(ano, mes)
    
    dados_formatados = {
        'contexto': contexto,
        'modais_infosiga': modais,
        'geografia': gets,
        'total_obitos_mapa': gets.get('total_mapa', 0)
    }
    
    return dados_formatados
import os
import pandas as pd
import geopandas as gpd
from shapely.geometry import Point
from django.db.models import Sum, Count

# Importando os modelos que o Django gerou a partir do seu banco
from app_planilhas.models import SinistrosInfosiga, PopulacaoIbge, Frotaveiculoshistorico

# ==========================================
# FUNÇÕES DE BUSCA DE DADOS (VIA SUPABASE)
# ==========================================

def buscar_contexto(ano, mes):
    contexto = {"populacao": 0, "frota_total": 0, "frota_motos": 0}
    try:
        # Busca a População
        pop = PopulacaoIbge.objects.filter(mes_ano__year=ano, mes_ano__month=mes).first()
        if pop:
            contexto["populacao"] = pop.populacao or 0
            
        # Busca a Frota
        frota = Frotaveiculoshistorico.objects.filter(ano=ano, mes=mes).first()
        if frota:
            contexto["frota_total"] = frota.total or 0
            contexto["frota_motos"] = frota.motocicleta or 0
            
    except Exception as e:
        print(f"Erro no contexto: {e}")
    return contexto

def buscar_totais_modais(ano, mes):
    try:
        # Trocamos o filtro para ficar idêntico ao das GETs que funcionou!
        agregados = SinistrosInfosiga.objects.filter(
            data_sinistro__year=ano,
            data_sinistro__month=mes,
            tipo_registro='SINISTRO FATAL' 
        ).aggregate(
            total=Count('id_sinistro'),
            pedestres=Sum('qtd_pedestre'),
            ciclistas=Sum('qtd_bicicleta'),
            motociclistas=Sum('qtd_motocicleta'),
            automoveis=Sum('qtd_automovel')
        )
        
        total = agregados['total'] or 0
        pedestres = agregados['pedestres'] or 0
        ciclistas = agregados['ciclistas'] or 0
        motociclistas = agregados['motociclistas'] or 0
        automoveis = agregados['automoveis'] or 0
        
        identificados = pedestres + ciclistas + motociclistas + automoveis

        return {
            "total_painel": total,
            "pedestres": pedestres, 
            "ciclistas": ciclistas,
            "motociclistas": motociclistas, 
            "automoveis": automoveis,
            "nao_informados": total - identificados if (total - identificados) > 0 else 0
        }
    except Exception as e:
        print(f"Erro nos modais: {e}")
    
    return {"total_painel": 0, "pedestres": 0, "ciclistas": 0, "motociclistas": 0, "automoveis": 0, "nao_informados": 0}
    
def buscar_totais_get(ano, mes):
    totais_get = {
        "get_1_cn": 0, "get_2_no": 0, "get_3_se": 0, "get_4_su": 0,
        "get_5_so": 0, "get_6_mb": 0, "get_7_le": 0, "get_8_oe": 0,
        "rodovias": 0, "sem_informacao": 0, "total_mapa": 0
    }
    
    try:
        # Puxa os dados da nuvem e já converte num DataFrame pro Geopandas usar!
        sinistros = SinistrosInfosiga.objects.filter(
            data_sinistro__year=ano,
            data_sinistro__month=mes,
            tipo_registro='SINISTRO FATAL'
        ).values('id_sinistro', 'tipo_via', 'latitude', 'longitude')

        if not sinistros:
            return totais_get
            
        df = pd.DataFrame(list(sinistros))
        
        # Renomeia as colunas para o resto do seu código funcionar perfeitamente
        df = df.rename(columns={'latitude': 'lat', 'longitude': 'lon'})

        totais_get['total_mapa'] = len(df)
            
        # O SEU CÓDIGO INTACTO DAQUI PARA BAIXO!
        mask_rodovia = df['tipo_via'].str.contains('RODOVIA', na=False, case=False)
        totais_get['rodovias'] = int(mask_rodovia.sum())
        
        df_urbanas = df[~mask_rodovia].copy()
        df_urbanas['lat'] = pd.to_numeric(df_urbanas['lat'], errors='coerce')
        df_urbanas['lon'] = pd.to_numeric(df_urbanas['lon'], errors='coerce')
        
        mask_sem_coord = df_urbanas['lat'].isna() | df_urbanas['lon'].isna()
        totais_get['sem_informacao'] = int(mask_sem_coord.sum())
        
        df_validos = df_urbanas[~mask_sem_coord].copy()
        
        if not df_validos.empty:
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
import datetime
import pandas as pd
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .services import gerar_relatorio_completo, get_sql_connection

@api_view(['GET'])
def relatorio_api(request):
    """Endpoint para consultar os dados consolidados de um mês específico."""
    ano_req = request.GET.get('ano')
    mes_req = request.GET.get('mes')

    # Caso não envie parâmetros, define o mês anterior como padrão
    if not ano_req or not mes_req:
        hoje = datetime.date.today()
        ano_req = hoje.year
        mes_req = hoje.month - 1 if hoje.month > 1 else 12
        if mes_req == 12: 
            ano_req -= 1

    try:
        ano = int(ano_req)
        mes = int(mes_req)
        
        # 1. Puxa os dados brutos do SQL Server através do Service
        dados_brutos = gerar_relatorio_completo(ano, mes)
        
        # 2. Extrai variáveis para cálculo de taxas
        pop = dados_brutos['contexto']['populacao']
        frota = dados_brutos['contexto']['frota_total']
        total_obitos = dados_brutos['modais_infosiga']['total_painel']
        
        taxa_100k = round((total_obitos / pop) * 100000, 2) if pop > 0 else 0
        taxa_10k = round((total_obitos / frota) * 10000, 2) if frota > 0 else 0

        # 3. Estrutura o retorno JSON para o Frontend
        payload = {
            'ano': ano,
            'mes': mes,
            'contexto': dados_brutos['contexto'],
            'modais': dados_brutos['modais_infosiga'],
            'geografia': dados_brutos['geografia'],
            'taxas': {
                'mortalidade_100k': taxa_100k,
                'mortalidade_10k': taxa_10k
            }
        }
        return Response(payload)
        
    except Exception as e:
        return Response({'erro': str(e)}, status=400)


@api_view(['GET'])
def historico_api(request):
    """Endpoint que varre o histórico desde 2022 para alimentar a animação do painel."""
    query = """
        SELECT ano_sinistro as ano, mes_sinistro as mes, COUNT(id_sinistro) as total
        FROM vw_pessoas_completa
        WHERE ano_sinistro >= 2022 AND gravidade_lesao = 'FATAL'
        GROUP BY ano_sinistro, mes_sinistro
        ORDER BY ano_sinistro, mes_sinistro
    """
    try:
        conn = get_sql_connection()
        df = pd.read_sql(query, conn)
        conn.close()
        
        # Converte o DataFrame do pandas em uma lista JSON nativa
        dados = df.to_dict(orient='records')
        return Response(dados)
    except Exception as e:
        return Response({'erro': str(e)}, status=400)
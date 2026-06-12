from django.db.models import Count
from django.db.models.functions import ExtractYear, ExtractMonth
from app_planilhas.models import SinistrosInfosiga # Garanta que esse import existe!
from rest_framework.decorators import api_view
from rest_framework.response import Response

# ... (sua função relatorio_api fica aqui) ...

@api_view(['GET'])
def historico_api(request):
    """Endpoint que varre o histórico desde 2022 usando o banco da nuvem."""
    try:
        # 1. Busca os dados no Supabase usando o Django ORM
        historico = (
            SinistrosInfosiga.objects
            # Extrai o Ano e o Mês da coluna data_sinistro
            .annotate(
                ano=ExtractYear('data_sinistro'),
                mes=ExtractMonth('data_sinistro')
            )
            # Filtra do ano 2022 em diante e apenas acidentes com fatalidade
            .filter(
                ano__gte=2022, 
                qtd_gravidade_fatal__gt=0  # Filtro baseado na tabela de sinistros
            )
            # Agrupa por ano e mês
            .values('ano', 'mes')
            # Conta quantos sinistros ocorreram
            .annotate(total=Count('id_sinistro'))
            # Ordena do mais antigo pro mais novo
            .order_by('ano', 'mes')
        )
        
        # 2. Retorna a lista pronta para o frontend
        return Response(list(historico))

    except Exception as e:
        return Response({'erro': str(e)}, status=400)
        
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

from django.core.management.base import BaseCommand
from django.conf import settings
from supabase import create_client, Client

# Importando TODOS os modelos de uma vez
from app_planilhas.models import SinistrosInfosiga, PopulacaoIbge, Frotaveiculoshistorico  

class Command(BaseCommand):
    help = 'Sincroniza todos os dados (Sinistros, Frota e População) do banco interno para o Supabase'

    def handle(self, *args, **options):
        self.stdout.write("Iniciando o Mega-Robô de Sincronização...")

        # Conecta no Supabase
        url: str = settings.SUPABASE_URL
        key: str = settings.SUPABASE_KEY
        supabase: Client = create_client(url, key)
        
        # ==========================================
        # 1. SINCRONIZAR POPULAÇÃO (Apenas se vazio)
        # ==========================================
        self.stdout.write("\n--- Verificando População ---")
        res_pop = supabase.table('populacao_ibge').select('id').limit(1).execute()
        
        if not res_pop.data:
            self.stdout.write("Cofre de População vazio. Buscando dados locais...")
            # Força o Django a não buscar a coluna 'id' usando o .values()
            dados_pop = PopulacaoIbge.objects.values('mes_ano', 'populacao', 'fonte')
            pacote_pop = [{"mes_ano": str(p['mes_ano']), "populacao": p['populacao'], "fonte": p['fonte']} for p in dados_pop]
            
            if pacote_pop:
                supabase.table('populacao_ibge').insert(pacote_pop).execute()
                self.stdout.write(self.style.SUCCESS(f'Sucesso: {len(pacote_pop)} registros de População enviados!'))
        else:
            self.stdout.write(self.style.WARNING("População já possui dados na nuvem. Pulando..."))

        # ==========================================
        # 2. SINCRONIZAR FROTA (Apenas se vazio)
        # ==========================================
        self.stdout.write("\n--- Verificando Frota ---")
        res_frota = supabase.table('frota_veiculos').select('id').limit(1).execute()
        
        if not res_frota.data:
            self.stdout.write("Cofre de Frota vazio. Buscando dados locais...")
            # Força o Django a não buscar a coluna 'id' usando o .values()
            dados_frota = Frotaveiculoshistorico.objects.values('ano', 'mes', 'total', 'motocicleta')
            pacote_frota = [{"ano": f['ano'], "mes": f['mes'], "total": f['total'], "motocicleta": f['motocicleta']} for f in dados_frota]
            
            if pacote_frota:
                tamanho_lote = 500
                for i in range(0, len(pacote_frota), tamanho_lote):
                    lote = pacote_frota[i:i + tamanho_lote]
                    supabase.table('frota_veiculos').insert(lote).execute()
                self.stdout.write(self.style.SUCCESS(f'Sucesso: {len(pacote_frota)} registros de Frota enviados!'))
        else:
            self.stdout.write(self.style.WARNING("Frota já possui dados na nuvem. Pulando..."))

        # ==========================================
        # 3. SINCRONIZAR SINISTROS (Busca Incremental)
        # ==========================================
        self.stdout.write("\n--- Verificando Sinistros Diários ---")
        nome_tabela_supabase = 'sinistros_infosiga'

        self.stdout.write("Consultando o último ID salvo na nuvem...")
        resposta = supabase.table(nome_tabela_supabase).select('id_sinistro').order('id_sinistro', desc=True).limit(1).execute()
        
        ultimo_id_na_nuvem = 0
        if resposta.data:
            ultimo_id_na_nuvem = resposta.data[0]['id_sinistro']
            
        self.stdout.write(f"Último ID na nuvem: {ultimo_id_na_nuvem}")

        # A tabela de Sinistros não tem esse problema, então mantemos normal
        dados_novos = SinistrosInfosiga.objects.filter(id_sinistro__gt=ultimo_id_na_nuvem).order_by('id_sinistro')
        quantidade_novos = dados_novos.count()

        if quantidade_novos == 0:
            self.stdout.write(self.style.SUCCESS('Tudo em paz! Nenhum sinistro novo encontrado.'))
            return

        self.stdout.write(self.style.WARNING(f'Atenção: Encontrados {quantidade_novos} novos sinistros. Iniciando envio...'))
        
        pacote_para_enviar = []
        for item in dados_novos:
            registro = {
                "id_sinistro": item.id_sinistro,
                "tipo_registro": item.tipo_registro,
                "data_sinistro": str(item.data_sinistro) if item.data_sinistro else None,
                "hora_sinistro": str(item.hora_sinistro) if item.hora_sinistro else None,
                "dia_da_semana": item.dia_da_semana,
                "turno": item.turno,
                "logradouro": item.logradouro,
                "tipo_via": item.tipo_via,
                "latitude": item.latitude,
                "longitude": item.longitude,
                "tp_sinistro_primario": item.tp_sinistro_primario,
                "qtd_pedestre": item.qtd_pedestre if item.qtd_pedestre else 0,
                "qtd_bicicleta": item.qtd_bicicleta if item.qtd_bicicleta else 0,
                "qtd_motocicleta": item.qtd_motocicleta if item.qtd_motocicleta else 0,
                "qtd_automovel": item.qtd_automovel if item.qtd_automovel else 0,
                "qtd_gravidade_fatal": item.qtd_gravidade_fatal if item.qtd_gravidade_fatal else 0
            }
            pacote_para_enviar.append(registro)

        try:
            tamanho_lote = 1000
            for i in range(0, len(pacote_para_enviar), tamanho_lote):
                lote = pacote_para_enviar[i:i + tamanho_lote]
                supabase.table(nome_tabela_supabase).insert(lote).execute()
                
            self.stdout.write(self.style.SUCCESS(f'Sucesso absoluto! {quantidade_novos} registros enviados para o Supabase.'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Ocorreu um erro ao enviar para a nuvem: {str(e)}'))
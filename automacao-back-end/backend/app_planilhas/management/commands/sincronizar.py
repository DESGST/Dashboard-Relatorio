from django.core.management.base import BaseCommand
from django.conf import settings
from supabase import create_client, Client
from app_planilhas.models import SinistrosInfosiga  # Importando o modelo exato que o Django gerou

class Command(BaseCommand):
    help = 'Sincroniza dados novos de Sinistros do banco interno para o Supabase'

    def handle(self, *args, **options):
        self.stdout.write("Iniciando verificação de dados no Infosiga...")

        # 1. Conecta no Supabase
        url: str = settings.SUPABASE_URL
        key: str = settings.SUPABASE_KEY
        supabase: Client = create_client(url, key)
        
        # Nome da tabela que você vai criar lá no site do Supabase
        nome_tabela_supabase = 'sinistros_infosiga'

        # 2. Descobre qual é o maior ID que já está salvo na nuvem
        self.stdout.write("Consultando o último ID salvo na nuvem...")
        resposta = supabase.table(nome_tabela_supabase).select('id_sinistro').order('id_sinistro', desc=True).limit(1).execute()
        
        ultimo_id_na_nuvem = 0
        if resposta.data:
            ultimo_id_na_nuvem = resposta.data[0]['id_sinistro']
            
        self.stdout.write(f"Último ID na nuvem: {ultimo_id_na_nuvem}")

        # 3. Busca no banco interno tudo que for MAIOR que esse ID
        dados_novos = SinistrosInfosiga.objects.filter(id_sinistro__gt=ultimo_id_na_nuvem).order_by('id_sinistro')

        quantidade_novos = dados_novos.count()

        if quantidade_novos == 0:
            self.stdout.write(self.style.SUCCESS('Tudo em paz! Nenhum sinistro novo encontrado.'))
            return

        self.stdout.write(self.style.WARNING(f'Atenção: Encontrados {quantidade_novos} novos sinistros. Iniciando envio...'))
        
        # 4. Prepara o pacote de dados
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
                "tp_sinistro_primario": item.tp_sinistro_primario
            }
            pacote_para_enviar.append(registro)

        # 5. Envia para o Supabase (enviamos de 1000 em 1000 para não travar a rede)
        try:
            # Fatiando a lista em lotes para evitar sobrecarga de memória caso haja muitos dados
            tamanho_lote = 1000
            for i in range(0, len(pacote_para_enviar), tamanho_lote):
                lote = pacote_para_enviar[i:i + tamanho_lote]
                supabase.table(nome_tabela_supabase).insert(lote).execute()
                
            self.stdout.write(self.style.SUCCESS(f'Sucesso absoluto! {quantidade_novos} registros enviados para o Supabase.'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Ocorreu um erro ao enviar para a nuvem: {str(e)}'))
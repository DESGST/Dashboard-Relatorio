# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models


class DadosCetTratados(models.Model):
    id_sinistro = models.IntegerField()
    logradouro = models.CharField(max_length=255, db_collation='Latin1_General_CI_AS', blank=True, null=True)
    numero_logradouro = models.CharField(max_length=50, db_collation='Latin1_General_CI_AS', blank=True, null=True)
    latitude_original = models.FloatField(blank=True, null=True)
    longitude_original = models.FloatField(blank=True, null=True)
    latitude_geocode = models.FloatField(blank=True, null=True)
    longitude_geocode = models.FloatField(blank=True, null=True)
    codlog = models.CharField(max_length=20, db_collation='Latin1_General_CI_AS', blank=True, null=True)
    logradouro_pmsp = models.CharField(db_column='logradouro_PMSP', max_length=255, db_collation='Latin1_General_CI_AS', blank=True, null=True)  # Field name made lowercase.
    det = models.CharField(db_column='DET', max_length=10, db_collation='Latin1_General_CI_AS', blank=True, null=True)  # Field name made lowercase.
    get = models.CharField(db_column='GET', max_length=10, db_collation='Latin1_General_CI_AS', blank=True, null=True)  # Field name made lowercase.
    sub = models.CharField(db_column='SUB', max_length=10, db_collation='Latin1_General_CI_AS', blank=True, null=True)  # Field name made lowercase.
    distrito_nome = models.CharField(db_column='Distrito_Nome', max_length=100, db_collation='Latin1_General_CI_AS', blank=True, null=True)  # Field name made lowercase.
    regiao_nome = models.CharField(db_column='Regiao_Nome', max_length=50, db_collation='Latin1_General_CI_AS', blank=True, null=True)  # Field name made lowercase.
    classificacao = models.CharField(db_column='Classificacao', max_length=50, db_collation='Latin1_General_CI_AS', blank=True, null=True)  # Field name made lowercase.
    similaridade = models.IntegerField(blank=True, null=True)
    distancia_km = models.FloatField(blank=True, null=True)
    fora_circunscricao = models.CharField(max_length=10, db_collation='Latin1_General_CI_AS', blank=True, null=True)
    field_fonte_busca = models.CharField(db_column='_fonte_busca', max_length=50, db_collation='Latin1_General_CI_AS', blank=True, null=True)  # Field renamed because it started with '_'.
    logradouros_com_vias_cplx = models.CharField(max_length=255, db_collation='Latin1_General_CI_AS', blank=True, null=True)
    via_cplx = models.CharField(max_length=10, db_collation='Latin1_General_CI_AS', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'Dados_CET_Tratados'


class Frotaveiculoshistorico(models.Model):
    data = models.DateField(db_column='DATA', blank=True, null=True)  # Field name made lowercase.
    ano = models.BigIntegerField(db_column='ANO', blank=True, null=True)  # Field name made lowercase.
    mes = models.BigIntegerField(db_column='MES', blank=True, null=True)  # Field name made lowercase.
    automovel = models.BigIntegerField(db_column='AUTOMOVEL', blank=True, null=True)  # Field name made lowercase.
    motocicleta = models.BigIntegerField(db_column='MOTOCICLETA', blank=True, null=True)  # Field name made lowercase.
    onibus = models.BigIntegerField(db_column='ONIBUS', blank=True, null=True)  # Field name made lowercase.
    caminhao = models.BigIntegerField(db_column='CAMINHAO', blank=True, null=True)  # Field name made lowercase.
    outros = models.BigIntegerField(db_column='OUTROS', blank=True, null=True)  # Field name made lowercase.
    total = models.BigIntegerField(db_column='TOTAL', blank=True, null=True)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'FrotaVeiculosHistorico'


class FrotaveiculoshistoricoBkp(models.Model):
    data = models.DateField(db_column='DATA', blank=True, null=True)  # Field name made lowercase.
    ano = models.BigIntegerField(db_column='ANO', blank=True, null=True)  # Field name made lowercase.
    mes = models.BigIntegerField(db_column='MES', blank=True, null=True)  # Field name made lowercase.
    automovel = models.BigIntegerField(db_column='AUTOMOVEL', blank=True, null=True)  # Field name made lowercase.
    motocicleta = models.BigIntegerField(db_column='MOTOCICLETA', blank=True, null=True)  # Field name made lowercase.
    onibus = models.BigIntegerField(db_column='ONIBUS', blank=True, null=True)  # Field name made lowercase.
    caminhao = models.BigIntegerField(db_column='CAMINHAO', blank=True, null=True)  # Field name made lowercase.
    outros = models.BigIntegerField(db_column='OUTROS', blank=True, null=True)  # Field name made lowercase.
    total = models.BigIntegerField(db_column='TOTAL', blank=True, null=True)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'FrotaVeiculosHistorico_bkp'


class PessoasInfosiga(models.Model):
    id_sinistro = models.ForeignKey('SinistrosInfosiga', models.DO_NOTHING, db_column='id_sinistro')
    id_veiculo = models.IntegerField(blank=True, null=True)
    tipo_via = models.CharField(max_length=20, db_collation='Latin1_General_CI_AS')
    tipo_veiculo_vitima = models.CharField(max_length=20, db_collation='Latin1_General_CI_AS', blank=True, null=True)
    sexo = models.CharField(max_length=14, db_collation='Latin1_General_CI_AS')
    idade = models.SmallIntegerField(blank=True, null=True)
    gravidade_lesao = models.CharField(max_length=14, db_collation='Latin1_General_CI_AS')
    tipo_de_vitima = models.CharField(max_length=14, db_collation='Latin1_General_CI_AS', blank=True, null=True)
    faixa_etaria_demografica = models.CharField(max_length=14, db_collation='Latin1_General_CI_AS')
    faixa_etaria_legal = models.CharField(max_length=14, db_collation='Latin1_General_CI_AS')
    profissao = models.CharField(max_length=140, db_collation='Latin1_General_CI_AS', blank=True, null=True)
    grau_de_instrucao = models.CharField(max_length=50, db_collation='Latin1_General_CI_AS', blank=True, null=True)
    nacionalidade = models.CharField(max_length=60, db_collation='Latin1_General_CI_AS', blank=True, null=True)
    data_sinistro = models.DateField()
    data_obito = models.DateField(blank=True, null=True)
    local_obito = models.CharField(max_length=100, db_collation='Latin1_General_CI_AS', blank=True, null=True)
    tempo_sinistro_obito = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'pessoas_infosiga'


class PessoasInfosigaBkp(models.Model):
    id_sinistro = models.IntegerField()
    id_veiculo = models.IntegerField(blank=True, null=True)
    tipo_via = models.CharField(max_length=20, db_collation='Latin1_General_CI_AS')
    tipo_veiculo_vitima = models.CharField(max_length=20, db_collation='Latin1_General_CI_AS', blank=True, null=True)
    sexo = models.CharField(max_length=14, db_collation='Latin1_General_CI_AS')
    idade = models.SmallIntegerField(blank=True, null=True)
    gravidade_lesao = models.CharField(max_length=14, db_collation='Latin1_General_CI_AS')
    tipo_de_vitima = models.CharField(max_length=14, db_collation='Latin1_General_CI_AS', blank=True, null=True)
    faixa_etaria_demografica = models.CharField(max_length=14, db_collation='Latin1_General_CI_AS')
    faixa_etaria_legal = models.CharField(max_length=14, db_collation='Latin1_General_CI_AS')
    profissao = models.CharField(max_length=140, db_collation='Latin1_General_CI_AS', blank=True, null=True)
    grau_de_instrucao = models.CharField(max_length=50, db_collation='Latin1_General_CI_AS', blank=True, null=True)
    nacionalidade = models.CharField(max_length=60, db_collation='Latin1_General_CI_AS', blank=True, null=True)
    data_sinistro = models.DateField()
    data_obito = models.DateField(blank=True, null=True)
    local_obito = models.CharField(max_length=100, db_collation='Latin1_General_CI_AS', blank=True, null=True)
    tempo_sinistro_obito = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'pessoas_infosiga_bkp'


class PopulacaoIbge(models.Model):
    mes_ano = models.DateField(blank=True, null=True)
    populacao = models.IntegerField(blank=True, null=True)
    fonte = models.CharField(max_length=20, db_collation='Latin1_General_CI_AS', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'populacao_ibge'


class SinistrosInfosiga(models.Model):
    id_sinistro = models.IntegerField(primary_key=True)
    tipo_registro = models.CharField(max_length=35, db_collation='Latin1_General_CI_AS')
    data_sinistro = models.DateField()
    hora_sinistro = models.TimeField(blank=True, null=True)
    dia_da_semana = models.CharField(max_length=13, db_collation='Latin1_General_CI_AS', blank=True, null=True)
    turno = models.CharField(max_length=14, db_collation='Latin1_General_CI_AS')
    logradouro = models.CharField(max_length=255, db_collation='Latin1_General_CI_AS', blank=True, null=True)
    numero_logradouro = models.FloatField(blank=True, null=True)
    tipo_via = models.CharField(max_length=30, db_collation='Latin1_General_CI_AS')
    tipo_local = models.CharField(max_length=14, db_collation='Latin1_General_CI_AS', blank=True, null=True)
    latitude = models.FloatField(blank=True, null=True)
    longitude = models.FloatField(blank=True, null=True)
    tp_sinistro_primario = models.CharField(max_length=14, db_collation='Latin1_General_CI_AS')
    qtd_pedestre = models.SmallIntegerField(blank=True, null=True)
    qtd_bicicleta = models.SmallIntegerField(blank=True, null=True)
    qtd_motocicleta = models.SmallIntegerField(blank=True, null=True)
    qtd_automovel = models.SmallIntegerField(blank=True, null=True)
    qtd_onibus = models.SmallIntegerField(blank=True, null=True)
    qtd_caminhao = models.SmallIntegerField(blank=True, null=True)
    qtd_veic_outros = models.SmallIntegerField(blank=True, null=True)
    qtd_veic_nao_disponivel = models.SmallIntegerField(blank=True, null=True)
    qtd_gravidade_fatal = models.SmallIntegerField(blank=True, null=True)
    qtd_gravidade_grave = models.SmallIntegerField(blank=True, null=True)
    qtd_gravidade_leve = models.SmallIntegerField(blank=True, null=True)
    qtd_gravidade_ileso = models.SmallIntegerField(blank=True, null=True)
    qtd_gravidade_nao_disponivel = models.SmallIntegerField(blank=True, null=True)
    tp_sinistro_atropelamento = models.CharField(max_length=3, db_collation='Latin1_General_CI_AS', blank=True, null=True)
    tp_sinistro_colisao_frontal = models.CharField(max_length=3, db_collation='Latin1_General_CI_AS', blank=True, null=True)
    tp_sinistro_colisao_traseira = models.CharField(max_length=3, db_collation='Latin1_General_CI_AS', blank=True, null=True)
    tp_sinistro_colisao_lateral = models.CharField(max_length=3, db_collation='Latin1_General_CI_AS', blank=True, null=True)
    tp_sinistro_colisao_transversal = models.CharField(max_length=3, db_collation='Latin1_General_CI_AS', blank=True, null=True)
    tp_sinistro_colisao_outros = models.CharField(max_length=3, db_collation='Latin1_General_CI_AS', blank=True, null=True)
    tp_sinistro_choque = models.CharField(max_length=3, db_collation='Latin1_General_CI_AS', blank=True, null=True)
    tp_sinistro_capotamento = models.CharField(max_length=3, db_collation='Latin1_General_CI_AS', blank=True, null=True)
    tp_sinistro_engavetamento = models.CharField(max_length=3, db_collation='Latin1_General_CI_AS', blank=True, null=True)
    tp_sinistro_tombamento = models.CharField(max_length=3, db_collation='Latin1_General_CI_AS', blank=True, null=True)
    tp_sinistro_outros = models.CharField(max_length=3, db_collation='Latin1_General_CI_AS', blank=True, null=True)
    tp_sinistro_nao_disponivel = models.CharField(max_length=3, db_collation='Latin1_General_CI_AS', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'sinistros_infosiga'


class SinistrosInfosigaBkp(models.Model):
    id_sinistro = models.IntegerField()
    tipo_registro = models.CharField(max_length=35, db_collation='Latin1_General_CI_AS')
    data_sinistro = models.DateField()
    hora_sinistro = models.TimeField(blank=True, null=True)
    dia_da_semana = models.CharField(max_length=13, db_collation='Latin1_General_CI_AS', blank=True, null=True)
    turno = models.CharField(max_length=14, db_collation='Latin1_General_CI_AS')
    logradouro = models.CharField(max_length=255, db_collation='Latin1_General_CI_AS', blank=True, null=True)
    numero_logradouro = models.FloatField(blank=True, null=True)
    tipo_via = models.CharField(max_length=30, db_collation='Latin1_General_CI_AS')
    tipo_local = models.CharField(max_length=14, db_collation='Latin1_General_CI_AS', blank=True, null=True)
    latitude = models.FloatField(blank=True, null=True)
    longitude = models.FloatField(blank=True, null=True)
    tp_sinistro_primario = models.CharField(max_length=14, db_collation='Latin1_General_CI_AS')
    qtd_pedestre = models.SmallIntegerField(blank=True, null=True)
    qtd_bicicleta = models.SmallIntegerField(blank=True, null=True)
    qtd_motocicleta = models.SmallIntegerField(blank=True, null=True)
    qtd_automovel = models.SmallIntegerField(blank=True, null=True)
    qtd_onibus = models.SmallIntegerField(blank=True, null=True)
    qtd_caminhao = models.SmallIntegerField(blank=True, null=True)
    qtd_veic_outros = models.SmallIntegerField(blank=True, null=True)
    qtd_veic_nao_disponivel = models.SmallIntegerField(blank=True, null=True)
    qtd_gravidade_fatal = models.SmallIntegerField(blank=True, null=True)
    qtd_gravidade_grave = models.SmallIntegerField(blank=True, null=True)
    qtd_gravidade_leve = models.SmallIntegerField(blank=True, null=True)
    qtd_gravidade_ileso = models.SmallIntegerField(blank=True, null=True)
    qtd_gravidade_nao_disponivel = models.SmallIntegerField(blank=True, null=True)
    tp_sinistro_atropelamento = models.CharField(max_length=3, db_collation='Latin1_General_CI_AS', blank=True, null=True)
    tp_sinistro_colisao_frontal = models.CharField(max_length=3, db_collation='Latin1_General_CI_AS', blank=True, null=True)
    tp_sinistro_colisao_traseira = models.CharField(max_length=3, db_collation='Latin1_General_CI_AS', blank=True, null=True)
    tp_sinistro_colisao_lateral = models.CharField(max_length=3, db_collation='Latin1_General_CI_AS', blank=True, null=True)
    tp_sinistro_colisao_transversal = models.CharField(max_length=3, db_collation='Latin1_General_CI_AS', blank=True, null=True)
    tp_sinistro_colisao_outros = models.CharField(max_length=3, db_collation='Latin1_General_CI_AS', blank=True, null=True)
    tp_sinistro_choque = models.CharField(max_length=3, db_collation='Latin1_General_CI_AS', blank=True, null=True)
    tp_sinistro_capotamento = models.CharField(max_length=3, db_collation='Latin1_General_CI_AS', blank=True, null=True)
    tp_sinistro_engavetamento = models.CharField(max_length=3, db_collation='Latin1_General_CI_AS', blank=True, null=True)
    tp_sinistro_tombamento = models.CharField(max_length=3, db_collation='Latin1_General_CI_AS', blank=True, null=True)
    tp_sinistro_outros = models.CharField(max_length=3, db_collation='Latin1_General_CI_AS', blank=True, null=True)
    tp_sinistro_nao_disponivel = models.CharField(max_length=3, db_collation='Latin1_General_CI_AS', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'sinistros_infosiga_bkp'


class VeiculosInfosiga(models.Model):
    pk = models.CompositePrimaryKey('id_sinistro', 'id_veiculo')
    id_sinistro = models.ForeignKey(SinistrosInfosiga, models.DO_NOTHING, db_column='id_sinistro')
    id_veiculo = models.IntegerField()
    marca_modelo = models.CharField(max_length=140, db_collation='Latin1_General_CI_AS', blank=True, null=True)
    ano_fab = models.SmallIntegerField(blank=True, null=True)
    ano_modelo = models.SmallIntegerField(blank=True, null=True)
    cor_veiculo = models.CharField(max_length=30, db_collation='Latin1_General_CI_AS', blank=True, null=True)
    tipo_veiculo = models.CharField(max_length=14, db_collation='Latin1_General_CI_AS')
    data_sinistro = models.DateField()

    class Meta:
        managed = False
        db_table = 'veiculos_infosiga'


class VeiculosInfosigaBkp(models.Model):
    id_sinistro = models.IntegerField()
    id_veiculo = models.IntegerField()
    marca_modelo = models.CharField(max_length=140, db_collation='Latin1_General_CI_AS', blank=True, null=True)
    ano_fab = models.SmallIntegerField(blank=True, null=True)
    ano_modelo = models.SmallIntegerField(blank=True, null=True)
    cor_veiculo = models.CharField(max_length=30, db_collation='Latin1_General_CI_AS', blank=True, null=True)
    tipo_veiculo = models.CharField(max_length=14, db_collation='Latin1_General_CI_AS')
    data_sinistro = models.DateField()

    class Meta:
        managed = False
        db_table = 'veiculos_infosiga_bkp'

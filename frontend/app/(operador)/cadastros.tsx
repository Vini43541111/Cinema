import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Classificacao } from '@/components/SessaoItem';
import { Aviso, Bloco, Botao, Campo, Carregando, confirmar, Linha, Opcoes, Subtitulo, Tela, Texto, Titulo, Vazio } from '@/components/ui';
import { api, mensagemErro } from '@/lib/api';
import { dataHora, mascaraData, mascaraHora, moeda, paraISO } from '@/lib/format';
import { useCarregar } from '@/lib/hooks';
import type { Filme, Sala, Sessao } from '@/lib/types';
import { cores, espaco } from '@/lib/theme';

type Aba = 'filmes' | 'salas' | 'sessoes';

export default function Cadastros() {
  const [aba, setAba] = useState<Aba>('sessoes');
  return (
    <Tela>
      <Titulo>Cadastros</Titulo>
      <Opcoes
        valor={aba}
        onChange={setAba}
        opcoes={[
          { valor: 'sessoes', rotulo: 'Sessões' },
          { valor: 'filmes', rotulo: 'Filmes e eventos' },
          { valor: 'salas', rotulo: 'Salas' },
        ]}
      />
      {aba === 'filmes' ? <Filmes /> : aba === 'salas' ? <Salas /> : <Sessoes />}
    </Tela>
  );
}

function useEnvio() {
  const [enviando, setEnviando] = useState(false);
  const [msg, setMsg] = useState<{ tipo: 'erro' | 'sucesso'; texto: string } | null>(null);
  async function executar(fn: () => Promise<void>, sucesso: string) {
    setEnviando(true);
    setMsg(null);
    try {
      await fn();
      setMsg({ tipo: 'sucesso', texto: sucesso });
    } catch (e) {
      setMsg({ tipo: 'erro', texto: mensagemErro(e) });
    } finally {
      setEnviando(false);
    }
  }
  return { enviando, msg, setMsg, executar };
}

/* ---------------------------- Filmes ---------------------------- */
const CLASSIFICACOES = ['L', '10', '12', '14', '16', '18'] as const;

function Filmes() {
  const lista = useCarregar(() => api.get<Filme[]>('/filmes?todos=true'));
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [duracao, setDuracao] = useState('');
  const [classificacao, setClassificacao] = useState<string | null>(null);
  const { enviando, msg, setMsg, executar } = useEnvio();

  const salvar = () => {
    const min = Number(duracao);
    if (!titulo.trim()) return setMsg({ tipo: 'erro', texto: 'Informe o título.' });
    if (!Number.isInteger(min) || min <= 0) return setMsg({ tipo: 'erro', texto: 'Informe a duração em minutos.' });
    if (!classificacao) return setMsg({ tipo: 'erro', texto: 'Escolha a classificação indicativa.' });
    void executar(async () => {
      await api.post('/filmes', { titulo, descricao: descricao || null, duracaoMinutos: min, classificacao });
      setTitulo('');
      setDescricao('');
      setDuracao('');
      setClassificacao(null);
      await lista.recarregar(true);
    }, 'Filme cadastrado.');
  };

  return (
    <>
      <Bloco>
        <Subtitulo>Novo filme ou evento</Subtitulo>
        <Campo rotulo="Título" value={titulo} onChangeText={setTitulo} />
        <Campo rotulo="Sinopse (opcional)" value={descricao} onChangeText={setDescricao} multiline />
        <Campo rotulo="Duração (minutos)" value={duracao} onChangeText={(t) => setDuracao(t.replace(/\D/g, ''))} keyboardType="number-pad" />
        <Opcoes rotulo="Classificação indicativa" valor={classificacao} onChange={setClassificacao} opcoes={CLASSIFICACOES.map((c) => ({ valor: c, rotulo: c === 'L' ? 'Livre' : `${c} anos` }))} />
        {msg ? <Aviso tipo={msg.tipo}>{msg.texto}</Aviso> : null}
        <Botao titulo="Cadastrar filme" onPress={salvar} carregando={enviando} />
      </Bloco>

      {lista.carregando && !lista.dados ? <Carregando /> : null}
      {lista.dados?.map((f) => (
        <Bloco key={f.id} estilo={!f.ativo && { opacity: 0.6 }}>
          <Linha>
            <Classificacao valor={f.classificacao} />
            <Texto estilo={{ flex: 1, fontWeight: '700' }}>{f.titulo}</Texto>
            <Texto suave>{f.duracaoMinutos} min</Texto>
          </Linha>
          <Linha>
            <Botao
              titulo={f.ativo ? 'Tirar de cartaz' : 'Voltar ao cartaz'}
              variante="secundario"
              estilo={{ flex: 1 }}
              onPress={() =>
                void executar(async () => {
                  await api.put(`/filmes/${f.id}`, { ativo: !f.ativo });
                  await lista.recarregar(true);
                }, f.ativo ? 'Filme retirado de cartaz.' : 'Filme de volta ao cartaz.')
              }
            />
            <Botao
              titulo="Excluir"
              variante="perigo"
              onPress={async () => {
                if (!(await confirmar('Excluir filme', `Excluir "${f.titulo}"?`))) return;
                void executar(async () => {
                  await api.del(`/filmes/${f.id}`);
                  await lista.recarregar(true);
                }, 'Filme excluído.');
              }}
            />
          </Linha>
        </Bloco>
      ))}
    </>
  );
}

/* ---------------------------- Salas ---------------------------- */
function Salas() {
  const lista = useCarregar(() => api.get<Sala[]>('/salas'));
  const [nome, setNome] = useState('');
  const [filas, setFilas] = useState('');
  const [porFila, setPorFila] = useState('');
  const { enviando, msg, setMsg, executar } = useEnvio();
  const capacidade = Number(filas || 0) * Number(porFila || 0);

  const salvar = () => {
    if (!nome.trim()) return setMsg({ tipo: 'erro', texto: 'Informe o nome da sala.' });
    if (!capacidade) return setMsg({ tipo: 'erro', texto: 'Informe a quantidade de filas e de assentos por fila.' });
    void executar(async () => {
      await api.post('/salas', { nome, filas: Number(filas), assentosPorFila: Number(porFila) });
      setNome('');
      setFilas('');
      setPorFila('');
      await lista.recarregar(true);
    }, 'Sala cadastrada com seus assentos.');
  };

  return (
    <>
      <Bloco>
        <Subtitulo>Nova sala</Subtitulo>
        <Campo rotulo="Nome" value={nome} onChangeText={setNome} placeholder="Ex.: Sala 4" />
        <Linha>
          <View style={{ flex: 1 }}>
            <Campo rotulo="Filas (A, B, C...)" value={filas} onChangeText={(t) => setFilas(t.replace(/\D/g, ''))} keyboardType="number-pad" />
          </View>
          <View style={{ flex: 1 }}>
            <Campo rotulo="Assentos por fila" value={porFila} onChangeText={(t) => setPorFila(t.replace(/\D/g, ''))} keyboardType="number-pad" />
          </View>
        </Linha>
        {capacidade > 0 ? <Texto suave>Capacidade: {capacidade} lugares</Texto> : null}
        {msg ? <Aviso tipo={msg.tipo}>{msg.texto}</Aviso> : null}
        <Botao titulo="Cadastrar sala" onPress={salvar} carregando={enviando} />
      </Bloco>

      {lista.dados?.map((sl) => (
        <Bloco key={sl.id}>
          <Linha>
            <Texto estilo={{ flex: 1, fontWeight: '700' }}>{sl.nome}</Texto>
            <Texto suave>{sl.capacidade} lugares</Texto>
            <Botao
              titulo="Excluir"
              variante="perigo"
              onPress={async () => {
                if (!(await confirmar('Excluir sala', `Excluir ${sl.nome}?`))) return;
                void executar(async () => {
                  await api.del(`/salas/${sl.id}`);
                  await lista.recarregar(true);
                }, 'Sala excluída.');
              }}
            />
          </Linha>
        </Bloco>
      ))}
    </>
  );
}

/* ---------------------------- Sessões ---------------------------- */
function Sessoes() {
  const filmes = useCarregar(() => api.get<Filme[]>('/filmes'));
  const salas = useCarregar(() => api.get<Sala[]>('/salas'));
  const lista = useCarregar(() => api.get<Sessao[]>('/sessoes'));
  const [filmeId, setFilmeId] = useState<number | null>(null);
  const [salaId, setSalaId] = useState<number | null>(null);
  const [data, setData] = useState('');
  const [horario, setHorario] = useState('');
  const [preco, setPreco] = useState('');
  const { enviando, msg, setMsg, executar } = useEnvio();

  const salvar = () => {
    const inicio = paraISO(data, horario);
    const valor = Number(preco.replace(',', '.'));
    if (!filmeId) return setMsg({ tipo: 'erro', texto: 'Escolha o filme.' });
    if (!salaId) return setMsg({ tipo: 'erro', texto: 'Escolha a sala.' });
    if (!inicio) return setMsg({ tipo: 'erro', texto: 'Informe data (DD/MM/AAAA) e horário (HH:MM) válidos.' });
    if (!(valor > 0)) return setMsg({ tipo: 'erro', texto: 'Informe o preço do ingresso.' });
    void executar(async () => {
      await api.post('/sessoes', { filmeId, salaId, inicio, preco: valor });
      setHorario('');
      await lista.recarregar(true);
    }, 'Sessão criada. O mapa de assentos já está disponível para venda.');
  };

  return (
    <>
      <Bloco>
        <Subtitulo>Nova sessão</Subtitulo>
        {filmes.dados ? (
          <Opcoes rotulo="Filme ou evento" valor={filmeId} onChange={setFilmeId} opcoes={filmes.dados.map((f) => ({ valor: f.id, rotulo: f.titulo }))} />
        ) : (
          <Carregando />
        )}
        {salas.dados ? (
          <Opcoes rotulo="Sala" valor={salaId} onChange={setSalaId} opcoes={salas.dados.map((sl) => ({ valor: sl.id, rotulo: `${sl.nome} (${sl.capacidade})` }))} />
        ) : null}
        <Linha>
          <View style={{ flex: 1 }}>
            <Campo rotulo="Data" placeholder="DD/MM/AAAA" value={data} onChangeText={(t) => setData(mascaraData(t))} keyboardType="number-pad" />
          </View>
          <View style={{ flex: 1 }}>
            <Campo rotulo="Horário" placeholder="HH:MM" value={horario} onChangeText={(t) => setHorario(mascaraHora(t))} keyboardType="number-pad" />
          </View>
        </Linha>
        <Campo rotulo="Preço do ingresso (R$)" placeholder="25,00" value={preco} onChangeText={(t) => setPreco(t.replace(/[^\d,.]/g, ''))} keyboardType="decimal-pad" />
        <Texto suave estilo={{ fontSize: 13 }}>O término é calculado pela duração do filme. Horários que se sobrepõem na mesma sala são recusados.</Texto>
        {msg ? <Aviso tipo={msg.tipo}>{msg.texto}</Aviso> : null}
        <Botao titulo="Criar sessão" onPress={salvar} carregando={enviando} />
      </Bloco>

      <Subtitulo>Próximas sessões</Subtitulo>
      {lista.carregando && !lista.dados ? <Carregando /> : null}
      {lista.dados?.length === 0 ? <Vazio>Nenhuma sessão futura cadastrada.</Vazio> : null}
      {lista.dados?.map((se) => (
        <Bloco key={se.id}>
          <Linha>
            <View style={{ flex: 1 }}>
              <Text style={s.sessaoTitulo}>{se.filme.titulo}</Text>
              <Texto suave>{se.sala.nome}, {dataHora(se.inicio)}, {moeda(se.preco)}</Texto>
            </View>
            <Botao
              titulo="Excluir"
              variante="perigo"
              onPress={async () => {
                if (!(await confirmar('Excluir sessão', 'Só é possível excluir sessões sem reservas.'))) return;
                void executar(async () => {
                  await api.del(`/sessoes/${se.id}`);
                  await lista.recarregar(true);
                }, 'Sessão excluída.');
              }}
            />
          </Linha>
        </Bloco>
      ))}
    </>
  );
}

const s = StyleSheet.create({
  sessaoTitulo: { color: cores.texto, fontWeight: '700', fontSize: 15, marginBottom: espaco.xs },
});

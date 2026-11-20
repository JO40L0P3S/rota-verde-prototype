"use strict";

/* Rota Verde - prototipo orientado aos RF e RN consolidados.
   O estado fica somente em memoria e reinicia ao recarregar a pagina. */

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const brl = v => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const kg = v => `${Number(v || 0).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg`;
const hoje = () => new Date().toLocaleDateString("pt-BR");
const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

const MATERIAL = {
  papelao: { nome: "Papelão", cor: "--papel" },
  pet: { nome: "Plástico PET", cor: "--plastico" },
  aluminio: { nome: "Alumínio", cor: "--metal" },
  ferro: { nome: "Ferro", cor: "--metal" },
  vidro: { nome: "Vidro", cor: "--vidro" }
};

const CLIENTE = {
  id: "u1", nome: "Ana Souza", email: "ana.souza@email.com",
  telefone: "(31) 99999-0000", enderecoPrincipal: "Rua Harmonia, 88 - Belo Horizonte/MG"
};

const DB = {
  perfil: null, pagina: null, filtro: "todos", empresaPreselecionada: null,
  sequenciaSolicitacao: 1100, sequenciaRota: 200,
  pix: null,
  empresas: [
    { id:"e1", nome:"Cooperativa Recicla Oeste", distancia:1.4, status:"ativa", verificada:true,
      endereco:"Av. Verde, 320 - Belo Horizonte/MG", horario:"Seg a sáb, 8h às 17h", recebePresencialmente:true,
      saldoReservado:2480, quantidadeMinima:300, condicoes:"Materiais secos, separados por tipo e sem resíduos orgânicos.",
      precos:{ papelao:0.60, pet:2.20, aluminio:6.50, vidro:0.15 }, avaliacao:4.7 },
    { id:"e2", nome:"Cooperativa Nova Esperança", distancia:3.9, status:"ativa", verificada:true,
      endereco:"Rua Esperança, 41 - Belo Horizonte/MG", horario:"Seg a sex, 9h às 17h", recebePresencialmente:false,
      saldoReservado:1200, quantidadeMinima:250, condicoes:"Papelão desmontado; garrafas vazias e sem tampa.",
      precos:{ papelao:0.55, pet:2.00, ferro:0.90 }, avaliacao:4.5 },
    { id:"e3", nome:"Metais Brasil Reciclagem", distancia:6.2, status:"ativa", verificada:true,
      endereco:"Av. Industrial, 900 - Belo Horizonte/MG", horario:"Seg a sex, 8h às 16h", recebePresencialmente:true,
      saldoReservado:5000, quantidadeMinima:400, condicoes:"Metais separados por tipo e sem materiais contaminantes.",
      precos:{ aluminio:7.10, ferro:1.00 }, avaliacao:4.2 },
    { id:"e4", nome:"Associação Vila Rica", distancia:4.8, status:"pendente", verificada:false,
      endereco:"Rua Vila Rica, 10 - Belo Horizonte/MG", horario:"Seg a sex, 8h às 17h", recebePresencialmente:true,
      saldoReservado:0, quantidadeMinima:250, condicoes:"Recicláveis secos.",
      precos:{ papelao:0.58, pet:2.10, vidro:0.18 }, avaliacao:0,
      documentos:["Cartão CNPJ", "Alvará de funcionamento", "Licença ambiental"] }
  ],
  coletores: [
    { id:"col1", nome:"Jorge Ramos", empresa:"e1", vinculo:"Funcionário", ativo:true },
    { id:"col2", nome:"Marina Alves", empresa:"e1", vinculo:"Parceiro", ativo:true }
  ],
  veiculos: [
    { id:"v1", empresa:"e1", placa:"RTA-4B12", tipo:"VUC", capacidade:1500, ativo:true },
    { id:"v2", empresa:"e1", placa:"QPF-2C77", tipo:"Caminhão 3/4", capacidade:4000, ativo:true }
  ],
  solicitacoes: [
    { id:1042, cliente:"Ana Souza", empresa:"e1", endereco:"Rua Harmonia, 88 - Belo Horizonte/MG", enderecoAlternativo:false,
      data:"Hoje", janela:"8h às 12h", status:"em_rota", rota:199, recebido:false,
      itens:[{material:"pet", estimado:15, precoConfirmado:2.20},{material:"aluminio", estimado:4, precoConfirmado:6.50}], avaliacao:0, historico:["Solicitada", "Aprovada", "Incluída na rota R-199"] },
    { id:1043, cliente:"Padaria Pão Quente", empresa:"e1", endereco:"Av. Corifeu, 1200 - Belo Horizonte/MG", enderecoAlternativo:true,
      data:"Hoje", janela:"8h às 12h", status:"em_rota", rota:199, recebido:false,
      itens:[{material:"papelao", estimado:180, precoConfirmado:0.60}], avaliacao:0, historico:["Solicitada", "Aprovada", "Incluída na rota R-199"] },
    { id:1044, cliente:"Escola Monte Azul", empresa:"e1", endereco:"Rua Bento, 55 - Belo Horizonte/MG", enderecoAlternativo:true,
      data:"20/11/2026", janela:"13h às 17h", status:"aprovada", rota:null, recebido:false,
      itens:[{material:"papelao", estimado:150, precoConfirmado:0.60}], avaliacao:0, historico:["Solicitada", "Aprovada"] },
    { id:1045, cliente:"Carlos Mendes", empresa:"e1", endereco:"Rua Itapé, 19 - Belo Horizonte/MG", enderecoAlternativo:false,
      data:"20/11/2026", janela:"13h às 17h", status:"aprovada", rota:null, recebido:false,
      itens:[{material:"pet", estimado:40, precoConfirmado:2.20},{material:"vidro", estimado:30, precoConfirmado:0.15}], avaliacao:0, historico:["Solicitada", "Aprovada"] },
    { id:1046, cliente:"Bruno Lima", empresa:"e1", endereco:"Rua Itapé, 240 - Belo Horizonte/MG", enderecoAlternativo:false,
      data:"Hoje", janela:"13h às 17h", status:"solicitada", rota:null, recebido:false,
      itens:[{material:"papelao", estimado:70},{material:"aluminio", estimado:15}], avaliacao:0, historico:["Solicitada"] },
    { id:981, cliente:"Ana Souza", empresa:"e1", endereco:"Rua Harmonia, 88 - Belo Horizonte/MG", enderecoAlternativo:false,
      data:"07/11/2026", janela:"8h às 12h", status:"concluida", rota:180, recebido:true,
      itens:[{material:"papelao", estimado:35, real:38, aceito:38, precoConfirmado:0.60},{material:"pet", estimado:8, real:7, aceito:7, precoConfirmado:2.20}],
      valorFinal:38.20, avaliacao:0, historico:["Solicitada", "Aprovada", "Em rota", "Recebida", "Pesagem confirmada", "Concluída"] }
  ],
  rotas: [
    { id:199, empresa:"e1", data:"Hoje", janela:"8h às 12h", veiculo:"v1", coletor:"col1", status:"programada", liberacaoExcepcional:false, solicitacoes:[1042,1043] },
    { id:180, empresa:"e1", data:"07/11/2026", janela:"8h às 12h", veiculo:"v1", coletor:"col1", status:"concluída", concluidaEm:"07/11/2026", liberacaoExcepcional:false, solicitacoes:[981] }
  ],
  movimentacoesCliente: [
    { data:"07/11/2026", descricao:"Crédito da coleta #981", valor:38.20, status:"disponível" }
  ],
  saques: [],
  contestacoes: [],
  usuarios: [
    { id:"u1", nome:"Ana Souza", email:"ana.souza@email.com", perfil:"Cliente", ativo:true },
    { id:"u2", nome:"Bruno Lima", email:"bruno.lima@email.com", perfil:"Cliente", ativo:true },
    { id:"u3", nome:"Jorge Ramos", email:"jorge@reciclaoeste.coop", perfil:"Coletor", ativo:true },
    { id:"u4", nome:"Representante Recicla Oeste", email:"contato@reciclaoeste.coop", perfil:"Representante", ativo:true }
  ],
  auditoria: []
};

const STATUS = {
  solicitada: "Solicitada", aprovada: "Aprovada · aguardando rota", em_rota: "Em rota",
  aguardando_confirmacao: "Aguardando confirmação", em_contestacao: "Em contestação",
  pagamento_pendente: "Pagamento pendente", concluida: "Concluída", recusada: "Recusada",
  cancelada: "Cancelada", interrompida: "Interrompida"
};
const TERMINAIS = ["concluida", "recusada", "cancelada", "interrompida"];
const CANCELAVEIS = ["solicitada", "aprovada"];

function empresa(id){ return DB.empresas.find(x => x.id === id); }
function solicitacao(id){ return DB.solicitacoes.find(x => x.id === Number(id)); }
function rota(id){ return DB.rotas.find(x => x.id === Number(id)); }
function somaEstimada(s){ return s.itens.reduce((a, i) => a + Number(i.estimado || 0), 0); }
function somaAceita(s){ return s.itens.reduce((a, i) => a + Number(i.aceito || 0), 0); }
function valorSolicitacao(s){ return s.itens.reduce((a, i) => a + Number(i.aceito || 0) * Number(i.precoConfirmado || 0), 0); }
function saldoCliente(){ return DB.movimentacoesCliente.filter(x => x.status === "disponível").reduce((a,x) => a + x.valor, 0); }
function registrarAuditoria(acao){ DB.auditoria.unshift({ data:new Date().toLocaleString("pt-BR"), perfil:DB.perfil, acao }); }
function registrarHistorico(s, texto){ s.historico ||= []; s.historico.push(`${hoje()} · ${texto}`); }

function toast(texto){
  const el = $("#toast"); el.textContent = texto; el.classList.add("show");
  clearTimeout(el._timer); el._timer = setTimeout(() => el.classList.remove("show"), 2600);
}
function modal(html){
  $("#modal").innerHTML = `<div class="mbg" data-act="fechar-fundo"><div class="modal" role="dialog" aria-modal="true">${html}</div></div>`;
  $("#modal input, #modal button, #modal select")?.focus();
}
function fecharModal(){ $("#modal").innerHTML = ""; }
function cabecalho(titulo, subtitulo="", acao=""){
  return `<div class="ph"><div><h2>${esc(titulo)}</h2>${subtitulo ? `<p>${esc(subtitulo)}</p>` : ""}</div>${acao}</div>`;
}
function tagMaterial(id, extra=""){
  return `<span class="mat"><i style="background:var(${MATERIAL[id].cor})"></i>${MATERIAL[id].nome}${extra}</span>`;
}
function pill(status){
  const cls = status === "concluida" ? "good" : ["recusada","interrompida"].includes(status) ? "bad" : status === "cancelada" ? "mute" : "warn";
  return `<span class="pill ${cls}">${STATUS[status] || esc(status)}</span>`;
}

const ICONES = {
  list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  plus:'<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M12 8v8M8 12h8"/>',
  wallet:'<path d="M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M3 7V6a2 2 0 0 1 2-2h11v3"/>',
  inbox:'<path d="M3 13h5l1.5 3h5L16 13h5"/><path d="M5 5h14l2 8v6H3v-6z"/>',
  route:'<circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5"/>',
  truck:'<path d="M3 16h11V7H3z"/><path d="M14 10h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
  tag:'<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.3"/>',
  users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/>',
  check:'<path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
  cart:'<path d="M3 4h2l2.5 11h11L21 7H6.2"/><circle cx="9" cy="19.5" r="1.4"/><circle cx="17" cy="19.5" r="1.4"/>',
  bell:'<path d="M18 8a6 6 0 0 0-12 0c0 6.5-3 7-3 9h18c0-2-3-2.5-3-9"/><path d="M10 21h4"/><path d="M5 17h14"/>'
};
const icone = k => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONES[k]}</svg>`;

const PERFIS = {
  cliente:{ nome:"Cliente", quem:`${CLIENTE.nome}`, descricao:"Solicita coletas, confirma pesagens e usa a carteira", paginas:[
    ["minhas","list","Minhas coletas"],["buscar","search","Empresas próximas"],["solicitar","plus","Solicitar coleta"],["carteira","wallet","Carteira"] ] },
  representante:{ nome:"Representante", quem:"Cooperativa Recicla Oeste", descricao:"Analisa solicitações, organiza rotas e resolve contestações", paginas:[
    ["solicitacoes","inbox","Solicitações"],["rotas","route","Rotas"],["operacao","truck","Equipe e frota"],["materiais","tag","Materiais e preços"],["financeiro","cart","Financeiro"],["contestacoes","check","Contestações"] ] },
  coletor:{ nome:"Coletor", quem:"Jorge Ramos", descricao:"Executa a rota, confirma recebimento e registra pesagem", paginas:[ ["rota","route","Minha rota"] ] },
  admin:{ nome:"Administrador", quem:"Equipe da plataforma", descricao:"Valida empresas, usuários, catálogo e auditoria", paginas:[
    ["validar","check","Validar empresas"],["usuarios","users","Usuários"],["catalogo","tag","Catálogo"],["auditoria","list","Auditoria"] ] }
};

function badge(p){
  if(p === "solicitacoes") return DB.solicitacoes.filter(s => s.empresa === "e1" && s.status === "solicitada").length;
  if(p === "contestacoes") return DB.contestacoes.filter(c => c.status === "aberta").length;
  if(p === "validar") return DB.empresas.filter(e => e.status === "pendente").length;
  if(p === "notificacoes") return (DB.notificacoes||[]).filter(n=>n.perfil===DB.perfil&&!n.lida).length;
  return 0;
}
function renderNavegacao(){
  const p = PERFIS[DB.perfil];
  const botao = ([id,ico,texto]) => `<button class="nav-b" type="button" data-act="ir" data-page="${id}" ${DB.pagina===id?'aria-current="page"':''}>${icone(ico)}<span>${texto}</span>${badge(id)?`<span class="count">${badge(id)}</span>`:""}</button>`;
  $("#side").innerHTML = `<div class="grp">${p.nome}</div>${p.paginas.map(botao).join("")}`;
  $("#tabbar").innerHTML = p.paginas.map(botao).join("");
  $("#who").innerHTML = `<b>${p.quem}</b>${p.nome}`;
}
function ir(pagina){ DB.pagina = pagina; renderNavegacao(); $("#main").innerHTML = `<div class="page">${TELAS[pagina]()}</div>`; iniciarTela(pagina); }
function rerender(){ ir(DB.pagina); }

const TELAS = {
  minhas(){
    const lista = DB.solicitacoes.filter(s => s.cliente === CLIENTE.nome).sort((a,b) => b.id-a.id);
    return cabecalho("Minhas coletas", CLIENTE.enderecoPrincipal, `<button class="btn" data-act="ir" data-page="solicitar">Solicitar coleta</button>`) +
      `<div class="panel">${lista.map(s => {
        const e=empresa(s.empresa), podeCancelar=CANCELAVEIS.includes(s.status)&&!s.recebido;
        const confirmar=s.status==="aguardando_confirmacao";
        return `<div class="row"><div class="grow"><div class="t">Solicitação #${s.id} · ${e.nome}</div>
          <div class="s">${s.data} · ${s.janela} · ${esc(s.endereco)}</div>
          <div class="mats" style="margin-top:6px">${s.itens.map(i=>tagMaterial(i.material,` <span class="num muted">${kg(i.aceito ?? i.estimado)}</span>`)).join("")}</div>
          <div class="s" style="margin-top:6px">${esc((s.historico||[]).at(-1)||"")}</div></div>
          <div style="display:grid;gap:8px;justify-items:end">${pill(s.status)}
          ${confirmar?`<button class="btn sm" data-act="ver-pesagem" data-id="${s.id}">Revisar pesagem</button>`:""}
          ${podeCancelar?`<button class="btn sec sm" data-act="cancelar" data-id="${s.id}">Cancelar</button>`:""}
          ${s.status==="concluida"?`<b class="num">${brl(s.valorFinal)}</b><button class="btn sec sm" data-act="avaliar" data-id="${s.id}">${s.avaliacao?`Avaliação: ${s.avaliacao}/5`:"Avaliar"}</button>`:""}
          </div></div>`;
      }).join("")}</div>`;
  },

  buscar(){
    const lista=DB.empresas.filter(e=>e.status==="ativa").filter(e=>DB.filtro==="todos"||e.precos[DB.filtro]!=null).sort((a,b)=>a.distancia-b.distancia);
    return cabecalho("Empresas próximas", "Ordenadas pela localização atual do dispositivo")+
      `<div class="chips">${["todos",...Object.keys(MATERIAL)].map(m=>`<button class="chip" data-act="filtrar" data-m="${m}" aria-pressed="${DB.filtro===m}">${m==="todos"?"Todos":MATERIAL[m].nome}</button>`).join("")}</div>
      <div class="panel">${lista.map(e=>`<div class="row"><div class="grow"><div class="t">${e.nome}${e.verificada?' · verificada':''}</div>
        <div class="s">${e.distancia.toLocaleString("pt-BR")} km · ${e.horario}${e.recebePresencialmente?' · recebe presencialmente':''}</div>
        <div class="mats" style="margin-top:8px">${Object.entries(e.precos).map(([m,p])=>tagMaterial(m,` <span class="num muted">${brl(p)}/kg</span>`)).join("")}</div></div>
        <button class="btn" data-act="solicitar-em" data-id="${e.id}">Solicitar coleta</button></div>`).join("")||'<div class="empty">Nenhuma empresa encontrada.</div>'}</div>`;
  },

  solicitar(){
    const ativas=DB.empresas.filter(e=>e.status==="ativa"), selecionada=DB.empresaPreselecionada||ativas[0].id;
    return cabecalho("Solicitar coleta", "Selecione materiais, endereço e disponibilidade")+
      `<div class="panel"><div class="bd" style="display:grid;gap:16px">
        <div class="f"><label for="sol-empresa">Empresa</label><select id="sol-empresa">${ativas.map(e=>`<option value="${e.id}" ${e.id===selecionada?'selected':''}>${e.nome} · ${e.distancia.toLocaleString("pt-BR")} km</option>`).join("")}</select></div>
        <div><div class="f"><label>Materiais e peso estimado</label></div><div id="sol-materiais"></div></div>
        <div class="grid2"><div class="f"><label for="sol-data">Atendimento</label><select id="sol-data"><option value="Hoje">Mesmo dia</option><option value="20/11/2026">20/11/2026</option><option value="21/11/2026">21/11/2026</option></select></div>
        <div class="f"><label for="sol-janela">Janela de disponibilidade</label><select id="sol-janela"><option>8h às 12h</option><option>13h às 17h</option></select></div></div>
        <label class="s"><input type="checkbox" id="sol-alt"> Coletar em outro endereço</label>
        <div class="f" id="sol-alt-box" hidden><label for="sol-endereco">Endereço alternativo</label><input id="sol-endereco" placeholder="Rua, número, bairro e cidade"></div>
        <div class="est"><span>Peso e valor estimados<br><span class="s" id="sol-peso"></span></span><b class="num" id="sol-valor"></b></div>
        <div class="acts"><button class="btn" data-act="revisar-solicitacao">Revisar e confirmar</button></div>
      </div></div>`;
  },

  carteira(){
    const saldo=saldoCliente();
    return cabecalho("Carteira", "Créditos concluídos e solicitações de saque")+
      `<div class="wallet"><div><div class="lb">Saldo disponível</div><div class="v">${brl(saldo)}</div><div class="lb">${DB.pix?`${DB.pix.tipo}: ${esc(DB.pix.chave)}`:"Nenhuma chave Pix cadastrada"}</div></div>
      <div class="acts"><button class="btn sec" data-act="chave-pix">${DB.pix?"Alterar chave":"Cadastrar Pix"}</button><button class="btn" data-act="sacar" ${!DB.pix||saldo<=0?'disabled':''}>Solicitar saque</button></div></div>
      <div class="panel"><h3>Movimentações</h3>${[...DB.movimentacoesCliente,...DB.saques.map(s=>({data:s.data,descricao:`Saque Pix · ${s.status}`,valor:-s.valor,status:s.status}))].map(m=>`<div class="row"><div class="grow"><div class="t">${esc(m.descricao)}</div><div class="s">${m.data} · ${m.status}</div></div><b class="num">${m.valor>=0?'+':'−'} ${brl(Math.abs(m.valor))}</b></div>`).join("")}</div>`;
  },

  solicitacoes(){
    const lista=DB.solicitacoes.filter(s=>s.empresa==="e1"&&s.status==="solicitada");
    return cabecalho("Solicitações", "Aceite fixa os preços vigentes; recusa exige motivo")+
      `<div class="panel">${lista.map(s=>`<div class="row"><div class="grow"><div class="t">${s.cliente}</div><div class="s">${esc(s.endereco)} · ${s.data} · ${s.janela}</div>
        <div class="mats" style="margin-top:6px">${s.itens.map(i=>tagMaterial(i.material,` <span class="num muted">${kg(i.estimado)}</span>`)).join("")}</div></div>
        <div class="acts"><button class="btn bad sm" data-act="recusar" data-id="${s.id}">Recusar</button><button class="btn sm" data-act="aprovar" data-id="${s.id}">Aceitar</button></div></div>`).join("")||'<div class="empty">Nenhuma solicitação aguardando análise.</div>'}</div>`;
  },

  rotas(){
    const aprovadas=DB.solicitacoes.filter(s=>s.empresa==="e1"&&s.status==="aprovada"&&!s.rota);
    const grupos=Object.groupBy?Object.groupBy(aprovadas,s=>`${s.data}|${s.janela}`):aprovadas.reduce((g,s)=>((g[`${s.data}|${s.janela}`]??=[]).push(s),g),{});
    const e=empresa("e1");
    return cabecalho("Rotas", "Agrupamento por data e janela compatíveis")+
      `<div class="cols">${Object.entries(grupos).map(([chave,lista])=>{const total=lista.reduce((a,s)=>a+somaEstimada(s),0),[data,janela]=chave.split("|");return `<div class="panel"><h3>${data} · ${janela}</h3><div class="bd"><p class="s">${lista.length} solicitações · ${kg(total)} · mínimo ${kg(e.quantidadeMinima)}</p>${lista.map(s=>`<label class="s" style="display:block"><input class="rota-sel" type="checkbox" value="${s.id}" checked> ${s.cliente} · ${kg(somaEstimada(s))}</label>`).join("")}
        <div class="grid2" style="margin-top:12px"><select class="rota-veiculo">${DB.veiculos.filter(v=>v.empresa==="e1"&&v.ativo).map(v=>`<option value="${v.id}">${v.placa} · ${kg(v.capacidade)}</option>`).join("")}</select><select class="rota-coletor">${DB.coletores.filter(c=>c.empresa==="e1"&&c.ativo).map(c=>`<option value="${c.id}">${c.nome} · ${c.vinculo}</option>`).join("")}</select></div>
        <div class="acts" style="margin-top:12px"><button class="btn" data-act="criar-rota" data-data="${data}" data-janela="${janela}">${total<e.quantidadeMinima?'Liberar abaixo do mínimo':'Criar rota'}</button></div></div></div>`}).join("")||'<div class="panel"><div class="empty">Nenhuma solicitação aprovada aguardando rota.</div></div>'}</div>
      <div class="panel"><h3>Rotas criadas</h3>${DB.rotas.slice().reverse().map(r=>`<div class="row"><div class="grow"><div class="t">R-${r.id} · ${r.data} · ${r.janela}</div><div class="s">${DB.veiculos.find(v=>v.id===r.veiculo)?.placa} · ${DB.coletores.find(c=>c.id===r.coletor)?.nome} · ${r.solicitacoes.length} paradas${r.liberacaoExcepcional?' · liberação excepcional':''}</div></div><span class="pill">${r.status}</span></div>`).join("")}</div>`;
  },

  operacao(){
    return cabecalho("Equipe e frota", "Coletores associados e veículos disponíveis")+
      `<div class="cols"><div class="panel"><h3>Coletores</h3>${DB.coletores.filter(c=>c.empresa==="e1").map(c=>`<div class="row"><div><div class="t">${c.nome}</div><div class="s">${c.vinculo}</div></div><button class="btn sec sm" data-act="alternar-coletor" data-id="${c.id}">${c.ativo?'Desativar':'Ativar'}</button></div>`).join("")}</div>
      <div class="panel"><h3>Veículos</h3>${DB.veiculos.filter(v=>v.empresa==="e1").map(v=>`<div class="row"><div><div class="t">${v.placa} · ${v.tipo}</div><div class="s">Capacidade ${kg(v.capacidade)}</div></div><button class="btn sec sm" data-act="alternar-veiculo" data-id="${v.id}">${v.ativo?'Desativar':'Ativar'}</button></div>`).join("")}</div></div>`;
  },

  materiais(){
    const e=empresa("e1");
    return cabecalho("Materiais e preços", "Novos preços não alteram solicitações já aprovadas")+
      `<div class="panel"><div class="bd">${Object.keys(MATERIAL).map(m=>`<div class="mrow"><div>${tagMaterial(m)}</div><label class="s"><input type="checkbox" id="mat-${m}" ${e.precos[m]!=null?'checked':''}> Aceito</label><input id="preco-${m}" type="number" min="0" step="0.01" value="${e.precos[m]??''}" placeholder="R$/kg"></div>`).join("")}
      <div class="f"><label for="condicoes">Condições de aceite</label><input id="condicoes" value="${esc(e.condicoes)}"></div><div class="acts"><button class="btn" data-act="salvar-precos">Salvar tabela</button></div></div></div>`;
  },

  financeiro(){
    const e=empresa("e1"), concluidas=DB.solicitacoes.filter(s=>s.empresa==="e1"&&s.status==="concluida");
    return cabecalho("Financeiro", "Saldo contábil reservado para repasses", `<button class="btn" data-act="reservar-saldo">Reservar saldo</button>`)+
      `<div class="kpis"><div class="kpi"><b>${brl(e.saldoReservado)}</b><span>saldo reservado</span></div><div class="kpi"><b>${concluidas.length}</b><span>transações concluídas</span></div><div class="kpi"><b>${brl(concluidas.reduce((a,s)=>a+Number(s.valorFinal||0),0))}</b><span>repasses registrados</span></div></div>`;
  },

  contestacoes(){
    const lista=DB.contestacoes.filter(c=>c.empresa==="e1");
    return cabecalho("Contestações", "A resolução preserva o registro original")+
      `<div class="panel">${lista.map(c=>{const s=solicitacao(c.solicitacao);return `<div class="row"><div class="grow"><div class="t">Solicitação #${s.id} · ${s.cliente}</div><div class="s">${esc(c.motivo)} · ${c.status}</div></div>${c.status==="aberta"?`<button class="btn" data-act="resolver-contestacao" data-id="${c.id}">Resolver</button>`:pill("concluida")}</div>`}).join("")||'<div class="empty">Nenhuma contestação registrada.</div>'}</div>`;
  },

  rota(){
    const coletor=DB.coletores.find(c=>c.id==="col1"), r=DB.rotas.find(x=>x.coletor===coletor.id&&["programada","em andamento"].includes(x.status));
    if(!r) return cabecalho("Minha rota", "Nenhuma rota disponível")+'<div class="panel"><div class="empty">Não há rota programada.</div></div>';
    const paradas=r.solicitacoes.map(solicitacao).sort((a,b)=>a.janela.localeCompare(b.janela)||a.endereco.localeCompare(b.endereco));
    return cabecalho(`Rota R-${r.id}`, `${r.data} · ${r.janela} · ${DB.veiculos.find(v=>v.id===r.veiculo)?.placa}`, r.status==="programada"?`<button class="btn" data-act="iniciar-rota" data-id="${r.id}">Iniciar rota</button>`:`<button class="btn" data-act="concluir-rota" data-id="${r.id}">Concluir rota</button>`)+
      `<div class="panel">${paradas.map((s,i)=>`<div class="row"><span class="pill">${i+1}</span><div class="grow"><div class="t">${s.cliente}</div><div class="s">${esc(s.endereco)}</div><div class="mats">${s.itens.map(x=>tagMaterial(x.material,` <span class="muted">${kg(x.estimado)}</span>`)).join("")}</div></div>
      ${s.status==="em_rota"?`<div class="acts"><button class="btn sec sm" data-act="marcar-pendente" data-id="${s.id}">Não efetuado</button><button class="btn" data-act="receber" data-id="${s.id}">${s.recebido?'Registrar pesagem':'Confirmar recebimento'}</button></div>`:pill(s.status)}</div>`).join("")}</div>`;
  },

  validar(){
    const lista=DB.empresas.filter(e=>e.status==="pendente");
    return cabecalho("Validar empresas", "Somente empresas aprovadas aparecem aos clientes")+
      `<div class="panel">${lista.map(e=>`<div class="row"><div class="grow"><div class="t">${e.nome}</div><div class="s">${e.endereco}</div><div class="mats">${(e.documentos||[]).map(d=>`<span class="pill mute">${d}</span>`).join("")}</div></div><div class="acts"><button class="btn bad sm" data-act="rejeitar-empresa" data-id="${e.id}">Rejeitar</button><button class="btn sm" data-act="aprovar-empresa" data-id="${e.id}">Aprovar</button></div></div>`).join("")||'<div class="empty">Nenhuma empresa pendente.</div>'}</div>`;
  },
  usuarios(){
    return cabecalho("Usuários", "Bloqueio preserva o histórico")+`<div class="panel">${DB.usuarios.map(u=>`<div class="row"><div class="grow"><div class="t">${u.nome}</div><div class="s">${u.email} · ${u.perfil}</div></div><button class="btn sec sm" data-act="alternar-usuario" data-id="${u.id}">${u.ativo?'Bloquear':'Reativar'}</button></div>`).join("")}</div>`;
  },
  catalogo(){
    return cabecalho("Catálogo de materiais", "Categorias gerais disponíveis às empresas")+`<div class="panel">${Object.entries(MATERIAL).map(([id,m])=>`<div class="row"><div class="t">${m.nome}</div><span class="pill good">Ativo</span></div>`).join("")}</div>`;
  },
  auditoria(){
    return cabecalho("Auditoria", "Ações administrativas e operacionais relevantes")+`<div class="panel">${DB.auditoria.map(a=>`<div class="row"><div><div class="t">${esc(a.acao)}</div><div class="s">${a.data} · ${a.perfil}</div></div></div>`).join("")||'<div class="empty">Nenhuma ação registrada nesta sessão.</div>'}</div>`;
  }
};

function iniciarTela(pagina){
  if(pagina!=="solicitar") return;
  const desenhar=()=>{
    const e=empresa($("#sol-empresa").value);
    $("#sol-materiais").innerHTML=Object.entries(e.precos).map(([m,p])=>`<div class="mrow"><div>${tagMaterial(m)}</div><span class="s num">${brl(p)}/kg</span><input id="peso-${m}" type="number" min="0" step="0.1" value="0" aria-label="Peso estimado de ${MATERIAL[m].nome}"></div>`).join("");
    const j=$("#sol-janela");if(j)j.innerHTML=janelasDisponiveis(e).map(x=>`<option>${x}</option>`).join("");atualizarEstimativa();
  };
  const atualizarEstimativa=()=>{
    const e=empresa($("#sol-empresa").value); let peso=0,valor=0;
    Object.entries(e.precos).forEach(([m,p])=>{const q=Math.max(0,Number($(`#peso-${m}`)?.value||0));peso+=q;valor+=q*p;});
    $("#sol-peso").textContent=kg(peso); $("#sol-valor").textContent=brl(valor);
  };
  $("#sol-empresa").addEventListener("change",desenhar);
  $("#sol-materiais").addEventListener("input",atualizarEstimativa);
  $("#sol-alt").addEventListener("change",e=>$("#sol-alt-box").hidden=!e.target.checked);
  desenhar();
}

function abrirPesagem(s){
  modal(`<h3>Registrar pesagem · ${esc(s.cliente)}</h3><p class="s">Registre o peso real e a quantidade aceita de cada material.</p>
    ${s.itens.map((i,n)=>`<div class="mrow"><div>${tagMaterial(i.material)}<div class="s">Preço confirmado: ${brl(i.precoConfirmado)}/kg</div></div><input id="real-${n}" type="number" min="0" step="0.1" value="${i.estimado}" aria-label="Peso real"><input id="aceito-${n}" type="number" min="0" step="0.1" value="${i.estimado}" aria-label="Peso aceito"></div>`).join("")}
    <div class="f"><label for="motivo-recusa">Observação ou motivo de recusa parcial</label><input id="motivo-recusa"></div>
    <div class="acts"><button class="btn sec" data-act="fechar">Voltar</button><button class="btn" data-act="salvar-pesagem" data-id="${s.id}">Enviar ao cliente</button></div>`);
}

function abrirResultado(s){
  modal(`<h3>Confirmar pesagem · solicitação #${s.id}</h3>${s.itens.map(i=>`<div class="row"><div>${MATERIAL[i.material].nome}<div class="s">${kg(i.aceito)} × ${brl(i.precoConfirmado)}/kg</div></div><b>${brl(i.aceito*i.precoConfirmado)}</b></div>`).join("")}<div class="est"><span>Total</span><b>${brl(valorSolicitacao(s))}</b></div>
  <div class="acts"><button class="btn bad" data-act="contestar" data-id="${s.id}">Contestar</button><button class="btn" data-act="confirmar-pesagem" data-id="${s.id}">Confirmar e liberar</button></div>`);
}


  /* ===== Expansao do prototipo: RF-06, 07, 09-14, 17, 19, 22, 25, 28-29,
     33, 35-38, 45, 47, 50, 54-60 ===== */
  DB.notificacoes = [];
  DB.transacoes = [
    {id:"tx981",cliente:"Ana Souza",empresa:"e1",solicitacao:981,materiais:["papelao","pet"],pesos:[38,7],precos:[0.60,2.20],valor:38.20,data:"07/11/2026",status:"concluida"}
  ];
  DB.convitesColetores = [
    {id:"cv1",empresa:"e1",email:"lucas@coleta.com",status:"pendente",enviadoEm:"18/11/2026"}
  ];
  DB.avaliacoes = [
    {empresa:"e1",cliente:"Mariana Costa",nota:5,comentario:"Coleta pontual.",data:"10/11/2026"},
    {empresa:"e1",cliente:"Padaria Pao Quente",nota:4,comentario:"Bom atendimento.",data:"08/11/2026"},
    {empresa:"e2",cliente:"Rafael Nunes",nota:5,comentario:"Equipe atenciosa.",data:"05/11/2026"}
  ];
  DB.empresas.forEach(e=>{
    e.contatos ||= {telefone:"(31) 3333-1200",email:`contato@${e.id}.eco.br`};
    e.documentos ||= [];
    e.documentosDetalhes ||= e.documentos.map((nome,n)=>({id:`doc-${e.id}-${n}`,nome,status:e.status==="pendente"?"em análise":"aprovado"}));
    e.condicoesPorMaterial ||= Object.fromEntries(Object.keys(e.precos).map(m=>[m,{limpeza:"Limpo e sem resíduos orgânicos",separacao:"Separado por tipo",acondicionamento:"Sacos ou caixas resistentes",qualidade:"Seco e não contaminado"}]));
    e.avaliacoesQuantidade = DB.avaliacoes.filter(a=>a.empresa===e.id).length;
  });
  DB.empresas.push({id:"e5",nome:"Eco Minas Triagem",distancia:8.1,status:"suspensa",verificada:true,endereco:"Rua das Acacias, 515 - Contagem/MG",horario:"Seg a sex, 7h às 16h",recebePresencialmente:false,saldoReservado:900,quantidadeMinima:350,condicoes:"Materiais limpos e compactados.",precos:{papelao:.62,pet:2.15},avaliacao:4.3,avaliacoesQuantidade:12,contatos:{telefone:"(31) 3322-4444",email:"operacao@ecominas.eco.br"},documentosDetalhes:[{id:"doc-e5-1",nome:"Licença ambiental",status:"aprovado"}],condicoesPorMaterial:{papelao:{limpeza:"Sem gordura",separacao:"Sem fitas",acondicionamento:"Dobrado",qualidade:"Seco"},pet:{limpeza:"Lavado",separacao:"Sem tampas",acondicionamento:"Ensacado",qualidade:"Sem óleo"}}});
  DB.coletores.push({id:"col3",nome:"Lucas Ferreira",empresa:"e1",vinculo:"Convidado",ativo:false});
  DB.veiculos.push({id:"v3",empresa:"e1",placa:"HJK-8D90",identificacao:"Frota 03",tipo:"Furgão",capacidade:800,ativo:false,disponivel:false});
  DB.usuarios.push(
    {id:"u5",nome:"Carla Martins",email:"carla@rotaverde.app",perfil:"Administrador",ativo:true,administrador:true},
    {id:"u6",nome:"Paulo Reis",email:"paulo@rotaverde.app",perfil:"Suporte",ativo:true,administrador:false}
  );
  DB.solicitacoes.push(
    {id:1047,cliente:"Mercado Central Sul",empresa:"e1",endereco:"Rua Sul, 350 - Belo Horizonte/MG",data:"20/11/2026",janela:"8h às 12h",status:"aprovada",rota:null,recebido:false,itens:[{material:"papelao",estimado:760,precoConfirmado:.60},{material:"pet",estimado:120,precoConfirmado:2.20}],avaliacao:0,historico:["Solicitada","Aprovada"]},
    {id:1048,cliente:"Condominio Horizonte",empresa:"e1",endereco:"Av. Horizonte, 88 - Belo Horizonte/MG",data:"Hoje",janela:"13h às 17h",status:"pendente_rota",rota:199,recebido:false,motivoPendente:"Portaria sem autorização",itens:[{material:"vidro",estimado:65,precoConfirmado:.15}],avaliacao:0,historico:["Solicitada","Aprovada","Incluída na rota R-199","Parada pendente: portaria sem autorização"]}
  );
  DB.rotas[0].solicitacoes.push(1048);
  STATUS.pendente_rota="Aguardando liberação";
  STATUS.agendada="Agendada";

  function mediaEmpresa(id){ const a=DB.avaliacoes.filter(x=>x.empresa===id); return a.length?a.reduce((s,x)=>s+x.nota,0)/a.length:0; }
  function notificar(perfil,texto,tipo="info"){
    DB.notificacoes.unshift({id:`nt${Date.now()}${Math.random()}`,perfil,texto,tipo,data:new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}),lida:false});
    if(DB.perfil===perfil){ toast(texto); renderNavegacao(); }
  }
  function notificacoesPerfil(){ return DB.notificacoes.filter(n=>n.perfil===DB.perfil); }
  function painelNotificacoes(){ const ns=notificacoesPerfil().slice(0,6); return `<div class="panel"><h3>Notificações em tempo real</h3>${ns.map(n=>`<div class="row"><div><div class="t">${esc(n.texto)}</div><div class="s">${n.data}</div></div><span class="pill ${n.lida?'mute':'warn'}">${n.lida?'Lida':'Nova'}</span></div>`).join("")||'<div class="empty">Aguardando eventos simulados...</div>'}</div>`; }
  let simuladorNotificacoes=null;
  const eventosSimulados={
    cliente:["A coleta #1042 teve a rota iniciada.","A pesagem da solicitação #981 está disponível.","Seu saque Pix continua em processamento."],
    representante:["Nova solicitação recebida para análise.","A rota R-199 possui uma parada pendente.","O peso estimado de um agrupamento excede o veículo selecionado."],
    coletor:["A ordem sugerida da rota R-199 foi atualizada.","Nova observação adicionada à parada 3.","A empresa liberou uma parada pendente."],
    admin:["Empresa enviou novos documentos para validação.","Há uma solicitação de correção cadastral.","Uma empresa suspensa aguarda reanálise."]
  };
  function iniciarSimulador(){ clearInterval(simuladorNotificacoes); let i=0; simuladorNotificacoes=setInterval(()=>{ if(!DB.perfil)return; const xs=eventosSimulados[DB.perfil]; notificar(DB.perfil,xs[i++%xs.length]); },12000); setTimeout(()=>DB.perfil&&notificar(DB.perfil,eventosSimulados[DB.perfil][0]),2500); }

  PERFIS.cliente.paginas.push(["historico-cliente","list","Meu histórico"],["notificacoes","bell","Notificações"]);
  PERFIS.representante.paginas.splice(2,0,["paradas","truck","Paradas Pendentes"]);
  PERFIS.representante.paginas.push(["empresa-config","check","Perfil da empresa"],["relatorios","list","Operações"],["notificacoes","bell","Notificações"]);
  PERFIS.coletor.paginas.push(["historico-rotas","list","Histórico de rotas"],["notificacoes","bell","Notificações"]);
  PERFIS.admin.paginas.push(["empresas-admin","check","Empresas"],["notificacoes","bell","Notificações"]);

  const telasOriginais={...TELAS};
  TELAS.buscar=function(){
    const lista=DB.empresas.filter(e=>e.status==="ativa").filter(e=>DB.filtro==="todos"||e.precos[DB.filtro]!=null).sort((a,b)=>a.distancia-b.distancia);
    return cabecalho("Empresas próximas","Consulte o perfil público antes de solicitar")+`<div class="chips">${["todos",...Object.keys(MATERIAL)].map(m=>`<button class="chip" data-act="filtrar" data-m="${m}" aria-pressed="${DB.filtro===m}">${m==="todos"?"Todos":MATERIAL[m].nome}</button>`).join("")}</div><div class="panel">${lista.map(e=>`<div class="row"><div class="grow"><div class="t">${e.nome}${e.verificada?' · verificada':''}</div><div class="s">${e.distancia.toLocaleString("pt-BR")} km · ${e.horario} · ${e.recebePresencialmente?'recebe presencialmente':'somente coleta'}</div><div class="s">★ ${mediaEmpresa(e.id).toFixed(1)} · ${DB.avaliacoes.filter(a=>a.empresa===e.id).length} avaliações</div></div><div class="acts"><button class="btn sec sm" data-act="ver-empresa" data-id="${e.id}">Ver perfil</button><button class="btn sm" data-act="solicitar-em" data-id="${e.id}">Solicitar</button></div></div>`).join("")}</div>`;
  };
  TELAS.operacao=function(){
    return cabecalho("Equipe e frota","Convites, vínculos, veículos e disponibilidade",`<div class="acts"><button class="btn sec" data-act="convidar-coletor">Convidar coletor</button><button class="btn" data-act="cadastrar-veiculo">Cadastrar veículo</button></div>`)+`<div class="cols"><div class="panel"><h3>Coletores</h3>${DB.coletores.filter(c=>c.empresa==="e1").map(c=>`<div class="row"><div><div class="t">${c.nome}</div><div class="s">${c.vinculo} · ${c.ativo?'vinculado':'desvinculado'}</div></div><button class="btn sec sm" data-act="alternar-coletor" data-id="${c.id}">${c.ativo?'Desvincular':'Vincular'}</button></div>`).join("")}<h3>Convites</h3>${DB.convitesColetores.map(c=>`<div class="row"><div><div class="t">${c.email}</div><div class="s">${c.status} · ${c.enviadoEm}</div></div></div>`).join("")}</div><div class="panel"><h3>Veículos</h3>${DB.veiculos.filter(v=>v.empresa==="e1").map(v=>`<div class="row"><div><div class="t">${v.identificacao||v.tipo} · ${v.placa}</div><div class="s">${v.tipo} · capacidade ${kg(v.capacidade)} · ${v.disponivel!==false?'disponível':'indisponível'}</div></div><button class="btn sec sm" data-act="alternar-veiculo" data-id="${v.id}">${v.ativo?'Indisponibilizar':'Disponibilizar'}</button></div>`).join("")}</div></div>`+painelNotificacoes();
  };
  TELAS["empresa-config"]=function(){ const e=empresa("e1"); return cabecalho("Perfil e operação da empresa","Dados públicos, documentos e parâmetros de rota")+`<div class="panel"><div class="bd" style="display:grid;gap:14px"><div class="grid2"><div class="f"><label>Nome público</label><input id="emp-nome" value="${esc(e.nome)}"></div><div class="f"><label>Telefone</label><input id="emp-tel" value="${esc(e.contatos.telefone)}"></div></div><div class="f"><label>Endereço</label><input id="emp-end" value="${esc(e.endereco)}"></div><div class="grid2"><div class="f"><label>Horário</label><input id="emp-hor" value="${esc(e.horario)}"></div><div class="f"><label>Mínimo para rota (kg)</label><input id="emp-min" type="number" min="1" value="${e.quantidadeMinima}"></div></div><label class="s"><input id="emp-pres" type="checkbox" ${e.recebePresencialmente?'checked':''}> Recebe materiais presencialmente</label><div class="acts"><button class="btn" data-act="salvar-empresa">Salvar dados</button><button class="btn sec" data-act="enviar-documento">Enviar documento</button></div></div></div><div class="panel"><h3>Documentos comprobatórios</h3>${e.documentosDetalhes.map(d=>`<div class="row"><div class="t">${d.nome}</div><span class="pill ${d.status==='aprovado'?'good':'warn'}">${d.status}</span></div>`).join("")}</div>`; };
  TELAS.materiais=function(){ const e=empresa("e1"); return cabecalho("Materiais, preços e condições","Cadastre exigências específicas por material")+`<div class="panel"><div class="bd">${Object.keys(MATERIAL).map(m=>{const c=e.condicoesPorMaterial[m]||{};return `<div class="mrow"><div>${tagMaterial(m)}</div><label class="s"><input type="checkbox" id="mat-${m}" ${e.precos[m]!=null?'checked':''}> Aceito</label><input id="preco-${m}" type="number" min="0" step="0.01" value="${e.precos[m]??''}" placeholder="R$/kg"></div><div class="grid2"><input id="limpeza-${m}" value="${esc(c.limpeza||'')}" placeholder="Limpeza"><input id="separacao-${m}" value="${esc(c.separacao||'')}" placeholder="Separação"><input id="acond-${m}" value="${esc(c.acondicionamento||'')}" placeholder="Acondicionamento"><input id="qualidade-${m}" value="${esc(c.qualidade||'')}" placeholder="Qualidade"></div>`}).join("")}<div class="acts"><button class="btn" data-act="salvar-precos">Salvar materiais</button></div></div></div>`; };
  TELAS.usuarios=function(){ return cabecalho("Usuários e administradores","Somente administrador autorizado altera privilégios")+`<div class="panel">${DB.usuarios.map(u=>`<div class="row"><div class="grow"><div class="t">${u.nome}</div><div class="s">${u.email} · ${u.perfil}</div></div><div class="acts">${u.id!=="u5"?`<button class="btn sec sm" data-act="alternar-admin" data-id="${u.id}">${u.administrador?'Remover admin':'Tornar admin'}</button>`:''}<button class="btn sec sm" data-act="alternar-usuario" data-id="${u.id}">${u.ativo?'Bloquear':'Reativar'}</button></div></div>`).join("")}</div>`; };
  TELAS.validar=function(){ const lista=DB.empresas.filter(e=>["pendente","correcao"].includes(e.status)); return cabecalho("Validar empresas","Aprovar, rejeitar ou solicitar correção de dados e documentos")+`<div class="panel">${lista.map(e=>`<div class="row"><div class="grow"><div class="t">${e.nome}</div><div class="s">${e.endereco}</div>${(e.documentosDetalhes||[]).map(d=>`<span class="pill mute">${d.nome}: ${d.status}</span>`).join(" ")}</div><div class="acts"><button class="btn sec sm" data-act="corrigir-empresa" data-id="${e.id}">Solicitar correção</button><button class="btn bad sm" data-act="rejeitar-empresa" data-id="${e.id}">Rejeitar</button><button class="btn sm" data-act="aprovar-empresa" data-id="${e.id}">Aprovar</button></div></div>`).join("")||'<div class="empty">Nenhuma empresa aguardando validação.</div>'}</div>`+painelNotificacoes(); };
  TELAS["empresas-admin"]=function(){ return cabecalho("Gestão de empresas","Consultar, aprovar, rejeitar, suspender e reativar")+`<div class="panel">${DB.empresas.map(e=>`<div class="row"><div class="grow"><div class="t">${e.nome}</div><div class="s">${e.status} · ${e.endereco}</div></div><div class="acts">${e.status==='ativa'?`<button class="btn bad sm" data-act="suspender-empresa" data-id="${e.id}">Suspender</button>`:`<button class="btn sm" data-act="reativar-empresa" data-id="${e.id}">Reativar</button>`}</div></div>`).join("")}</div>`; };
  TELAS.catalogo=function(){ return cabecalho("Catálogo geral","Manutenção das categorias de recicláveis",`<button class="btn" data-act="nova-categoria">Nova categoria</button>`)+`<div class="panel">${Object.entries(MATERIAL).map(([id,m])=>`<div class="row"><div class="t">${m.nome}</div><div class="acts"><span class="pill good">Ativo</span><button class="btn sec sm" data-act="editar-categoria" data-id="${id}">Editar</button></div></div>`).join("")}</div>`; };
  TELAS["historico-cliente"]=function(){
    const ss=DB.solicitacoes.filter(s=>s.cliente===CLIENTE.nome&&TERMINAIS.includes(s.status));
    return cabecalho("Meu histórico","Solicitações concluídas, recusadas, canceladas ou interrompidas")+`<div class="kpis"><div class="kpi"><b>${ss.length}</b><span>solicitações encerradas</span></div><div class="kpi"><b>${DB.transacoes.filter(t=>t.cliente===CLIENTE.nome).length}</b><span>transações</span></div><div class="kpi"><b>${DB.contestacoes.length}</b><span>contestações</span></div></div><div class="panel"><h3>Histórico de estados</h3>${ss.map(s=>`<div class="row"><div class="grow"><div class="t">Solicitação #${s.id} · ${empresa(s.empresa).nome}</div><div class="s">${(s.historico||[]).join(" → ")}</div></div><div class="acts">${pill(s.status)}<button class="btn sec sm" data-act="ver-solicitacao" data-id="${s.id}">Abrir</button>${s.status==="concluida"?`<button class="btn sm" data-act="avaliar" data-id="${s.id}" ${s.avaliacao?"disabled":""}>${s.avaliacao?`Avaliada: ${s.avaliacao}/5`:"Avaliar coleta"}</button>`:""}</div></div>`).join("")||'<div class="empty">Nenhum item no histórico.</div>'}</div>`;
  };
  TELAS["relatorios"]=function(){ const ss=DB.solicitacoes.filter(s=>s.empresa==="e1"); return cabecalho("Operações da empresa","Participantes, materiais, pesos, preços, valores, datas e estados")+`<div class="panel">${ss.map(s=>`<div class="row"><div class="grow"><div class="t">#${s.id} · ${s.cliente}</div><div class="s">${s.data} · ${s.janela} · ${s.endereco}</div><div class="mats">${s.itens.map(i=>tagMaterial(i.material,` <span class="num muted">${kg(i.aceito??i.estimado)} · ${brl(i.precoConfirmado||empresa(s.empresa).precos[i.material]||0)}/kg</span>`)).join("")}</div><div class="s">${(s.historico||[]).join(" → ")}</div></div>${s.status==='pendente_rota'?`<button class="btn" data-act="liberar-parada" data-id="${s.id}">Liberar parada</button>`:pill(s.status)}</div>`).join("")}</div>`+painelNotificacoes(); };
  TELAS.financeiro=function(){ const e=empresa("e1"); return cabecalho("Financeiro e transações","Registro detalhado das operações e repasses",`<button class="btn" data-act="reservar-saldo">Reservar saldo</button>`)+`<div class="kpis"><div class="kpi"><b>${brl(e.saldoReservado)}</b><span>saldo reservado</span></div><div class="kpi"><b>${DB.transacoes.length}</b><span>transações</span></div></div><div class="panel">${DB.transacoes.map(t=>`<div class="row"><div class="grow"><div class="t">${t.id} · ${t.cliente} → ${empresa(t.empresa).nome}</div><div class="s">Solicitação #${t.solicitacao} · ${t.data} · ${t.status}</div><div class="s">${t.materiais.map((m,i)=>`${MATERIAL[m].nome}: ${kg(t.pesos[i])} × ${brl(t.precos[i])}`).join(" · ")}</div></div><b>${brl(t.valor)}</b></div>`).join("")}</div>`; };



  function horarioAbertura(e){
    const m=String(e.horario||"").match(/(\d{1,2})h\s*(?:às|a|-)\s*(\d{1,2})h/i);
    return m?[Number(m[1]),Number(m[2])]:[8,17];
  }
  function janelasDisponiveis(e){
    const [ini,fim]=horarioAbertura(e),xs=[];
    for(let h=ini;h+2<=fim;h+=2)xs.push(`${h}h às ${h+2}h`);
    return xs;
  }
  function detalhesSolicitacao(s){
    return `<h3>Solicitação #${s.id}</h3><p class="s">${empresa(s.empresa).nome}<br>${esc(s.endereco)}<br>${s.data} · ${s.janela}</p><div class="panel">${s.itens.map(i=>`<div class="row"><div>${tagMaterial(i.material)}</div><b>${kg(i.aceito??i.real??i.estimado)}</b></div>`).join("")}</div><p class="s">${(s.historico||[]).map(esc).join(" → ")}</p><div class="acts"><button class="btn" data-act="fechar">Fechar</button></div>`;
  }
  TELAS.minhas=function(){
    const lista=DB.solicitacoes.filter(s=>s.cliente===CLIENTE.nome&&!TERMINAIS.includes(s.status)).sort((a,b)=>b.id-a.id);
    return cabecalho("Minhas coletas",CLIENTE.enderecoPrincipal,`<button class="btn" data-act="ir" data-page="solicitar">Solicitar coleta</button>`)+`<div class="panel">${lista.map(s=>{const pode=CANCELAVEIS.includes(s.status)&&!s.recebido&&!s.rota;return `<div class="row"><div class="grow"><div class="t">Solicitação #${s.id} · ${empresa(s.empresa).nome}</div><div class="s">${s.data} · ${s.janela}<br>${esc(s.endereco)}</div><div class="mats">${s.itens.map(i=>tagMaterial(i.material,` <span class="num muted">${kg(i.aceito??i.estimado)}</span>`)).join("")}</div></div><div class="acts">${pill(s.status)}<button class="btn sec sm" data-act="ver-solicitacao" data-id="${s.id}">Abrir</button>${s.status==="aguardando_confirmacao"?`<button class="btn sm" data-act="ver-pesagem" data-id="${s.id}">Revisar pesagem</button>`:""}${pode?`<button class="btn bad sm" data-act="cancelar" data-id="${s.id}">Cancelar</button>`:""}</div></div>`}).join("")||'<div class="empty">Nenhuma coleta em andamento.</div>'}</div>`;
  };
  TELAS.solicitar=function(){
    const ativas=DB.empresas.filter(e=>e.status==="ativa"),selecionada=DB.empresaPreselecionada||ativas[0].id;
    return cabecalho("Solicitar coleta","Selecione materiais, endereço e uma janela de 2 horas")+`<div class="panel"><div class="bd" style="display:grid;gap:16px"><div class="f"><label for="sol-empresa">Empresa</label><select id="sol-empresa">${ativas.map(e=>`<option value="${e.id}" ${e.id===selecionada?'selected':''}>${e.nome} · ${e.distancia.toLocaleString("pt-BR")} km</option>`).join("")}</select></div><div><div class="f"><label>Materiais e peso estimado</label></div><div id="sol-materiais"></div></div><div class="grid2"><div class="f"><label for="sol-data">Atendimento</label><select id="sol-data"><option value="Hoje">Mesmo dia</option><option value="20/11/2026">20/11/2026</option><option value="21/11/2026">21/11/2026</option></select></div><div class="f"><label for="sol-janela">Janela de disponibilidade</label><select id="sol-janela"></select></div></div><label class="s"><input type="checkbox" id="sol-alt"> Coletar em outro endereço</label><div class="f" id="sol-alt-box" hidden><label for="sol-endereco">Endereço alternativo</label><input id="sol-endereco" placeholder="Rua, número, bairro e cidade"></div><div class="est"><span>Peso e valor estimados<br><span class="s" id="sol-peso"></span></span><b class="num" id="sol-valor"></b></div><div class="acts"><button class="btn" data-act="revisar-solicitacao">Revisar e confirmar</button></div></div></div>`;
  };
  TELAS.rotas=function(){
    const aprovadas=DB.solicitacoes.filter(s=>s.empresa==="e1"&&s.status==="aprovada"&&!s.rota),grupos=aprovadas.reduce((g,s)=>((g[`${s.data}|${s.janela}`]??=[]).push(s),g),{}),e=empresa("e1");
    const blocos=Object.entries(grupos).map(([chave,lista])=>{const [data,janela]=chave.split("|"),total=lista.reduce((a,s)=>a+somaEstimada(s),0);return `<div class="panel"><h3>${data} · ${janela}</h3><div class="bd"><p class="s">Selecione as solicitações que entrarão na rota · ${kg(total)} de ${kg(e.quantidadeMinima)} mínimos</p>${lista.map(s=>`<label class="row" style="cursor:pointer"><input class="rota-sel" type="checkbox" value="${s.id}" checked><span class="grow"><b>${s.cliente}</b><span class="s" style="display:block">${esc(s.endereco)} · ${kg(somaEstimada(s))}</span></span></label>`).join("")}<div class="grid2"><select class="rota-veiculo">${DB.veiculos.filter(v=>v.empresa==="e1"&&v.ativo).map(v=>`<option value="${v.id}">${v.placa} · ${kg(v.capacidade)}</option>`).join("")}</select><select class="rota-coletor">${DB.coletores.filter(c=>c.empresa==="e1"&&c.ativo).map(c=>`<option value="${c.id}">${c.nome}</option>`).join("")}</select></div><div class="acts"><button class="btn" data-act="criar-rota" data-data="${data}" data-janela="${janela}">Criar rota</button></div></div></div>`}).join("")||'<div class="panel"><div class="empty">Nenhuma solicitação aprovada aguardando rota.</div></div>';
    const cards=rs=>rs.map(r=>`<div class="row"><div class="grow"><div class="t">R-${r.id} · ${r.data} · ${r.janela}</div><div class="s">${r.solicitacoes.length} paradas · ${DB.coletores.find(c=>c.id===r.coletor)?.nome}</div>${r.solicitacoes.map(id=>{const x=solicitacao(id);return x?`<div class="s">#${x.id} · ${x.cliente} · ${esc(x.endereco)}</div>`:""}).join("")}</div><span class="pill">${r.status}</span></div>`).join("")||'<div class="empty">Nenhuma rota.</div>';
    const hojeR=DB.rotas.filter(r=>r.data==="Hoje"&&r.status!=="concluída"),ag=DB.rotas.filter(r=>r.data!=="Hoje"&&r.status!=="concluída");
    return cabecalho("Rotas","Solicitações selecionáveis, endereços e rotas separadas por data")+`<div class="cols">${blocos}</div><div class="panel"><h3>Rotas de hoje</h3>${cards(hojeR)}</div><div class="panel"><h3>Rotas agendadas</h3>${cards(ag)}</div>`;
  };
  TELAS.paradas=function(){
    const xs=DB.solicitacoes.filter(s=>s.empresa==="e1"&&s.status==="pendente_rota");
    return cabecalho("Paradas Pendentes","Ocorrências separadas das rotas ativas")+`<div class="panel">${xs.map(s=>`<div class="row"><div class="grow"><div class="t">#${s.id} · ${s.cliente}</div><div class="s">${esc(s.endereco)} · ${esc(s.motivoPendente||"")}</div></div><button class="btn" data-act="liberar-parada" data-id="${s.id}">Liberar parada</button></div>`).join("")||'<div class="empty">Nenhuma parada pendente.</div>'}</div>`;
  };
  TELAS["historico-rotas"]=function(){
    const concluidas=DB.rotas.filter(r=>r.coletor==="col1"&&["concluída","concluida"].includes(r.status)).sort((a,b)=>b.id-a.id);
    return cabecalho("Histórico de rotas","Rotas concluídas pelo coletor autenticado")+`<div class="panel">${concluidas.map(r=>{const paradas=r.solicitacoes.map(solicitacao).filter(Boolean),peso=paradas.reduce((t,s)=>t+s.itens.reduce((a,i)=>a+Number(i.aceito??i.real??i.estimado??0),0),0);return `<div class="row"><div class="grow"><div class="t">R-${r.id} · ${r.data} · ${r.janela}</div><div class="s">${paradas.length} paradas · ${kg(peso)} coletados · ${DB.veiculos.find(v=>v.id===r.veiculo)?.placa||"Veículo não informado"}</div></div><button class="btn sec sm" data-act="abrir-rota-historico" data-id="${r.id}">Abrir</button></div>`}).join("")||'<div class="empty">Nenhuma rota concluída.</div>'}</div>`;
  };
  function modalRotaHistorico(r){const paradas=r.solicitacoes.map(solicitacao).filter(Boolean);modal(`<h3>Rota concluída R-${r.id}</h3><p class="s">${r.data} · ${r.janela} · ${DB.veiculos.find(v=>v.id===r.veiculo)?.placa||"Veículo não informado"}</p>${paradas.map((s,i)=>`<div class="row"><span class="pill good">${i+1}</span><div class="grow"><div class="t">${s.cliente}</div><div class="s">${esc(s.endereco)}</div><div class="mats">${s.itens.map(x=>tagMaterial(x.material,` <span class="muted">${kg(x.aceito??x.real??x.estimado)}</span>`)).join("")}</div></div>${pill(s.status)}</div>`).join("")}<div class="acts"><button class="btn" data-act="fechar">Fechar</button></div>`);}
  function condicoesMaterial(e,m){
    const c=e.condicoesPorMaterial?.[m];
    if(!c) return e.condicoes||"Material conforme as condições gerais da empresa.";
    return [c.limpeza,c.separacao,c.acondicionamento,c.qualidade].filter(Boolean).join("; ");
  }
  TELAS.notificacoes=function(){
    const ns=notificacoesPerfil(), naoLidas=ns.filter(n=>!n.lida).length;
    return cabecalho("Notificações",`${naoLidas} não lida(s)`, naoLidas?`<button class="btn sec" data-act="marcar-todas-lidas">Marcar todas como lidas</button>`:"")+
      `<div class="panel">${ns.map(n=>`<div class="row"><div class="grow"><div class="t">${esc(n.texto)}</div><div class="s">${n.data}</div></div>${n.lida?'<span class="pill mute">Lida</span>':`<button class="btn sec sm" data-act="marcar-lida" data-id="${n.id}">Marcar como lida</button>`}</div>`).join("")||'<div class="empty">Nenhuma notificação.</div>'}</div>`;
  };
  TELAS.rota=function(){
    const rotas=DB.rotas.filter(r=>r.coletor==="col1"&&["programada","em andamento"].includes(r.status));
    const naoIniciadas=rotas.filter(r=>r.status==="programada"), iniciadas=rotas.filter(r=>r.status==="em andamento");
    const listar=(lista,vazio)=>lista.map(r=>`<div class="row"><div class="grow"><div class="t">R-${r.id} · ${r.data} · ${r.janela}</div><div class="s">${r.solicitacoes.length} paradas · ${r.status}</div></div><button class="btn" data-act="abrir-rota-coletor" data-id="${r.id}">Abrir rota</button></div>`).join("")||`<div class="empty">${vazio}</div>`;
    return cabecalho("Minha rota","Rotas atribuídas separadas por situação")+`<div class="panel"><h3>Rotas não iniciadas</h3>${listar(naoIniciadas,"Nenhuma rota aguardando início.")}</div><div class="panel"><h3>Rotas em andamento</h3>${listar(iniciadas,"Nenhuma rota iniciada.")}</div>`;
  };
  function modalRotaColetor(r){
    const iniciada=r.status==="em andamento", paradas=r.solicitacoes.map(solicitacao);
    modal(`<h3>Rota R-${r.id}</h3><p class="s">${r.data} · ${r.janela} · ${iniciada?'Em andamento':'Aguardando início'}</p>
      ${paradas.map((s,i)=>`<div class="row"><span class="pill">${i+1}</span><div class="grow"><div class="t">${s.cliente}</div><div class="s">${esc(s.endereco)}</div><div class="mats">${s.itens.map(x=>tagMaterial(x.material,` <span class="muted">${kg(x.estimado)}</span>`)).join("")}</div></div>${iniciada&&s.status==="em_rota"?`<div class="acts"><button class="btn sec sm" data-act="marcar-pendente" data-id="${s.id}">Não efetuado</button><button class="btn sm" data-act="receber" data-id="${s.id}">${s.recebido?'Registrar pesagem':'Confirmar recebimento'}</button></div>`:pill(s.status)}</div>`).join("")}
      <div class="acts"><button class="btn sec" data-act="fechar">Fechar</button>${iniciada?`<button class="btn" data-act="concluir-rota" data-id="${r.id}">Concluir rota</button>`:`<button class="btn" data-act="iniciar-rota" data-id="${r.id}">Iniciar rota</button>`}</div>`);
  }

$("#roles").innerHTML=Object.entries(PERFIS).map(([id,p])=>`<button class="role" type="button" data-act="entrar" data-role="${id}"><strong>${p.nome}</strong><span>${p.descricao}</span></button>`).join("");

document.addEventListener("click", e=>{
  const b=e.target.closest("[data-act]"); if(!b) return;
  const act=b.dataset.act, id=b.dataset.id;
  if(act==="fechar-fundo"&&e.target===b){fecharModal();return;}
  switch(act){
    case "entrar": DB.perfil=b.dataset.role; iniciarSimulador(); $("#login").hidden=true; $("#app").hidden=false; ir(PERFIS[DB.perfil].paginas[0][0]); break;
    case "ir": ir(b.dataset.page); break;
    case "fechar": fecharModal(); break;
    case "filtrar": DB.filtro=b.dataset.m; rerender(); break;
    case "marcar-lida": {const n=DB.notificacoes.find(x=>x.id===id&&x.perfil===DB.perfil);if(n)n.lida=true;renderNavegacao();rerender();break;}
    case "marcar-todas-lidas": DB.notificacoes.filter(n=>n.perfil===DB.perfil).forEach(n=>n.lida=true);renderNavegacao();rerender();break;
    case "abrir-rota-coletor": modalRotaColetor(rota(id)); break;
    case "abrir-rota-historico": modalRotaHistorico(rota(id)); break;
    case "ver-solicitacao": modal(detalhesSolicitacao(solicitacao(id))); break;
    case "revisar-solicitacao": {
      const epr=empresa($("#sol-empresa").value), itens=Object.keys(epr.precos).map(m=>({material:m,estimado:Math.max(0,Number($(`#peso-${m}`).value||0))})).filter(i=>i.estimado>0);
      if(!itens.length)return toast("Selecione ao menos um material e informe o peso.");
      const alternativo=$("#sol-alt").checked,endereco=alternativo?$("#sol-endereco").value.trim():CLIENTE.enderecoPrincipal;if(!endereco)return toast("Informe o endereço alternativo.");
      DB.rascunhoSolicitacao={empresa:epr.id,itens,endereco,enderecoAlternativo:alternativo,data:$("#sol-data").value,janela:$("#sol-janela").value};
      modal(`<h3>Revisar materiais e condições</h3><p class="s">Confira as exigências da empresa para cada material.</p>${itens.map(i=>`<div class="row"><div class="grow"><div class="t">${MATERIAL[i.material].nome} · ${kg(i.estimado)}</div><div class="s">${esc(condicoesMaterial(epr,i.material))}</div></div></div>`).join("")}<div class="est"><span>Coleta</span><b>${$("#sol-data").value} · ${$("#sol-janela").value}</b></div><p class="s">Ao confirmar, a solicitação será enviada para análise do representante.</p><div class="acts"><button class="btn sec" data-act="fechar">Voltar</button><button class="btn" data-act="enviar-solicitacao">Confirmar solicitação</button></div>`);break;
    }
    case "solicitar-em": DB.empresaPreselecionada=id; ir("solicitar"); break;
    case "enviar-solicitacao": {
      const d=DB.rascunhoSolicitacao;
      if(!d||!d.itens?.length)return toast("Revise os materiais antes de confirmar a solicitação.");
      const nova={id:++DB.sequenciaSolicitacao,cliente:CLIENTE.nome,empresa:d.empresa,endereco:d.endereco,enderecoAlternativo:d.enderecoAlternativo,data:d.data,janela:d.janela,status:"solicitada",rota:null,recebido:false,itens:d.itens.map(i=>({...i})),avaliacao:0,historico:[`${hoje()} · Solicitação enviada`]};
      fecharModal();DB.solicitacoes.push(nova);DB.rascunhoSolicitacao=null;DB.empresaPreselecionada=null;notificar("representante",`Nova solicitação #${nova.id} aguardando análise.`);registrarAuditoria(`Solicitação #${nova.id} criada`);toast("Solicitação enviada.");ir("minhas");break;
    }
    case "aprovar": {
      const s=solicitacao(id), emp=empresa(s.empresa); s.itens.forEach(i=>i.precoConfirmado=emp.precos[i.material]); s.status="aprovada"; registrarHistorico(s,"Aprovada; preços vigentes fixados"); registrarAuditoria(`Solicitação #${s.id} aprovada`); toast("Solicitação aprovada e aguardando rota."); rerender(); break;
    }
    case "recusar": modal(`<h3>Recusar solicitação #${id}</h3><div class="f"><label for="motivo">Motivo obrigatório</label><input id="motivo"></div><div class="acts"><button class="btn sec" data-act="fechar">Voltar</button><button class="btn bad" data-act="confirmar-recusa" data-id="${id}">Recusar</button></div>`); break;
    case "confirmar-recusa": {const motivo=$("#motivo").value.trim();if(!motivo)return toast("Informe o motivo.");const s=solicitacao(id);s.status="recusada";s.motivoRecusa=motivo;registrarHistorico(s,`Recusada: ${motivo}`);registrarAuditoria(`Solicitação #${s.id} recusada`);fecharModal();toast("Solicitação recusada.");rerender();break;}
    case "cancelar": {const s=solicitacao(id);if(s.recebido||!CANCELAVEIS.includes(s.status))return toast("Cancelamento não permitido neste estado.");modal(`<h3>Cancelar solicitação #${s.id}?</h3><p class="s">Falta pouco para sua coleta! Deseja cancelar?</p><div class="acts"><button class="btn sec" data-act="fechar">Voltar</button><button class="btn bad" data-act="confirmar-cancelamento" data-id="${s.id}">Cancelar</button></div>`);break;}
    case "confirmar-cancelamento": {const s=solicitacao(id);s.status="cancelada";if(s.rota){const r=rota(s.rota);r.solicitacoes=r.solicitacoes.filter(x=>x!==s.id);}s.rota=null;registrarHistorico(s,"Cancelada pelo cliente");registrarAuditoria(`Solicitação #${s.id} cancelada`);fecharModal();toast("Solicitação cancelada.");rerender();break;}
    case "criar-rota": {
      const card=b.closest(".panel"), ids=$$(".rota-sel:checked",card).map(x=>Number(x.value)); if(!ids.length)return toast("Selecione ao menos uma solicitação.");
      const lista=ids.map(solicitacao), total=lista.reduce((a,s)=>a+somaEstimada(s),0), emp=empresa("e1"), veiculo=DB.veiculos.find(v=>v.id===$(".rota-veiculo",card).value);
      if(total>veiculo.capacidade)return toast("O peso estimado excede a capacidade do veículo.");
      const excepcional=total<emp.quantidadeMinima, r={id:++DB.sequenciaRota,empresa:"e1",data:b.dataset.data,janela:b.dataset.janela,veiculo:veiculo.id,coletor:$(".rota-coletor",card).value,status:"programada",liberacaoExcepcional:excepcional,solicitacoes:ids};
      DB.rotas.push(r);lista.forEach(s=>{s.rota=r.id;s.status="aprovada";registrarHistorico(s,`Incluída na rota R-${r.id}; aguardando início`);});registrarAuditoria(`Rota R-${r.id} criada${excepcional?' abaixo do mínimo':''}`);toast(`Rota R-${r.id} criada.`);rerender();break;
    }
    case "iniciar-rota": {const r=rota(id);r.status="em andamento";r.solicitacoes.map(solicitacao).filter(s=>s.status==="aprovada").forEach(s=>s.status="em_rota");registrarAuditoria(`Rota R-${r.id} iniciada`);toast("Rota iniciada.");fecharModal();rerender();break;}

      case "marcar-pendente": modal(`<h3>Marcar recebimento como pendente</h3><div class="f"><label>Motivo</label><input id="motivo-pendente"></div><div class="acts"><button class="btn sec" data-act="fechar">Voltar</button><button class="btn" data-act="confirmar-pendente" data-id="${id}">Registrar</button></div>`);break;
      case "confirmar-pendente": {const motivo=$("#motivo-pendente").value.trim();if(!motivo)return toast("Informe o motivo.");const s=solicitacao(id);s.status="pendente_rota";s.motivoPendente=motivo;registrarHistorico(s,`Parada pendente: ${motivo}`);notificar("representante",`Parada da solicitação #${s.id} ficou pendente.`);fecharModal();rerender();break;}
      case "concluir-rota": {const r=rota(id),abertas=r.solicitacoes.map(solicitacao).filter(s=>s.status==="em_rota");if(abertas.length)return toast("Finalize ou marque como pendentes todas as paradas.");r.status="concluída";registrarAuditoria(`Rota R-${r.id} concluída`);toast("Rota concluída.");rerender();break;}

      case "receber": {const s=solicitacao(id),r=rota(s.rota);if(!r||r.status!=="em andamento")return toast("Inicie a rota antes de confirmar recebimento ou registrar pesagem.");if(!s.recebido){s.recebido=true;registrarHistorico(s,"Recebimento confirmado pelo coletor");toast("Recebimento confirmado. O cliente não pode mais cancelar.");modalRotaColetor(r);}else abrirPesagem(s);break;}
    case "salvar-pesagem": {const s=solicitacao(id),r=rota(s.rota);if(!r||r.status!=="em andamento")return toast("Inicie a rota antes de registrar a pesagem.");s.itens=s.itens.map((i,n)=>{const real=Math.max(0,Number($(`#real-${n}`).value||0)),aceito=Math.max(0,Math.min(real,Number($(`#aceito-${n}`).value||0)));return {...i,real,aceito};});s.observacaoPesagem=$("#motivo-recusa").value.trim();s.status="aguardando_confirmacao";registrarHistorico(s,"Pesagem registrada; aguardando confirmação do cliente");registrarAuditoria(`Pesagem da solicitação #${s.id} registrada`);fecharModal();toast("Pesagem enviada ao cliente.");rerender();break;}
    case "ver-pesagem": abrirResultado(solicitacao(id)); break;
    case "confirmar-pesagem": {
      const s=solicitacao(id),emp=empresa(s.empresa),valor=valorSolicitacao(s);if(emp.saldoReservado<valor)return toast("A empresa não possui saldo reservado suficiente.");
      emp.saldoReservado-=valor;s.valorFinal=valor;s.status="concluida";registrarHistorico(s,"Pesagem confirmada e crédito liberado");DB.movimentacoesCliente.unshift({data:hoje(),descricao:`Crédito da solicitação #${s.id}`,valor,status:"disponível"});registrarAuditoria(`Transação da solicitação #${s.id} concluída`);fecharModal();toast("Valor creditado na carteira.");ir("minhas");break;
    }
    case "contestar": modal(`<h3>Contestar solicitação #${id}</h3><div class="f"><label for="motivo-contestacao">Motivo</label><input id="motivo-contestacao"></div><div class="acts"><button class="btn sec" data-act="fechar">Voltar</button><button class="btn bad" data-act="enviar-contestacao" data-id="${id}">Enviar</button></div>`); break;
    case "enviar-contestacao": {const motivo=$("#motivo-contestacao").value.trim();if(!motivo)return toast("Informe o motivo.");const s=solicitacao(id);const c={id:`ct${Date.now()}`,solicitacao:s.id,empresa:s.empresa,motivo,status:"aberta",registroOriginal:JSON.stringify(s.itens)};DB.contestacoes.push(c);s.status="em_contestacao";registrarHistorico(s,"Contestação aberta");registrarAuditoria(`Contestação aberta na solicitação #${s.id}`);fecharModal();toast("Contestação enviada.");ir("minhas");break;}
    case "resolver-contestacao": {const c=DB.contestacoes.find(x=>x.id===id),s=solicitacao(c.solicitacao);modal(`<h3>Resolver contestação #${s.id}</h3><p class="s">${esc(c.motivo)}</p><div class="f"><label for="decisao">Justificativa da decisão</label><input id="decisao"></div><div class="acts"><button class="btn sec" data-act="fechar">Voltar</button><button class="btn" data-act="confirmar-resolucao" data-id="${c.id}">Resolver e liberar</button></div>`);break;}
    case "confirmar-resolucao": {const decisao=$("#decisao").value.trim();if(!decisao)return toast("Registre a justificativa.");const c=DB.contestacoes.find(x=>x.id===id),s=solicitacao(c.solicitacao);c.status="resolvida";c.decisao=decisao;s.status="aguardando_confirmacao";registrarHistorico(s,`Contestação resolvida: ${decisao}`);registrarAuditoria(`Contestação da solicitação #${s.id} resolvida`);fecharModal();toast("Contestação resolvida. O cliente deve confirmar.");rerender();break;}
    case "chave-pix": modal(`<h3>Cadastrar chave Pix</h3><div class="f"><label for="tipo-pix">Tipo</label><select id="tipo-pix"><option>CPF</option><option>Celular</option><option>E-mail</option><option>Chave aleatória</option></select></div><div class="f"><label for="valor-pix">Chave</label><input id="valor-pix" value="${esc(DB.pix?.chave||'')}"></div><div class="acts"><button class="btn sec" data-act="fechar">Voltar</button><button class="btn" data-act="salvar-pix">Salvar</button></div>`);break;
    case "salvar-pix": {const chave=$("#valor-pix").value.trim();if(!chave)return toast("Informe a chave Pix.");DB.pix={tipo:$("#tipo-pix").value,chave};fecharModal();toast("Chave Pix cadastrada.");rerender();break;}
    case "sacar": modal(`<h3>Solicitar saque</h3><div class="f"><label for="valor-saque">Valor disponível: ${brl(saldoCliente())}</label><input id="valor-saque" type="number" min="0.01" max="${saldoCliente()}" step="0.01" value="${saldoCliente().toFixed(2)}"></div><div class="acts"><button class="btn sec" data-act="fechar">Voltar</button><button class="btn" data-act="confirmar-saque">Solicitar</button></div>`);break;
    case "confirmar-saque": {const valor=Number($("#valor-saque").value);if(!(valor>0)||valor>saldoCliente())return toast("Valor inválido ou superior ao saldo.");DB.movimentacoesCliente.push({data:hoje(),descricao:"Reserva para saque Pix",valor:-valor,status:"disponível"});DB.saques.unshift({id:`sq${Date.now()}`,data:hoje(),valor,status:"solicitado",chave:DB.pix.chave});registrarAuditoria(`Saque de ${brl(valor)} solicitado`);fecharModal();toast("Saque solicitado.");rerender();break;}
    case "avaliar": {const s=solicitacao(id);if(!s||s.cliente!==CLIENTE.nome||s.status!=="concluida")return toast("Somente coletas concluídas podem ser avaliadas.");if(s.avaliacao)return toast("Esta coleta já foi avaliada.");modal(`<h3>Avaliar coleta #${s.id}</h3><p class="s">A nota deve estar entre 1 e 5. O comentário é opcional.</p><div class="f"><label for="nota">Nota</label><select id="nota">${[1,2,3,4,5].map(n=>`<option value="${n}">${n}</option>`).join("")}</select></div><div class="f"><label for="comentario">Comentário opcional</label><textarea id="comentario" rows="3" maxlength="500" placeholder="Conte como foi a coleta"></textarea></div><div class="acts"><button class="btn sec" data-act="fechar">Voltar</button><button class="btn" data-act="salvar-avaliacao" data-id="${s.id}">Enviar avaliação</button></div>`);break;}
    case "salvar-avaliacao": {const s=solicitacao(id),nota=Number($("#nota")?.value),comentario=$("#comentario")?.value.trim()||"";if(!s||s.cliente!==CLIENTE.nome||s.status!=="concluida")return toast("Somente coletas concluídas podem ser avaliadas.");if(s.avaliacao)return toast("Esta coleta já foi avaliada.");if(!Number.isInteger(nota)||nota<1||nota>5)return toast("Selecione uma nota de 1 a 5.");s.avaliacao=nota;s.comentario=comentario;s.avaliadaEm=hoje();DB.avaliacoes.push({empresa:s.empresa,cliente:s.cliente,solicitacao:s.id,nota,comentario,data:hoje()});registrarHistorico(s,`Coleta avaliada com nota ${nota}/5`);registrarAuditoria(`Solicitação #${s.id} avaliada com nota ${nota}/5`);notificar("representante",`A coleta #${s.id} recebeu avaliação ${nota}/5.`);fecharModal();toast("Avaliação registrada.");rerender();break;}
    case "salvar-precos": {const emp=empresa("e1"),novos={};for(const m of Object.keys(MATERIAL)){if($(`#mat-${m}`).checked){const p=Number($(`#preco-${m}`).value);if(!(p>0))return toast(`Informe o preço de ${MATERIAL[m].nome}.`);novos[m]=p;}}if(!Object.keys(novos).length)return toast("Selecione ao menos um material.");emp.precos=novos; emp.condicoesPorMaterial ||= {}; for(const m of Object.keys(novos)){emp.condicoesPorMaterial[m]={limpeza:$("#limpeza-"+m)?.value.trim()||"",separacao:$("#separacao-"+m)?.value.trim()||"",acondicionamento:$("#acond-"+m)?.value.trim()||"",qualidade:$("#qualidade-"+m)?.value.trim()||""};} emp.condicoes=Object.entries(emp.condicoesPorMaterial).map(([m,c])=>`${MATERIAL[m]?.nome}: ${c.limpeza}; ${c.separacao}; ${c.acondicionamento}; ${c.qualidade}`).join(" | ");registrarAuditoria("Tabela de preços e condições atualizada");toast("Tabela atualizada. Solicitações aprovadas mantêm os preços anteriores.");rerender();break;}
    case "reservar-saldo": modal(`<h3>Reservar saldo</h3><div class="f"><label for="novo-saldo">Valor</label><input id="novo-saldo" type="number" min="1" value="1000"></div><div class="acts"><button class="btn sec" data-act="fechar">Voltar</button><button class="btn" data-act="confirmar-saldo">Registrar</button></div>`);break;
    case "confirmar-saldo": {const v=Number($("#novo-saldo").value);if(!(v>0))return toast("Informe um valor válido.");empresa("e1").saldoReservado+=v;registrarAuditoria(`Saldo reservado acrescido em ${brl(v)}`);fecharModal();toast("Saldo reservado atualizado.");rerender();break;}

      case "ver-empresa": {const epr=empresa(id),avs=DB.avaliacoes.filter(a=>a.empresa===id);modal(`<h3>${epr.nome}</h3><p class="s">${epr.endereco}<br>${epr.contatos.telefone} · ${epr.contatos.email}<br>${epr.horario} · ${epr.recebePresencialmente?'Entrega presencial disponível':'Não recebe presencialmente'}</p><div class="mats">${Object.entries(epr.precos).map(([m,p])=>tagMaterial(m,` <span class="num muted">${brl(p)}/kg</span>`)).join("")}</div><h3>★ ${mediaEmpresa(id).toFixed(1)} · ${avs.length} avaliações</h3>${avs.map(a=>`<div class="row"><div><div class="t">${a.cliente} · ${a.nota}/5</div><div class="s">${esc(a.comentario)}</div></div></div>`).join("")}<div class="acts"><button class="btn sec" data-act="fechar">Fechar</button><button class="btn" data-act="solicitar-em" data-id="${id}">Solicitar coleta</button></div>`);break;}
      case "convidar-coletor": modal(`<h3>Convidar coletor</h3><div class="f"><label>E-mail</label><input id="convite-email" type="email"></div><div class="acts"><button class="btn sec" data-act="fechar">Voltar</button><button class="btn" data-act="salvar-convite">Enviar convite</button></div>`);break;
      case "salvar-convite": {const email=$("#convite-email").value.trim();if(!email.includes("@"))return toast("Informe um e-mail válido.");DB.convitesColetores.unshift({id:`cv${Date.now()}`,empresa:"e1",email,status:"pendente",enviadoEm:hoje()});registrarAuditoria(`Convite de coletor enviado para ${email}`);fecharModal();toast("Convite enviado.");rerender();break;}
      case "cadastrar-veiculo": modal(`<h3>Cadastrar veículo</h3><div class="grid2"><div class="f"><label>Identificação</label><input id="vei-id"></div><div class="f"><label>Placa</label><input id="vei-placa"></div><div class="f"><label>Tipo</label><input id="vei-tipo"></div><div class="f"><label>Capacidade (kg)</label><input id="vei-cap" type="number" min="1"></div></div><div class="acts"><button class="btn sec" data-act="fechar">Voltar</button><button class="btn" data-act="salvar-veiculo">Cadastrar</button></div>`);break;
      case "salvar-veiculo": {const placa=$("#vei-placa").value.trim().toUpperCase(),cap=Number($("#vei-cap").value);if(!placa||!(cap>0))return toast("Informe placa e capacidade válidas.");DB.veiculos.push({id:`v${Date.now()}`,empresa:"e1",identificacao:$("#vei-id").value.trim()||"Veículo",placa,tipo:$("#vei-tipo").value.trim()||"Utilitário",capacidade:cap,ativo:true,disponivel:true});fecharModal();registrarAuditoria(`Veículo ${placa} cadastrado`);rerender();break;}
      case "salvar-empresa": {const epr=empresa("e1");epr.nome=$("#emp-nome").value.trim();epr.contatos.telefone=$("#emp-tel").value.trim();epr.endereco=$("#emp-end").value.trim();epr.horario=$("#emp-hor").value.trim();epr.quantidadeMinima=Math.max(1,Number($("#emp-min").value)||1);epr.recebePresencialmente=$("#emp-pres").checked;registrarAuditoria("Dados públicos e operacionais da empresa atualizados");toast("Dados atualizados.");rerender();break;}
      case "enviar-documento": modal(`<h3>Enviar documento</h3><div class="f"><label>Tipo de documento</label><select id="doc-tipo"><option>Alvará de funcionamento</option><option>Registro municipal</option><option>Licença ambiental</option></select></div><div class="f"><label>Arquivo simulado</label><input id="doc-arq" type="file"></div><div class="acts"><button class="btn sec" data-act="fechar">Voltar</button><button class="btn" data-act="confirmar-documento">Enviar</button></div>`);break;
      case "confirmar-documento": {const arq=$("#doc-arq").files[0];if(!arq)return toast("Selecione um arquivo.");empresa("e1").documentosDetalhes.push({id:`doc${Date.now()}`,nome:$("#doc-tipo").value,status:"em análise",arquivo:arq.name});fecharModal();notificar("admin","Novo documento empresarial aguardando análise.");rerender();break;}
      case "corrigir-empresa": {const epr=empresa(id);modal(`<h3>Solicitar correção</h3><div class="f"><label>Dados ou documentos a corrigir</label><input id="motivo-correcao"></div><div class="acts"><button class="btn sec" data-act="fechar">Voltar</button><button class="btn" data-act="confirmar-correcao" data-id="${id}">Enviar</button></div>`);break;}
      case "confirmar-correcao": {const motivo=$("#motivo-correcao").value.trim();if(!motivo)return toast("Descreva a correção necessária.");const epr=empresa(id);epr.status="correcao";epr.correcaoSolicitada=motivo;registrarAuditoria(`Correção solicitada à empresa ${epr.nome}: ${motivo}`);fecharModal();rerender();break;}
      case "alternar-admin": {const u=DB.usuarios.find(x=>x.id===id);u.administrador=!u.administrador;u.perfil=u.administrador?"Administrador":"Suporte";registrarAuditoria(`${u.administrador?'Perfil administrativo atribuído a':'Perfil administrativo removido de'} ${u.nome}`);rerender();break;}
      case "suspender-empresa": {const epr=empresa(id);epr.status="suspensa";registrarAuditoria(`Empresa ${epr.nome} suspensa`);rerender();break;}
      case "reativar-empresa": {const epr=empresa(id);epr.status="ativa";epr.verificada=true;registrarAuditoria(`Empresa ${epr.nome} reativada`);rerender();break;}
      case "liberar-parada": {const s=solicitacao(id);s.status="em_rota";s.motivoPendente="";registrarHistorico(s,"Parada pendente liberada pelo representante");notificar("coletor",`Parada da solicitação #${s.id} liberada.`);if(s.cliente===CLIENTE.nome)notificar("cliente",`Sua coleta #${s.id} foi liberada e está aguardando atendimento na rota.`);rerender();break;}
      case "nova-categoria": modal(`<h3>Nova categoria</h3><div class="f"><label>Nome</label><input id="cat-nome"></div><div class="acts"><button class="btn sec" data-act="fechar">Voltar</button><button class="btn" data-act="salvar-categoria">Salvar</button></div>`);break;
      case "salvar-categoria": {const nome=$("#cat-nome").value.trim();if(!nome)return toast("Informe o nome.");const key=`cat_${Date.now()}`;MATERIAL[key]={nome,cor:"--papel"};registrarAuditoria(`Categoria ${nome} cadastrada`);fecharModal();rerender();break;}
      case "editar-categoria": {const m=MATERIAL[id];modal(`<h3>Editar categoria</h3><div class="f"><label>Nome</label><input id="cat-nome" value="${esc(m.nome)}"></div><div class="acts"><button class="btn sec" data-act="fechar">Voltar</button><button class="btn" data-act="confirmar-edicao-categoria" data-id="${id}">Salvar</button></div>`);break;}
      case "confirmar-edicao-categoria": {MATERIAL[id].nome=$("#cat-nome").value.trim()||MATERIAL[id].nome;fecharModal();rerender();break;}

    case "alternar-coletor": {const c=DB.coletores.find(x=>x.id===id);c.ativo=!c.ativo;registrarAuditoria(`Coletor ${c.nome} ${c.ativo?'ativado':'desativado'}`);rerender();break;}
    case "alternar-veiculo": {const v=DB.veiculos.find(x=>x.id===id);v.ativo=!v.ativo;registrarAuditoria(`Veículo ${v.placa} ${v.ativo?'ativado':'desativado'}`);rerender();break;}
    case "aprovar-empresa": {const epr=empresa(id);epr.status="ativa";epr.verificada=true;registrarAuditoria(`Empresa ${epr.nome} aprovada`);toast("Empresa aprovada.");rerender();break;}
    case "rejeitar-empresa": {const epr=empresa(id);epr.status="rejeitada";registrarAuditoria(`Empresa ${epr.nome} rejeitada`);toast("Empresa rejeitada.");rerender();break;}
    case "alternar-usuario": {const u=DB.usuarios.find(x=>x.id===id);u.ativo=!u.ativo;registrarAuditoria(`Usuário ${u.nome} ${u.ativo?'reativado':'bloqueado'}`);rerender();break;}
  }
});

document.addEventListener("keydown", e=>{ if(e.key==="Escape") fecharModal(); });
$("#sair").addEventListener("click",()=>{ $("#app").hidden=true; $("#login").hidden=false; fecharModal(); });

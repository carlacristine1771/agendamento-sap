/* ============================================================
   painel-coordenacao.js (inline)
   CORREÇÃO #3: coordenação tem visão GLOBAL de todos os alunos
   e todas as atendimentos. Pode encaminhar qualquer aluno aprovado.
   ============================================================ */
'use strict';
initStore();

var _sess = getSession();
if (!_sess || _sess.role !== 'coordenacao') {
  clearSession();
  clearSession(); window.location.href = '../index.html';
}

document.getElementById('sb-nome').textContent   = _sess.nome || 'Coordenação';
document.getElementById('sb-setor').textContent  = _sess.setor || 'Coordenação';
(function(){
  var unNome = nomeUnidade(_sess.unidadeId);
  var el = document.querySelector('.topbar-breadcrumb');
  if (el) el.textContent = 'SAP · Coordenação · ' + unNome;
})();
document.getElementById('sb-avatar').textContent = (_sess.nome || 'C').charAt(0);
document.getElementById('wb-nome').textContent   = 'Olá, ' + (_sess.nome || 'Coordenação').split(' ')[0] + '!';
document.getElementById('wb-setor').textContent  = _sess.setor || 'SENAC CEP';

/* ── Navegação ── */
function navTo(panelId, navEl) {
  document.querySelectorAll('.panel-section').forEach(function(p) { p.classList.remove('active'); });
  document.querySelectorAll('.nav-link').forEach(function(n) { n.classList.remove('active'); });
  var p = document.getElementById(panelId);
  if (p) p.classList.add('active');
  if (navEl) navEl.classList.add('active');
  var labelEl = navEl ? navEl.querySelector('.nav-label') : null;
  document.getElementById('topbar-title').textContent = labelEl ? labelEl.textContent : '';
  if (panelId === 'panel-home')       renderHome();
  if (panelId === 'panel-alunos')     renderAlunos();
  if (panelId === 'panel-atendimentos')  renderAtendimentos();
  if (panelId === 'panel-encaminhar') popularSelectAlunos();
  if (panelId === 'panel-chat')       renderChat();
}

/* ── Home ── */
function renderHome() {
  var store = getStore();
  var atendimentosUnidade = Permissions.getAtendimentosVisiveis(_sess, store.atendimentos, store.alunos);
  var todosAlunos = Permissions.getAlunosVisiveis(_sess, store.alunos);

  document.getElementById('st-alunos').textContent = todosAlunos.length;
  document.getElementById('st-agt').textContent    = atendimentosUnidade.filter(function(c){ return c.status==='aguardando'; }).length;
  document.getElementById('st-conf').textContent   = atendimentosUnidade.filter(function(c){ return c.status==='confirmada'; }).length;
  document.getElementById('st-real').textContent   = atendimentosUnidade.filter(function(c){ return c.status==='realizada'; }).length;

  var recentes = atendimentosUnidade.slice().sort(function(a,b){ return new Date(b.criacao)-new Date(a.criacao); }).slice(0,5);
  var el = document.getElementById('home-recentes');
  if (!el) return;
  if (!recentes.length) {
    el.innerHTML = '<div class="empty-state"><div class="empty-state-title">Nenhuma solicitação ainda</div></div>';
    return;
  }
  el.innerHTML = recentes.map(function(c) {
    var al = store.alunos.find(function(a){ return a.id===c.idAluno; }) || {nome:'—'};
    return '<div class="atendimento-item">'
      + '<div class="ci-status-bar bar-' + escape(c.status) + '"></div>'
      + '<div class="ci-body">'
      + '<div class="ci-header">'
      + '<span class="ci-motivo">' + escape(c.motivoSolicitação.slice(0,60)) + (c.motivoSolicitação.length>60?'…':'') + '</span>'
      + statusBadge(c.status)
      + '</div>'
      + '<div class="ci-meta">'
      + '<span class="ci-meta-item">' + escape(al.nome) + '</span>'
      + '<span class="ci-meta-item">' + turnoLabel(c.turno) + '</span>'
      + '<span class="ci-meta-item">' + fmtDate(c.criacao) + '</span>'
      + '</div></div></div>';
  }).join('');
}

/* ── Lista de Alunos (visão global) ── */
function renderAlunos() {
  var store = getStore();
  var q = (document.getElementById('busca-al') ? document.getElementById('busca-al').value : '').toLowerCase();

  /* CORREÇÃO #3: coordenação vê todos */
  var lista = Permissions.getAlunosVisiveis(_sess, store.alunos).filter(function(a) {
    return !q || a.nome.toLowerCase().indexOf(q)>=0 || a.matricula.indexOf(q)>=0;
  });

  var tb = document.getElementById('tbody-alunos');
  if (!tb) return;
  if (!lista.length) {
    tb.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:36px;color:var(--gray-400)">Nenhum aluno</td></tr>';
    return;
  }
  tb.innerHTML = lista.map(function(a) {
    var nc = store.atendimentos.filter(function(c){ return c.idAluno===a.id; }).length;
    var statusColor = a.statusCadastro==='ativo'?'#dcfce7;color:#15803d'
                    : a.statusCadastro==='pendente'?'#FEF3DC;color:#C87F00'
                    : '#fee2e2;color:#991b1b';
    var statusLabel = a.statusCadastro==='ativo'?'Aprovado'
                    : a.statusCadastro==='pendente'?'Pendente':'Rejeitado';
    return '<tr>'
      + '<td><div style="font-weight:600">' + escape(a.nome) + '</div>'
      + '<div style="font-size:11.5px;color:var(--gray-400)">' + escape(a.email||'') + '</div></td>'
      + '<td><code style="font-size:12px">' + escape(a.matricula) + '</code></td>'
      + '<td>' + escape(a.curso||'—') + ' / ' + escape(a.turma||'—')
      + '<div style="font-size:11px;color:var(--gray-400)">Turno: ' + turnoLabel(a.turnoCurso) + '</div></td>'
      + '<td>' + (a.pcd?'<span style="font-size:11px;font-weight:700;background:#E8EFF8;color:#1B3A6B;padding:2px 8px;border-radius:20px;">PCD</span>':'—') + '</td>'
      + '<td><span style="font-size:11px;font-weight:700;background:' + statusColor + ';padding:2px 8px;border-radius:20px;">' + statusLabel + '</span></td>'
      + '<td style="text-align:center">' + nc + '</td>'
      + '<td><button class="btn btn-outline btn-sm" onclick="encAluno(\'' + a.id + '\')">'
      + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>'
      + 'Encaminhar</button></td>'
      + '</tr>';
  }).join('');
}

function encAluno(id) {
  navTo('panel-encaminhar', document.querySelector('[data-panel="panel-encaminhar"]'));
  setTimeout(function() { document.getElementById('enc-aluno').value = id; atualizarCompatibilidade(); }, 80);
}

/* ── Select de alunos (coordenação vê todos aprovados) ── */
function popularSelectAlunos() {
  var store = getStore();
  var aprovados = Permissions.getAlunosVisiveis(_sess, store.alunos, { apenasAprovados: true });
  var sel = document.getElementById('enc-aluno');
  if (!sel) return;
  sel.innerHTML = '<option value="">Selecione o aluno...</option>'
    + aprovados.map(function(a) {
        return '<option value="' + a.id + '">' + escape(a.nome) + ' — ' + escape(a.turma) + '</option>';
      }).join('');
  atualizarCompatibilidade();
}

function atualizarCompatibilidade() {
  var store    = getStore();
  var alunoId  = document.getElementById('enc-aluno') ? document.getElementById('enc-aluno').value : '';
  var horaEl   = document.getElementById('enc-hora');
  var hora     = horaEl ? horaEl.value : '';
  var hint     = document.getElementById('enc-hint');
  var hintHora = document.getElementById('enc-hora-hint');
  var aluno    = alunoId ? store.alunos.find(function(a){ return a.id===alunoId; }) : null;
  var turnoCurso = aluno ? Validators.normalizeTurno(aluno.turnoCurso) : '';

  if (hint) {
    hint.textContent = descricaoDisponibilidadeAluno(aluno);
    hint.style.color = aluno && !turnoCurso ? 'var(--s-cancel)' : '';
  }

  var turnoSelect = document.getElementById('enc-turno');
  if (turnoSelect) {
    if (turnoCurso) turnoSelect.value = turnoCurso;
    Array.from(turnoSelect.options).forEach(function(opt) {
      if (!opt.value) return;
      opt.disabled = !!(turnoCurso && opt.value !== turnoCurso);
      opt.style.color = (turnoCurso && opt.value !== turnoCurso) ? 'var(--gray-400)' : '';
    });
  }

  if (horaEl) {
    var faixa = turnoHoraConfig(turnoCurso);
    if (faixa) {
      horaEl.min = faixa.inicio;
      horaEl.max = faixa.fim;
      if (hora && (hora < faixa.inicio || hora > faixa.fim)) {
        horaEl.value = '';
        hora = '';
      }
    } else {
      horaEl.removeAttribute('min');
      horaEl.removeAttribute('max');
    }
  }

  if (aluno && turnoCurso) {
    var faixaLabel = turnoHoraConfig(turnoCurso);
    if (hora) {
      var compat = getCompatibilidadeAtendimento(aluno, turnoCurso, hora);
      if (hintHora) {
        hintHora.textContent = compat.ok
          ? '✓ Horário dentro do turno ' + turnoLabel(turnoCurso) + (faixaLabel ? ' (' + faixaLabel.inicio + ' às ' + faixaLabel.fim + ')' : '') + '.'
          : '⚠ ' + compat.motivo;
        hintHora.style.color = compat.ok ? 'var(--s-done)' : 'var(--s-cancel)';
      }
    } else if (hintHora) {
      hintHora.textContent = 'Escolha um horário entre '
        + (faixaLabel ? faixaLabel.inicio + ' e ' + faixaLabel.fim : 'os horários permitidos')
        + ' (turno ' + turnoLabel(turnoCurso) + ').';
      hintHora.style.color = 'var(--gray-500)';
    }
  } else if (hintHora) {
    hintHora.textContent = 'O horário deve ser no mesmo turno do curso do aluno.';
    hintHora.style.color = '';
  }
}

function submitEnc() {
  var store   = getStore();
  var alunoId = document.getElementById('enc-aluno').value;
  var motivo  = document.getElementById('enc-motivo').value.trim();
  var data    = document.getElementById('enc-data').value;
  var turno   = document.getElementById('enc-turno').value;
  var hora    = document.getElementById('enc-hora').value;
  var obs     = document.getElementById('enc-obs').value.trim();
  var errEl   = document.getElementById('enc-err');
  errEl.style.display = 'none';

  if (!alunoId || !motivo || !turno) {
    errEl.textContent='Preencha: aluno, motivo e turno.'; errEl.style.display='block'; return;
  }
  var alunoObj = store.alunos.find(function(a){ return a.id===alunoId; });
  if (hora) {
    var compat = getCompatibilidadeAtendimento(alunoObj, turno, hora);
    if (!compat.ok) { errEl.textContent=compat.motivo; errEl.style.display='block'; return; }
  }
  store.atendimentos.push({
    id: genId('c'), idAluno: alunoId, agendadoPor: _sess.id,
    unidadeId: _sess.unidadeId||'u1',
    motivoSolicitação: motivo, dataPreferencial: data,
    horarioPreferencial: hora, turno: turno, obsResponsavel: obs,
    obsPsicologa: '', status: 'aguardando', criacao: new Date().toISOString()
  });
  saveStore(store);
  toast('Solicitação enviado!', 'success');
  ['enc-aluno','enc-motivo','enc-data','enc-hora','enc-obs'].forEach(function(id){
    var el=document.getElementById(id); if(el) el.value='';
  });
  var ts=document.getElementById('enc-turno'); if(ts) ts.value='';
  renderHome();
}

/* ── Atendimentos (visão global) ── */
function renderAtendimentos() {
  var store = getStore();
  var q   = document.getElementById('busca-cons') ? document.getElementById('busca-cons').value.toLowerCase() : '';
  var fSt = document.getElementById('filtro-st')  ? document.getElementById('filtro-st').value : '';

  /* CORREÇÃO #3: coordenação vê TODAS as atendimentos */
  var lista = Permissions.getAtendimentosVisiveis(_sess, store.atendimentos, store.alunos);
  if (fSt) lista = lista.filter(function(c){ return c.status===fSt; });
  if (q) lista = lista.filter(function(c) {
    var al = store.alunos.find(function(a){ return a.id===c.idAluno; });
    return (al&&al.nome||'').toLowerCase().indexOf(q)>=0
        || (al&&al.matricula||'').indexOf(q)>=0
        || c.motivoSolicitação.toLowerCase().indexOf(q)>=0;
  });
  lista.sort(function(a,b){ return new Date(b.criacao)-new Date(a.criacao); });

  var tb = document.getElementById('tbody-cons');
  if (!tb) return;
  if (!lista.length) {
    tb.innerHTML='<tr><td colspan="6" style="text-align:center;padding:36px;color:var(--gray-400)">Nenhuma atendimento</td></tr>'; return;
  }
  tb.innerHTML = lista.map(function(c) {
    var al = store.alunos.find(function(a){ return a.id===c.idAluno; }) || {nome:'—',matricula:''};
    var turnoCurso    = Validators.normalizeTurno(al.turnoCurso);
    var turnoAtendimento = Validators.normalizeTurno(c.turno);
    var incompativel  = turnoCurso && turnoAtendimento && turnoCurso !== turnoAtendimento;
    var turnoCell = turnoLabel(c.turno)
      + (incompativel
          ? ' <span style="font-size:10px;font-weight:700;background:#fef3dc;color:#c87f00;padding:1px 6px;border-radius:10px;margin-left:4px" title="Turno da atendimento diferente do turno do curso">⚠ incompatível</span>'
          : (turnoCurso ? ' <span style="font-size:10px;color:var(--gray-400)">✓</span>' : ''));
    return '<tr' + (incompativel ? ' style="background:rgba(247,163,0,.04)"' : '') + '>'
      + '<td><div style="font-weight:600">' + escape(al.nome) + '</div>'
      + '<div style="font-size:11.5px;color:var(--gray-400)">' + escape(al.matricula) + '</div></td>'
      + '<td>' + escape(c.motivoSolicitação.length>45?c.motivoSolicitação.slice(0,45)+'…':c.motivoSolicitação) + '</td>'
      + '<td>' + turnoCell + '</td>'
      + '<td>' + escape(nomeResponsavel(c.agendadoPor)) + '</td>'
      + '<td>' + statusBadge(c.status) + '</td>'
      + '<td>' + fmtDate(c.criacao) + '</td>'
      + '</tr>';
  }).join('');
}

/* ── Chat ── */
function getPsicologaDaUnidade(store) {
  store = store || getStore();
  return (store.psicologos || []).find(function(p){ return p.unidadeId===_sess.unidadeId; }) || (store.psicologos || [])[0] || { id:'psic1', nome:'Psicóloga' };
}

function renderChat() {
  var store = getStore();
  var psicologa = getPsicologaDaUnidade(store);
  var psicId = psicologa.id || 'psic1';
  var nomeEl = document.getElementById('chat-psic-nome');
  if (nomeEl) nomeEl.textContent = psicologa.nome || 'Psicóloga';
  var msgs = store.mensagens.filter(function(m) {
    return ((m.de===_sess.id && m.para===psicId) || (m.de===psicId && m.para===_sess.id)) && (m.unidadeId===_sess.unidadeId || !m.unidadeId);
  }).sort(function(a,b){ return new Date(a.criacao)-new Date(b.criacao); });
  var el = document.getElementById('chat-area');
  if (!el) return;
  if (!msgs.length) {
    el.innerHTML='<div class="chat-empty-msg">Nenhuma mensagem ainda.<br>Inicie uma conversa com a psicóloga.</div>'; return;
  }
  el.innerHTML = msgs.map(function(m) {
    return '<div class="chat-msg ' + (m.de===_sess.id?'sent':'recv') + '">'
      + '<div class="chat-bubble">' + escape(m.texto) + '</div>'
      + '<div class="chat-meta">' + fmtDatetime(m.criacao) + '</div></div>';
  }).join('');
  el.scrollTop = el.scrollHeight;
}

function enviarMsg() {
  var input = document.getElementById('chat-txt');
  var texto = input ? input.value.trim() : '';
  if (!texto) return;
  var store = getStore();
  var psicologa = getPsicologaDaUnidade(store);
  store.mensagens.push({ id:genId('m'), de:_sess.id, para:psicologa.id || 'psic1', unidadeId:_sess.unidadeId || 'u1', texto:texto, criacao:new Date().toISOString() });
  saveStore(store);
  input.value = '';
  renderChat();
  toast('Mensagem enviada.', 'success');
}

document.addEventListener('keydown', function(e) {
  if (e.key==='Enter' && document.activeElement && document.activeElement.id==='chat-txt') enviarMsg();
});

/* ── Cadastro de aluno ── */
function salvarAluno() {
  var nome  = document.getElementById('cad-nome').value.trim();
  var mat   = document.getElementById('cad-mat').value.trim();
  var cpf   = document.getElementById('cad-cpf').value.trim();
  var nasc  = document.getElementById('cad-nasc').value;
  var tel   = document.getElementById('cad-tel').value.trim();
  var cur   = document.getElementById('cad-curso').value;
  var tur   = document.getElementById('cad-turma').value.trim();
  var turno = document.getElementById('cad-turno').value;
  var pcd   = document.getElementById('cad-pcd').value === 'sim';
  var eml   = document.getElementById('cad-email').value.trim();
  var errEl = document.getElementById('cad-err');
  errEl.style.display='none';

  if (!nome||!mat||!cpf||!nasc||!tel||!cur||!tur||!turno) {
    errEl.textContent='Preencha todos os campos obrigatórios.'; errEl.style.display='block'; return;
  }
  if (!Validators.cpf(cpf)) {
    errEl.textContent='CPF inválido. Verifique os dígitos.'; errEl.style.display='block'; return;
  }
  if (eml && !Validators.email(eml)) {
    errEl.textContent='E-mail inválido.'; errEl.style.display='block'; return;
  }
  if (!Validators.telefone(tel)) {
    errEl.textContent='Telefone inválido.'; errEl.style.display='block'; return;
  }
  if (!Validators.data(nasc)) {
    errEl.textContent='Data de nascimento inválida.'; errEl.style.display='block'; return;
  }

  var store = getStore();
  if (store.alunos.find(function(a){ return a.matricula===mat; })) {
    errEl.textContent='Matrícula já cadastrada.'; errEl.style.display='block'; return;
  }
  if (store.alunos.find(function(a){ return a.cpf.replace(/\D/g,'')===cpf.replace(/\D/g,''); })) {
    errEl.textContent='CPF já cadastrado.'; errEl.style.display='block'; return;
  }

  /* CORREÇÃO #1: status sempre 'pendente' */
  store.alunos.push({
    id:genId('al'), nome, matricula:mat, cpf, dataNascimento:nasc, telefone:tel,
    curso:cur, turma:tur, turnoCurso:Validators.normalizeTurno(turno),
    email:eml, pcd, responsavelCad:_sess.id,
    unidadeId:_sess.unidadeId||'u1',
    statusCadastro:'ativo',
    dataCadastro:new Date().toISOString()
  });
  saveStore(store);
  closeModal('modal-cad');
  toast('Aluno cadastrado com sucesso!', 'success');
  ['cad-nome','cad-mat','cad-cpf','cad-nasc','cad-tel','cad-curso','cad-turma','cad-turno','cad-email'].forEach(function(id){
    var el=document.getElementById(id); if(el) el.value='';
  });
  var pcdSel=document.getElementById('cad-pcd'); if(pcdSel) pcdSel.value='nao';
  renderAlunos();
}

function initPainelCoordenacao() {
  renderHome();
  popularSelectAlunos();
  renderAlunos();
  renderAtendimentos();
}

initPainelCoordenacao();

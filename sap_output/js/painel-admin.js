'use strict';
initStore();
var _sess = getSession();
if (!_sess || _sess.role !== 'administrador') { clearSession(); window.location.href = "../index.html"; }

document.getElementById('sb-nome').textContent   = _sess.nome || 'Admin';
document.getElementById('sb-avatar').textContent = (_sess.nome||'A').charAt(0);
document.getElementById('wb-nome').textContent   = 'Olá, ' + (_sess.nome||'Admin').split(' ')[0] + '!';

var store = getStore();
var u = store.unidades.find(function(x){ return x.id===_sess.unidadeId; });
var nomUnid = u ? u.nome : _sess.unidadeId;
document.getElementById('sb-unidade').textContent = nomUnid;
document.getElementById('wb-unidade').textContent = 'SENAC DF · ' + nomUnid;
var topEl = document.querySelector('.topbar-breadcrumb');
if (topEl) topEl.textContent = 'SAP · Administrador · ' + nomUnid;

var _roleSelected = '';

function navTo(panelId, navEl) {
  document.querySelectorAll('.panel-section').forEach(function(p){ p.classList.remove('active'); });
  document.querySelectorAll('.nav-link').forEach(function(n){ n.classList.remove('active'); });
  var p = document.getElementById(panelId); if (p) p.classList.add('active');
  if (navEl) navEl.classList.add('active');
  var lEl = navEl ? navEl.querySelector('.nav-label') : null;
  document.getElementById('topbar-title').textContent = lEl ? lEl.textContent : '';
  if (panelId==='panel-dashboard')  renderDashboard();
  if (panelId==='panel-unidades')   renderUnidades();
  if (panelId==='panel-usuarios')   renderUsuarios();
  if (panelId==='panel-criar')      initFormCriar();
}

function renderDashboard() {
  var s = getStore();
  document.getElementById('ds-unidades').textContent = s.unidades.length;
  document.getElementById('ds-psicos').textContent   = s.psicologos.length;
  document.getElementById('ds-insts').textContent    = s.instrutores.length;
  document.getElementById('ds-coords').textContent   = s.coordenadores.length;
  var alunosEl = document.getElementById('ds-alunos');
  if (alunosEl) alunosEl.textContent = s.alunos.filter(function(a){ return a.statusCadastro==='ativo'; }).length;
  var el = document.getElementById('ds-unidades-lista');
  el.innerHTML = s.unidades.map(function(un) {
    var alunos   = s.alunos.filter(function(a){ return a.unidadeId===un.id; }).length;
    var atendimentos= s.atendimentos.filter(function(c){ return c.unidadeId===un.id; }).length;
    var psicos   = s.psicologos.filter(function(p){ return p.unidadeId===un.id; }).length;
    var insts    = s.instrutores.filter(function(i){ return i.unidadeId===un.id; }).length;
    return '<div class="unidade-card">'
      + '<div class="unidade-card-name">'+escape(un.nome)+'</div>'
      + '<div class="unidade-card-region">'+escape(un.regiao)+'</div>'
      + '<div class="unidade-card-stats">'
      + (psicos?'<span class="us-chip">'+psicos+' psic.</span>':'')
      + (insts?'<span class="us-chip">'+insts+' instr.</span>':'')
      + (alunos?'<span class="us-chip">'+alunos+' alunos</span>':'')
      + (atendimentos?'<span class="us-chip">'+atendimentos+' consul.</span>':'')
      + '</div></div>';
  }).join('');
}

function renderUnidades() {
  var s = getStore();
  var tb = document.getElementById('tbody-unidades');
  tb.innerHTML = s.unidades.map(function(un) {
    var psicos  = s.psicologos.filter(function(p){ return p.unidadeId===un.id; }).length;
    var insts   = s.instrutores.filter(function(i){ return i.unidadeId===un.id; }).length;
    var coords  = s.coordenadores.filter(function(c){ return c.unidadeId===un.id; }).length;
    var alunos  = s.alunos.filter(function(a){ return a.unidadeId===un.id; }).length;
    var conss   = s.atendimentos.filter(function(c){ return c.unidadeId===un.id; }).length;
    return '<tr>'
      + '<td><strong>'+escape(un.nome)+'</strong></td>'
      + '<td>'+escape(un.regiao)+'</td>'
      + '<td style="text-align:center">'+psicos+'</td>'
      + '<td style="text-align:center">'+insts+'</td>'
      + '<td style="text-align:center">'+coords+'</td>'
      + '<td style="text-align:center">'+alunos+'</td>'
      + '<td style="text-align:center">'+conss+'</td>'
      + '<td style="text-align:center"><button class="btn btn-outline btn-sm" onclick="abrirEditarUnidade(\''+un.id+'\')">'
      + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>'
      + 'Editar</button></td>'
      + '</tr>';
  }).join('');
}

function renderUsuarios() {
  var s = getStore();
  var filtro = document.getElementById('filtro-role').value;
  var lista = [];
  if (!filtro||filtro==='psicologa') s.psicologos.forEach(function(p){ lista.push({id:p.id,nome:p.nome,role:'psicologa',usuario:p.usuario,cpf:p.cpf||'',unidadeId:p.unidadeId,extra:p.crp||''});  });
  if (!filtro||filtro==='instrutor') s.instrutores.forEach(function(i){ lista.push({id:i.id,nome:i.nome,role:'instrutor',usuario:i.usuario,cpf:i.cpf||'',unidadeId:i.unidadeId,extra:i.disciplina||''}); });
  if (!filtro||filtro==='coordenacao') s.coordenadores.forEach(function(c){ lista.push({id:c.id,nome:c.nome,role:'coordenacao',usuario:c.usuario,cpf:c.cpf||'',unidadeId:c.unidadeId,extra:c.setor||''}); });
  if (!filtro||filtro==='aluno') s.alunos.forEach(function(a){ lista.push({id:a.id,nome:a.nome,role:'aluno',usuario:a.usuario||a.matricula||'',cpf:a.cpf||'',unidadeId:a.unidadeId,extra:a.curso||''}); });
  var roleLabel = {psicologa:'Psicólogo(a)',instrutor:'Instrutor',coordenacao:'Coordenação',aluno:'Aluno'};
  var roleColor = {psicologa:'#E8EFF8;color:#1B3A6B',instrutor:'#FEF3DC;color:#C87F00',coordenacao:'#FEF3DC;color:#C87F00',aluno:'#FFF4E6;color:#A66300'};
  var tb = document.getElementById('tbody-usuarios');
  tb.innerHTML = lista.map(function(u) {
    return '<tr>'
      + '<td><strong>'+escape(u.nome)+'</strong></td>'
      + '<td><span style="font-size:11.5px;font-weight:700;background:'+roleColor[u.role]+';padding:3px 9px;border-radius:20px">'+roleLabel[u.role]+'</span></td>'
      + '<td><code>'+escape(u.usuario)+'</code></td>'
      + '<td><code style="font-size:11px">'+escape(u.cpf||'—')+'</code></td>'
      + '<td>'+escape(nomeUnidade(u.unidadeId))+'</td>'
      + '<td style="font-size:12px;color:var(--gray-400)">'+escape(u.extra)+'</td>'
      + '<td style="text-align:center"><button class="btn btn-outline btn-sm" onclick="abrirEditarUsuario(\''+escape(u.id)+'\',\''+escape(u.role)+'\')">'
      + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>'
      + 'Editar</button></td>'
      + '</tr>';
  }).join('');
  if (!lista.length) tb.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:36px;color:var(--gray-400)">Nenhum usuário</td></tr>';
}

function initFormCriar() {
  var s = getStore();
  var sel = document.getElementById('c-unidade');
  sel.innerHTML = '<option value="">Selecione a unidade...</option>'
    + s.unidades.map(function(u){ return '<option value="'+u.id+'"'+(u.id===_sess.unidadeId?' selected':'')+'>'+escape(u.nome)+'</option>'; }).join('');
}

function selectRole(role) {
  _roleSelected = role;
  document.querySelectorAll('.role-option').forEach(function(el){ el.classList.remove('selected'); });
  var el = document.getElementById('role-'+role); if (el) el.classList.add('selected');
  var ef = document.getElementById('extra-field');
  var tf = document.getElementById('turmas-field');
  if (role==='instrutor') {
    ef.innerHTML = '<label class="form-label">Disciplina</label><input type="text" class="form-control" id="c-extra" placeholder="Ex: Administração">';
    tf.style.display = 'block';
  } else if (role==='coordenacao') {
    ef.innerHTML = '<label class="form-label">Setor</label><input type="text" class="form-control" id="c-extra" placeholder="Ex: Coordenação Pedagógica">';
    tf.style.display = 'none';
  } else {
    ef.innerHTML = '';
    tf.style.display = 'none';
  }
}

function criarLogin() {
  var errEl = document.getElementById('criar-err');
  errEl.style.display = 'none';
  var role    = _roleSelected;
  var nome    = document.getElementById('c-nome').value.trim();
  var cpf     = document.getElementById('c-cpf') ? document.getElementById('c-cpf').value.trim() : '';
  var usuario = document.getElementById('c-user').value.trim();
  var senha   = document.getElementById('c-senha').value.trim();
  var unidade = document.getElementById('c-unidade').value;

  if (!role) { errEl.textContent='Selecione um perfil.'; errEl.style.display='block'; return; }
  if (!nome||!usuario||!senha||!unidade) {
    errEl.textContent = 'Preencha todos os campos obrigatórios.';
    errEl.style.display = 'block'; return;
  }
  if (senha.length < 8) { errEl.textContent='Senha deve ter ao menos 8 caracteres.'; errEl.style.display='block'; return; }
  if (cpf && !Validators.cpf(cpf)) { errEl.textContent='CPF inválido. Verifique os dígitos.'; errEl.style.display='block'; return; }

  var s = getStore();
  var todos = s.psicologos.concat(s.instrutores).concat(s.coordenadores).concat(s.administradores).concat(s.alunos);
  if (role==='aluno') {
    errEl.textContent = 'O cadastro de novos alunos foi removido do painel do administrador.';
    errEl.style.display = 'block';
    return;
  }
  if (todos.find(function(u){ return u.usuario===usuario; })) {
    errEl.textContent = 'Nome de usuário já está em uso. Escolha outro.'; errEl.style.display='block'; return;
  }
  if (cpf && todos.find(function(u){ return u.cpf && u.cpf.replace(/\D/g,'')===cpf.replace(/\D/g,''); })) {
    errEl.textContent = 'CPF já cadastrado no sistema.'; errEl.style.display='block'; return;
  }

  var extra = document.getElementById('c-extra') ? document.getElementById('c-extra').value.trim() : '';
  var turmasEl = document.getElementById('c-turmas');
  var turmas = turmasEl && turmasEl.value ? turmasEl.value.split(',').map(function(t){ return t.trim(); }).filter(Boolean) : [];
  var newId = genId(role.charAt(0));

  if (role==='psicologa') {
    s.psicologos.push({ id:newId, usuario:usuario, cpf:cpf||'', senha:senha, nome:nome, unidadeId:unidade, role:'psicologa' });
  } else if (role==='instrutor') {
    s.instrutores.push({ id:newId, usuario:usuario, cpf:cpf||'', senha:senha, nome:nome, disciplina:extra, turmas:turmas, unidadeId:unidade, role:'instrutor' });
  } else if (role==='coordenacao') {
    s.coordenadores.push({ id:newId, usuario:usuario, cpf:cpf||'', senha:senha, nome:nome, setor:extra, unidadeId:unidade, role:'coordenacao' });
  }
  saveStore(s);
  toast('✓ Login individual criado para '+nome+'!', 'success');
  limparFormCriar();
  renderDashboard();
  renderUsuarios();
}

function limparFormCriar() {
  ['c-nome','c-cpf','c-user','c-senha','c-turmas'].forEach(function(id){ var el=document.getElementById(id); if(el) el.value=''; });
  document.getElementById('criar-err').style.display = 'none';
  document.querySelectorAll('.role-option').forEach(function(el){ el.classList.remove('selected'); });
  _roleSelected = '';
  document.getElementById('extra-field').innerHTML = '';
  document.getElementById('turmas-field').style.display = 'none';
}

/* ── EDITAR / CRIAR UNIDADE ── */
function abrirModalNovaUnidade() {
  document.getElementById('mu-title').textContent = 'Nova Unidade';
  document.getElementById('mu-nome').value = '';
  document.getElementById('mu-regiao').value = '';
  document.getElementById('mu-id').value = '';
  document.getElementById('mu-err').style.display = 'none';
  openModal('modal-unidade');
}

function abrirEditarUnidade(id) {
  var s = getStore();
  var un = s.unidades.find(function(u){ return u.id===id; });
  if (!un) return;
  document.getElementById('mu-title').textContent = 'Editar Unidade';
  document.getElementById('mu-nome').value = un.nome;
  document.getElementById('mu-regiao').value = un.regiao;
  document.getElementById('mu-id').value = id;
  document.getElementById('mu-err').style.display = 'none';
  openModal('modal-unidade');
}

function salvarUnidade() {
  var nome   = document.getElementById('mu-nome').value.trim();
  var regiao = document.getElementById('mu-regiao').value.trim();
  var id     = document.getElementById('mu-id').value;
  var errEl  = document.getElementById('mu-err');
  errEl.style.display = 'none';
  if (!nome || !regiao) { errEl.textContent = 'Preencha nome e região.'; errEl.style.display='block'; return; }
  var s = getStore();
  if (id) {
    var un = s.unidades.find(function(u){ return u.id===id; });
    if (un) { un.nome = nome; un.regiao = regiao; }
  } else {
    s.unidades.push({ id:'u'+Date.now(), nome:nome, regiao:regiao });
  }
  saveStore(s);
  closeModal('modal-unidade');
  toast(id ? '✓ Unidade atualizada!' : '✓ Unidade criada!', 'success');
  renderDashboard(); renderUnidades();
}

/* ── EDITAR USUÁRIO ── */
function abrirEditarUsuario(id, role) {
  var s = getStore();
  var listaMap = { psicologa:s.psicologos, instrutor:s.instrutores, coordenacao:s.coordenadores, aluno:s.alunos };
  var arr = listaMap[role]; if (!arr) return;
  var u = arr.find(function(x){ return x.id===id; }); if (!u) return;
  document.getElementById('eu-id').value = id;
  document.getElementById('eu-role').value = role;
  document.getElementById('eu-nome').value = u.nome || '';
  document.getElementById('eu-user').value = u.usuario || '';
  document.getElementById('eu-senha').value = '';
  document.getElementById('eu-err').style.display = 'none';
  var sel = document.getElementById('eu-unidade');
  sel.innerHTML = s.unidades.map(function(un){ return '<option value="'+un.id+'"'+(un.id===u.unidadeId?' selected':'')+'>'+escape(un.nome)+'</option>'; }).join('');
  var extraWrap = document.getElementById('eu-extra-wrap');
  if (role==='psicologa')   extraWrap.innerHTML = '<label class="form-label">CRP</label><input type="text" class="form-control" id="eu-extra" value="'+escape(u.crp||'')+'" placeholder="Ex: 01/12345">';
  else if (role==='instrutor')   extraWrap.innerHTML = '<label class="form-label">Disciplina</label><input type="text" class="form-control" id="eu-extra" value="'+escape(u.disciplina||'')+'" placeholder="Ex: Administração">';
  else if (role==='coordenacao') extraWrap.innerHTML = '<label class="form-label">Setor</label><input type="text" class="form-control" id="eu-extra" value="'+escape(u.setor||'')+'" placeholder="Ex: Coordenação Pedagógica">';
  else if (role==='aluno') extraWrap.innerHTML = '<label class="form-label">Curso</label><input type="text" class="form-control" id="eu-extra" value="'+escape(u.curso||'')+'" placeholder="Ex: Técnico em Informática">';
  else extraWrap.innerHTML = '';
  openModal('modal-edit-user');
}

function salvarUsuario() {
  var id      = document.getElementById('eu-id').value;
  var role    = document.getElementById('eu-role').value;
  var nome    = document.getElementById('eu-nome').value.trim();
  var usuario = document.getElementById('eu-user').value.trim();
  var senha   = document.getElementById('eu-senha').value.trim();
  var unidade = document.getElementById('eu-unidade').value;
  var errEl   = document.getElementById('eu-err');
  errEl.style.display = 'none';
  if (!nome || !usuario || !unidade) { errEl.textContent='Preencha todos os campos obrigatórios.'; errEl.style.display='block'; return; }
  if (senha && senha.length < 8)     { errEl.textContent='Senha deve ter ao menos 8 caracteres.'; errEl.style.display='block'; return; }
  var s = getStore();
  var listaMap = { psicologa:s.psicologos, instrutor:s.instrutores, coordenacao:s.coordenadores, aluno:s.alunos };
  var arr = listaMap[role]; if (!arr) return;
  var u = arr.find(function(x){ return x.id===id; }); if (!u) return;
  var todos = s.psicologos.concat(s.instrutores).concat(s.coordenadores).concat(s.administradores).concat(s.alunos);
  if (todos.find(function(x){ return x.usuario===usuario && x.id!==id; })) {
    errEl.textContent='Nome de usuário já está em uso.'; errEl.style.display='block'; return;
  }
  u.nome = nome; u.usuario = usuario; u.unidadeId = unidade;
  if (senha) u.senha = senha;
  var extraEl = document.getElementById('eu-extra');
  if (extraEl) {
    if (role==='psicologa')   u.crp        = extraEl.value.trim();
    if (role==='instrutor')   u.disciplina = extraEl.value.trim();
    if (role==='coordenacao') u.setor      = extraEl.value.trim();
    if (role==='aluno')       u.curso      = extraEl.value.trim();
  }
  saveStore(s);
  closeModal('modal-edit-user');
  toast('✓ Usuário atualizado com sucesso!', 'success');
  renderUsuarios(); renderDashboard();
}

function excluirUsuario() {
  var id   = document.getElementById('eu-id').value;
  var role = document.getElementById('eu-role').value;
  if (!confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) return;
  var s = getStore();
  if (role==='psicologa')   s.psicologos   = s.psicologos.filter(function(x){ return x.id!==id; });
  if (role==='instrutor')   s.instrutores  = s.instrutores.filter(function(x){ return x.id!==id; });
  if (role==='coordenacao') s.coordenadores= s.coordenadores.filter(function(x){ return x.id!==id; });
  if (role==='aluno')       s.alunos        = s.alunos.filter(function(x){ return x.id!==id; });
  saveStore(s);
  closeModal('modal-edit-user');
  toast('Usuário removido.', 'success');
  renderUsuarios(); renderDashboard();
}

renderDashboard();
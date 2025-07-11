// main.js

import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// Função para trocar abas
function trocarPagina(paginaId) {
  localStorage.setItem('abaAtual', paginaId);
  console.log("Trocando para:", paginaId);
  const abas = document.querySelectorAll('.aba');
  abas.forEach(aba => {
  aba.classList.remove('ativa');
  aba.style.display = 'none';
});

  const novaAba = document.getElementById(paginaId);
if (novaAba) {
  novaAba.style.display = 'flex';
  setTimeout(() => novaAba.classList.add('ativa'), 10);
  }
  document.querySelectorAll('nav button').forEach(btn => {
    btn.classList.toggle('ativo', btn.dataset.target === paginaId);
  });

  if (paginaId === 'pg_historico') {
    carregarHistorico();
  }
}

async function carregarResumoMensal() {
  calcularTotalGastosMensais();
  const db = window.firebaseDb;
  const transacoesRef = collection(db, 'transacoes');
  const snapshot = await getDocs(transacoesRef);

  const agora = new Date();
  const mesAtual = agora.getMonth();
  const anoAtual = agora.getFullYear();

  let totalEntrada = 0;
  let totalSaida = 0;

  snapshot.forEach(doc => {
    const { tipo, valor, dataHora } = doc.data();
    const data = new Date(dataHora);

    if (data.getMonth() === mesAtual && data.getFullYear() === anoAtual) {
      if (tipo === 'entrada') totalEntrada += valor;
      if (tipo === 'saida') totalSaida += valor;
    }
  });

  const nomesMeses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  resumoMensal.innerHTML = `
    <h3 style="font-size: 1.2rem; margin-bottom: 0.8rem;">📅 ${nomesMeses[mesAtual]} de ${anoAtual}</h3>
    <p style="margin-bottom: 0.8rem;">💰 Entradas nesse mês: <strong style="color:lightgreen";>R$ ${totalEntrada.toFixed(2)}</strong></p>
    <p style="margin-bottom: 0.8rem;">💸 Saídas nesse mês: <strong style="color:salmon">R$ ${totalSaida.toFixed(2)}</strong></p>
  `;
  // Container para a soma dos gastos mensais (fixos + parcelados mensais)
const resumoGastos = document.createElement('p');
resumoGastos.id = 'resumoGastosTotais';
resumoGastos.style.marginTop = '1rem';
resumoGastos.style.color = '#C7CFD9';
resumoGastos.style.fontSize = '1rem';
resumoGastos.style.textAlign = 'center';
resumoMensal.appendChild(resumoGastos);

async function calcularTotalGastosMensais() {
  const db = window.firebaseDb;
  let totalFixos = 0;
  let totalParcelasMensais = 0;

  // Fixos
  const snapFixos = await getDocs(collection(db, 'gastosFixos'));
  snapFixos.forEach(doc => {
    const { valor } = doc.data();
    totalFixos += valor;
  });

  // Parcelados
  const snapParcelados = await getDocs(collection(db, 'parcelados'));
  snapParcelados.forEach(doc => {
    const { valor, parcelas } = doc.data();
    const valorParcela = valor / parcelas;
    totalParcelasMensais += valorParcela;
  });

  const totalGeral = totalFixos + totalParcelasMensais;

  const box = document.getElementById('resumoGastosTotais');
  if (box) {
    box.innerText = `💵 Gastos Fixos: R$ ${totalGeral.toFixed(2)}`;
  }
}

}


async function carregarHistorico() {
  const historico = document.getElementById('pg_historico');
  historico.innerHTML = '<h2>Histórico</h2><p>Carregando movimentações...</p>';

  try {
    const db = window.firebaseDb;
    const transacoesRef = collection(db, 'transacoes');
    const q = query(transacoesRef, orderBy('dataHora', 'desc'));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      historico.innerHTML = '<h2>Histórico</h2><p>Nenhuma transação encontrada.</p>';
      return;
    }

    let html = `
      <h2 style="font-size: 1.5rem; margin-bottom: 1rem;">Histórico</h2>
      <ul style="list-style: none; padding: 0; width: 100%; max-width: 500px; display: flex; flex-direction: column; gap: 1rem;">
    `;

    snapshot.forEach(doc => {
      const { valor, motivo, dataHora, tipo } = doc.data();
      const data = new Date(dataHora);
      const cor = tipo === 'entrada' ? '#68798D' : '#ffd6d6';
      html += `
        <li style="background:${cor}; padding: 1.2rem; border-radius: 8px; font-size: 1rem; color: #05080D; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
          <strong style="display: block; font-size: 1.1rem;">${tipo.toUpperCase()}</strong>
          <span>R$ ${valor.toFixed(2)}</span><br/>
          <span>${motivo}</span><br/>
          <small>${data.toLocaleString('pt-BR')}</small>
        </li>
      `;
    });

    html += '</ul>';
    historico.innerHTML = html;
  } catch (error) {
    console.error('Erro ao carregar histórico:', error);
    historico.innerHTML = '<h2>Histórico</h2><p>Erro ao carregar movimentações.</p>';
  }
}

// Inicializa a navegação e adiciona eventos aos botões
function initNavegacao() {
  const botoes = document.querySelectorAll('nav button');
  console.log("Botões encontrados:", botoes.length);
  botoes.forEach(btn => {
    console.log("Botão com data-target:", btn.dataset.target);
    btn.addEventListener('click', () => trocarPagina(btn.dataset.target));
  });

  // Aplica conteúdo e estilos iniciais nas abas
  const principal = document.getElementById('pg_principal');
  const historico = document.getElementById('pg_historico');
  const fixos = document.getElementById('pg_fixos');

  if (principal) {
    principal.style.flexDirection = 'column';
    principal.style.alignItems = 'center';
    principal.style.justifyContent = 'center';
    principal.style.padding = '2rem';
    // Container para exibir o resumo do mês
const resumoMensal = document.createElement('div');
resumoMensal.id = 'resumoMensal';
resumoMensal.style.marginBottom = '0.8rem';
resumoMensal.style.textAlign = 'center';
resumoMensal.style.color = '#C7CFD9';

    principal.innerHTML = `
      <h2 style="font-size: 2rem; margin-bottom: 1rem; margin-top: 1rem;">Entradas - Saídas</h2>
      <form id="formTransacao" style="display: flex; flex-direction: column; align-items: center; gap: 1rem; width: 100%; max-width: 400px;">
        <div style="width: 100%;">
          <label style="font-weight: bold;">Valor:</label><br>
          <input type="number" step="any" id="inputValor" placeholder="R$ 0,00" required style="width: 100%; padding: 0.75rem; border-radius: 8px; border: 1px solid #C7CFD9; background-color: #131925; color: #C7CFD9;">
        </div>

        <div style="width: 100%;">
          <label style="font-weight: bold;">Motivo:</label><br>
          <input type="text" id="inputMotivo" placeholder="Ex: Salário, Conta de Luz" required style="width: 100%; padding: 0.75rem; border-radius: 8px; border: 1px solid #C7CFD9; background-color: #131925; color: #C7CFD9;">
        </div>

        <div style="width: 100%;">
          <label style="font-weight: bold;">Data e Hora:</label><br>
          <input type="datetime-local" id="inputDataHora" required style="width: 100%; padding: 0.75rem; border-radius: 8px; border: 1px solid #C7CFD9; background-color: #131925; color: #C7CFD9;">
        </div>

        <div style="width: 100%;">
          <label style="font-weight: bold;">Tipo:</label><br>
          <select id="inputTipo" required style="width: 100%; padding: 0.75rem; border-radius: 8px; border: 1px solid #C7CFD9; background-color: #131925; color: #C7CFD9;">
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
          </select>
        </div>

        <button type="submit" style="margin-top: 1rem; padding: 0.75rem 1.5rem; border-radius: 8px; border: none; background-color: #3F4B59; color: #C7CFD9; font-size: 1rem; cursor: pointer;">Enviar</button>
      </form>
    `;
principal.prepend(resumoMensal);
carregarResumoMensal();

    // Após inserir o formulário no DOM, adiciona o event listener
    setTimeout(() => {
      const form = document.getElementById('formTransacao');
      if (form) {
        form.addEventListener('submit', async (e) => {
          e.preventDefault();

          const valor = parseFloat(document.getElementById('inputValor').value);
          const motivo = document.getElementById('inputMotivo').value.trim();
          const dataHora = document.getElementById('inputDataHora').value;
          const tipo = document.getElementById('inputTipo').value;

          if (!valor || !motivo || !dataHora || !tipo) {
            alert('Preencha todos os campos corretamente.');
            return;
          }

          try {
            const db = window.firebaseDb;
            const transacoesRef = collection(db, 'transacoes');

            await addDoc(transacoesRef, {
              valor,
              motivo,
              dataHora,
              tipo,
              criadoEm: serverTimestamp()
            });

            alert('Transação salva com sucesso!');
            form.reset();
          } catch (error) {
            console.error('Erro ao salvar:', error);
            alert('Erro ao salvar transação.');
          }
        });
      }
    }, 100);
  }

  if (historico) {
    historico.style.color = '#C7CFD9';
    historico.style.flexDirection = 'column';
    historico.style.alignItems = 'center';
    historico.style.justifyContent = 'flex-start';
    historico.style.padding = '2rem';
  }

  if (fixos) {
    fixos.style.flexDirection = 'column';
    fixos.style.alignItems = 'center';
    fixos.style.justifyContent = 'flex-start';
    fixos.style.padding = '2rem';
    fixos.innerHTML = `
  <h2 style="font-size: 1.5rem; margin-bottom: 0.5rem; color: #f0f8ff;">📌 Gastos Fixos</h2>
  <p id="totalFixos" style="color:#C7CFD9; margin-bottom: 1.5rem;"></p>

  <form id="formFixos" style="display: flex; flex-direction: column; align-items: center; gap: 1rem; width: 100%; max-width: 400px; margin-bottom: 2rem;">
    <div style="width: 100%;">
      <label>Nome do Gasto:</label><br>
      <input type="text" id="fixoNome" required style="width: 100%; padding: 0.75rem; border-radius: 8px; border: 1px solid #C7CFD9; background-color: #131925; color: #C7CFD9;">
    </div>
    <div style="width: 100%;">
      <label>Valor Mensal:</label><br>
      <input type="number" id="fixoValor" step="any" required style="width: 100%; padding: 0.75rem; border-radius: 8px; border: 1px solid #C7CFD9; background-color: #131925; color: #C7CFD9;">
    </div>
    <div style="width: 100%;">
      <label>Dia do Vencimento:</label><br>
      <input type="number" id="fixoVencimento" required min="1" max="31" style="width: 100%; padding: 0.75rem; border-radius: 8px; border: 1px solid #C7CFD9; background-color: #131925; color: #C7CFD9;">
    </div>
    <div style="width: 100%;">
      <label>Tipo de Pagamento:</label><br>
      <input type="text" id="fixoPagamento" required style="width: 100%; padding: 0.75rem; border-radius: 8px; border: 1px solid #C7CFD9; background-color: #131925; color: #C7CFD9;">
    </div>
    <button type="submit" style="margin-top: 1rem; padding: 0.75rem 1.5rem; border-radius: 8px; border: none; background-color: #3F4B59; color: #C7CFD9; font-size: 1rem; cursor: pointer;">Salvar Fixo</button>
  </form>

  <h2 style="font-size: 1.5rem; margin: 2rem 0 0.5rem; color: #f0f8ff;">📦 Compras Parceladas</h2>
  <p id="totalParcelados" style="color:#C7CFD9; margin-bottom: 1.5rem;"></p>

  <form id="formParcelado" style="display: flex; flex-direction: column; align-items: center; gap: 1rem; width: 100%; max-width: 400px;">
    <div style="width: 100%;">
      <label>Descrição da Compra:</label><br>
      <input type="text" id="parceladoDescricao" required style="width: 100%; padding: 0.75rem; border-radius: 8px; border: 1px solid #C7CFD9; background-color: #131925; color: #C7CFD9;">
    </div>
    <div style="width: 100%;">
      <label>Valor Total:</label><br>
      <input type="number" id="parceladoValor" step="any" required style="width: 100%; padding: 0.75rem; border-radius: 8px; border: 1px solid #C7CFD9; background-color: #131925; color: #C7CFD9;">
    </div>
    <div style="width: 100%;">
      <label>Número de Parcelas:</label><br>
      <input type="number" id="parceladoParcelas" required style="width: 100%; padding: 0.75rem; border-radius: 8px; border: 1px solid #C7CFD9; background-color: #131925; color: #C7CFD9;">
    </div>
    <div style="width: 100%;">
      <label>Data da Compra:</label><br>
      <input type="date" id="parceladoData" required style="width: 100%; padding: 0.75rem; border-radius: 8px; border: 1px solid #C7CFD9; background-color: #131925; color: #C7CFD9;">
    </div>
    <div style="width: 100%;">
      <label>Dia de Vencimento:</label><br>
      <input type="number" id="parceladoVencimento" required min="1" max="31" style="width: 100%; padding: 0.75rem; border-radius: 8px; border: 1px solid #C7CFD9; background-color: #131925; color: #C7CFD9;">
    </div>
    <button type="submit" style="margin-top: 1rem; padding: 0.75rem 1.5rem; border-radius: 8px; border: none; background-color: #3F4B59; color: #C7CFD9; font-size: 1rem; cursor: pointer;">Salvar Parcelado</button>
  </form>
`;


const totalGeralBox = document.createElement('div');
totalGeralBox.id = 'totalGeral';
totalGeralBox.style.marginTop = '3rem';
totalGeralBox.style.marginBottom = '0rem';
totalGeralBox.style.color = '#C7CFD9';
totalGeralBox.style.fontSize = '1.1rem';
totalGeralBox.style.textAlign = 'center';
fixos.appendChild(totalGeralBox);

    // Container para exibir os dados
const listaFixos = document.createElement('div');
listaFixos.id = 'listaFixos';
listaFixos.style.marginTop = '3rem';
listaFixos.style.width = '100%';
listaFixos.style.maxWidth = '500px';

const listaParcelados = document.createElement('div');
listaParcelados.id = 'listaParcelados';
listaParcelados.style.marginTop = '3rem';
listaParcelados.style.width = '100%';
listaParcelados.style.maxWidth = '500px';

fixos.appendChild(listaFixos);
fixos.appendChild(listaParcelados);

// Função para carregar os dados do Firestore
async function carregarFixosEParcelados() {
  const db = window.firebaseDb;

  let totalFixos = 0;
  let totalParceladosMensal = 0;

  // GASTOS FIXOS
  try {
    const fixosRef = collection(db, 'gastosFixos');
    const snapFixos = await getDocs(query(fixosRef, orderBy('criadoEm', 'desc')));

    let htmlFixos = `<h3 style="color: #C7CFD9; margin-bottom: 0.5rem;">📌 Gastos Fixos</h3>`;
    if (snapFixos.empty) {
      htmlFixos += '<p style="color:#C7CFD9;">Nenhum gasto fixo cadastrado.</p>';
    } else {
      htmlFixos += '<ul style="display: flex; flex-direction: column; gap: 1rem;">';
      snapFixos.forEach(doc => {
        const { nome, valor, vencimento, tipo } = doc.data();
        totalFixos += valor;
        htmlFixos += `
          <li style="background:#3F4B59; padding:1rem; border-radius:8px; color:#f0f8ff;">
            <strong>${nome}</strong><br>
            Valor: R$ ${valor.toFixed(2)}<br>
            Vencimento: dia ${vencimento}<br>
            Pagamento: ${tipo}
          </li>
        `;
      });
      htmlFixos += '</ul>';
    }

    const elTotalFixos = document.getElementById('totalFixos');
    if (elTotalFixos) {
      elTotalFixos.innerText = `Total: R$ ${totalFixos.toFixed(2)}`;
    }

    listaFixos.innerHTML = htmlFixos;
  } catch (e) {
    listaFixos.innerHTML = '<p style="color:tomato;">Erro ao carregar gastos fixos.</p>';
  }

  // PARCELADOS (mensal)
  try {
    const parceladosRef = collection(db, 'parcelados');
    const snapParcelados = await getDocs(query(parceladosRef, orderBy('criadoEm', 'desc')));

    let htmlParcelados = `<h3 style="color: #C7CFD9; margin-top: 2rem; margin-bottom: 0.5rem;">🧾 Parcelamentos</h3>`;
    if (snapParcelados.empty) {
      htmlParcelados += '<p style="color:#C7CFD9;">Nenhuma compra parcelada cadastrada.</p>';
    } else {
      htmlParcelados += '<ul style="display: flex; flex-direction: column; gap: 1rem;">';
      snapParcelados.forEach(doc => {
        const { descricao, valor, parcelas, dataCompra, vencimento } = doc.data();

        const valorParcela = valor / parcelas;
        totalParceladosMensal += valorParcela;

        htmlParcelados += `
          <li style="background:#3F4B59; padding:1rem; border-radius:8px; color:#f0f8ff;">
            <strong>${descricao}</strong><br>
            Valor Total: R$ ${valor.toFixed(2)}<br>
            Parcelas: ${parcelas}x de R$ ${valorParcela.toFixed(2)}<br>
            Data da Compra: ${new Date(dataCompra).toLocaleDateString('pt-BR')}<br>
            Vencimento: dia ${vencimento}
          </li>
        `;
      });
      htmlParcelados += '</ul>';
    }

    const elTotalParcelados = document.getElementById('totalParcelados');
    if (elTotalParcelados) {
      elTotalParcelados.innerText = `Total mensal: R$ ${totalParceladosMensal.toFixed(2)}`;
    }

    listaParcelados.innerHTML = htmlParcelados;

    const elGeral = document.getElementById('totalGeral');
    if (elGeral) {
      const totalGeral = totalFixos + totalParceladosMensal;
      elGeral.innerText = `💵 Soma Total dos Gastos Mensais: R$ ${totalGeral.toFixed(2)}`;
    }

  } catch (e) {
    listaParcelados.innerHTML = '<p style="color:tomato;">Erro ao carregar parcelamentos.</p>';
  }
}


// Chamar após um pequeno delay para garantir renderização
setTimeout(() => {
  carregarFixosEParcelados();
}, 300);

    // Listeners para formulário de fixos
    setTimeout(() => {
      const formFixos = document.getElementById('formFixos');
      const formParcelado = document.getElementById('formParcelado');
      if (formFixos) {
        formFixos.addEventListener('submit', async (e) => {
          e.preventDefault();
          const db = window.firebaseDb;
          const docRef = collection(db, 'gastosFixos');
          const nome = document.getElementById('fixoNome').value;
          const valor = parseFloat(document.getElementById('fixoValor').value);
          const vencimento = parseInt(document.getElementById('fixoVencimento').value);
          const tipo = document.getElementById('fixoPagamento').value;
          await addDoc(docRef, { nome, valor, vencimento, tipo, criadoEm: serverTimestamp() });
          alert('Gasto fixo salvo com sucesso!');
          formFixos.reset();
        });
      }
      if (formParcelado) {
        formParcelado.addEventListener('submit', async (e) => {
          e.preventDefault();
          const db = window.firebaseDb;
          const docRef = collection(db, 'parcelados');
          const descricao = document.getElementById('parceladoDescricao').value;
          const valor = parseFloat(document.getElementById('parceladoValor').value);
          const parcelas = parseInt(document.getElementById('parceladoParcelas').value);
          const dataCompra = document.getElementById('parceladoData').value;
          const vencimento = parseInt(document.getElementById('parceladoVencimento').value);
          await addDoc(docRef, { descricao, valor, parcelas, dataCompra, vencimento, criadoEm: serverTimestamp() });
          alert('Compra parcelada salva com sucesso!');
          formParcelado.reset();
        });
      }
    }, 100);
  }

  
}


document.addEventListener('DOMContentLoaded', () => {
  initNavegacao();
  const abaSalva = localStorage.getItem('abaAtual') || 'pg_principal';
  trocarPagina(abaSalva);
  document.querySelectorAll('input').forEach(input => {
  input.setAttribute('autocomplete', 'off');
});

});

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('consultaForm');
    const cnpjInput = document.getElementById('cnpj');
    const resultadoDiv = document.getElementById('resultado');
    const dadosEmpresaDiv = document.getElementById('dadosEmpresa');
    const erroDiv = document.getElementById('erro');

    // Máscara para o campo CNPJ
    cnpjInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length <= 14) {
            value = value.replace(/^(\d{2})(\d)/, '$1.$2');
            value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
            value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
            value = value.replace(/(\d{4})(\d)/, '$1-$2');
            e.target.value = value;
        }
    });

    // Previne o recarregamento da página no submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        buscarCNPJ();
    });

    // Função principal de busca do CNPJ
    async function buscarCNPJ() {
        const cnpj = cnpjInput.value.replace(/[^\d]+/g, '');

        if (cnpj.length !== 14) {
            mostrarErro('CNPJ inválido. Por favor, insira um CNPJ válido com 14 dígitos.');
            return;
        }

        mostrarCarregando();

        try {
            const url = `https://cors-anywhere.herokuapp.com/https://receitaws.com.br/v1/cnpj/${cnpj}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.status === 'ERROR') {
                throw new Error(data.message || 'Erro ao consultar CNPJ');
            }

            mostrarResultado(data);
        } catch (error) {
            console.error('Erro na consulta:', error);
            mostrarErro(`Erro na consulta: ${error.message}`);
        } finally {
            form.classList.remove('loading');
        }
    }

    function mostrarResultado(data) {
        dadosEmpresaDiv.innerHTML = `
            <div class="info-row">
                <div class="info-label">Razão Social</div>
                <div class="info-value">${data.nome || 'Não informado'}</div>
            </div>
            <div class="info-row">
                <div class="info-label">CNPJ</div>
                <div class="info-value">${data.cnpj || 'Não informado'}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Nome Fantasia</div>
                <div class="info-value">${data.fantasia || 'Não informado'}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Situação</div>
                <div class="info-value">${data.situacao || 'Não informado'}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Atividade Principal</div>
                <div class="info-value">${data.atividade_principal?.[0]?.text || 'Não informado'}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Endereço</div>
                <div class="info-value">
                    ${data.logradouro || ''}, ${data.numero || ''} ${data.complemento ? '- ' + data.complemento : ''}
                    <br>${data.bairro || ''} - ${data.municipio || ''} / ${data.uf || ''}
                    <br>CEP: ${data.cep || 'Não informado'}
                </div>
            </div>
        `;
        
        resultadoDiv.style.display = 'block';
        erroDiv.style.display = 'none';
    }

    function mostrarErro(mensagem) {
        erroDiv.textContent = mensagem;
        erroDiv.style.display = 'block';
        resultadoDiv.style.display = 'none';
    }

    function mostrarCarregando() {
        form.classList.add('loading');
        erroDiv.style.display = 'none';
        resultadoDiv.style.display = 'none';
    }
});
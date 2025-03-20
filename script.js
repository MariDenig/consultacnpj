document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('consultaForm');
    const cnpjInput = document.getElementById('cnpj');
    const resultadoDiv = document.getElementById('resultado');
    const dadosEmpresaDiv = document.getElementById('dadosEmpresa');
    const erroDiv = document.getElementById('erro');

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

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        buscarCNPJ();
    });

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
                switch (response.status) {
                    case 400:
                        throw new Error('Solicitação inválida. Verifique o CNPJ informado.');
                    case 403:
                        throw new Error('Acesso negado. O serviço pode estar bloqueado.');
                    case 404:
                        throw new Error('CNPJ não encontrado. Verifique se o número está correto.');
                    case 429:
                        throw new Error('Muitas requisições em um curto período. Tente novamente mais tarde.');
                    case 500:
                        throw new Error('Erro interno do servidor. Tente novamente mais tarde.');
                    default:
                        throw new Error(`Erro inesperado (${response.status}). Tente novamente mais tarde.`);
                }
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

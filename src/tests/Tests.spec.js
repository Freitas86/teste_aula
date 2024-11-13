import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

// Métrica personalizada para rastrear o tempo de resposta das requisições GET.
export const getContactsDuration = new Trend('get_contacts', true);

// Configurações de thresholds.
export const options = {
  thresholds: {
    http_req_failed: ['rate<0.01'], // Menos de 1% de falhas nas requisições.
    http_req_duration: ['avg<10000'] // Duração média das requisições inferior a 10 segundos.
  }
};

// Função para gerar o resumo do teste ao final.
export function handleSummary(data) {
  return {
    './src/output/index.html': htmlReport(data) // Geração do relatório em HTML.
  };
}

// Função principal que será executada a cada virtual user.
export default function () {
  const baseUrl = 'https://test.k6.io/';

  const params = {
    headers: {
      'Content-Type': 'application/json' // Cabeçalho Content-Type.
    }
  };

  const OK = 200; // Status HTTP esperado.

  // Realizando a requisição GET.
  const res = http.get(`${baseUrl}`, params);

  // Adicionando o tempo de resposta da requisição à métrica personalizada.
  getContactsDuration.add(res.timings.duration);

  // Verificando o status da resposta.
  check(res, {
    'Status é 200': () => res.status === OK,
    'Duração da requisição é abaixo de 10 segundos': () =>
      res.timings.duration < 10000,
    'Cabeçalho Content-Type é application/json': () =>
      res.headers['Content-Type'] === 'application/json; charset=utf-8'
  });

  // Simulando o "tempo de reflexão" entre as requisições, com base em uma variável de ambiente.
  sleep(1); // Pausa de 1 segundo entre as requisições (simulando comportamento real de usuário).
}

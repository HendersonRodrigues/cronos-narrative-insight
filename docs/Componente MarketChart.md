Documentação Técnica: Componente MarketChart
1. Objetivo da Atualização
Otimizar a visualização de séries temporais de longo prazo (até 10 anos) e garantir a precisão dos dados para ativos com diferentes periodicidades (diários, mensais e trimestrais), corrigindo falhas de filtragem de datas futuras.

2. Arquitetura de Dados (Lazy Loading & Buffer)
Anteriormente, o gráfico dependia de um "feed global" limitado, o que impedia a visualização de históricos profundos. A nova arquitetura utiliza:

Snapshot Inicial: Carregamento leve de apenas os últimos pontos para os cards da Home.

Lazy Loading (On-Demand): Ao selecionar um ativo e um período longo, o sistema dispara o hook useAssetHistory.

Buffer de Memória: Implementação de cache via TanStack Query que armazena o histórico completo do ativo em memória. Transições entre períodos (1M para 10Y) ou retorno a ativos já visualizados ocorrem de forma instantânea, sem novas requisições ao banco.

3. Lógica de Processamento de Série Temporal
Para garantir que o gráfico seja "certeiro", o processamento de dados segue três regras críticas:

Ancoragem no Presente: O ponto final do gráfico é dinâmico. Ele identifica o último registro real, mas limita-se à data atual (now), filtrando automaticamente projeções futuras (ex: Selic Futuro) da linha principal.

Downsampling Dinâmico: Se o intervalo selecionado contiver mais de 150 pontos, o sistema calcula um step (passo) para reduzir a densidade de dados enviada ao Recharts. Isso mantém o gráfico fluido e evita o travamento do navegador em períodos de 10 anos.

Resiliência de Periodicidade: A lógica detecta automaticamente se o ativo é esparso (como o PIB trimestral). Se o total de pontos for baixo, o sistema desativa o downsampling para preservar cada detalhe disponível.

4. Tratamento de Lacunas e Feedback (UX)
Implementação de um sistema de "Aviso de Dados Limitados" (Elegance Alert):

O componente calcula a diferença entre a data solicitada (ex: 10 anos atrás) e o primeiro registro real disponível no banco.

Caso o histórico seja menor que o solicitado, um banner informativo é exibido: "Limite de dados atingido: histórico disponível desde [Data] ([X] anos)".

5. Especificações da Interface
Intervalos Disponíveis: 1M, 6M, 1Y, 3Y, 5Y, 10Y. (Intervalo 3M removido para simplificação).

Visualização: Linha do tipo monotone com gradiente dinâmico.

Eixo X: Formatador inteligente que exibe apenas MM/AAAA para períodos superiores a 1 ano, reduzindo a poluição visual.

Nota de Integração: Esta implementação está vinculada à alteração no hook useMarketFeed, que agora suporta buscas individuais por asset_id sem os limites restritivos da query global anterior.

# Hipatec — frontend

Aplicativo web da Hipatec em **Angular 20, Ionic 8 e Capacitor 8**. Repositório da organização: [hipatec/hipatec-app](https://github.com/hipatec/hipatec-app). A API Java/Spring fica em [hipatec/hipatec](https://github.com/hipatec/hipatec); frontend e backend são executados separadamente.

## Executar localmente

Use Node.js 22.12 ou superior da linha 22 e npm. Não é necessário instalar Angular CLI ou Ionic CLI globalmente. Instale as versões fixadas pelo `package-lock.json`:

```bash
npm ci
npm start -- --port 8100
```

Abra <http://localhost:8100/>. A apresentação pública funciona sem API; cadastro, login, perfis, posts e mentorias dependem do backend configurado.

A porta **8100** corresponde à origem permitida pelo CORS dos controllers de estudantes, mentoras, perfil e mentorias. `npm start` sem a opção de porta normalmente usa 4200.

## Configuração da API

A URL atual é `http://localhost:8080/`, definida em:

- [environment.ts](src/environments/environment.ts): desenvolvimento.
- [environment.prod.ts](src/environments/environment.prod.ts): produção.

Mantenha a barra final, pois os serviços concatenam os caminhos diretamente. O ambiente de produção ainda aponta para localhost e precisa ser configurado antes de publicar a aplicação. Credenciais privadas não devem ficar no frontend.

Para executar o backend, consulte o README de `hipatec/hipatec`: a base examinada depende de SQL Server, procedimentos SQL de login e configurações Firebase/Cloudinary. A presença dos endpoints no código não garante que o ambiente de integração esteja pronto.

## Rotas

| Rota | Tela |
| --- | --- |
| `/` | Apresentação pública da Hipatec |
| `/home` | Feed existente, também destino após login |
| `/login` | Login de estudante ou mentora |
| `/forgot-password` | Solicitação de recuperação integrada ao backend |
| `/redefinir-senha` | Definição da nova senha pelo link recebido |
| `/cadastro` | Cadastro |
| `/profile` | Perfil |
| `/mentorias` | Listagem inicial de mentorias |
| `/mentorias/cadastro` | Cadastro inicial de mentoria |
| `/comunidade` | Experimento de comunidade externa em iframe |

## Organização

- [src/app/app.routes.ts](src/app/app.routes.ts): rotas e carregamento das páginas.
- `src/app/pages/apresentacao/`: apresentação pública, independente dos serviços HTTP.
- `src/app/pages/home/`: feed; outras pastas em `pages/` contêm as demais telas.
- `src/app/components/`: navbar e modais de post, comentário e perfil.
- `src/app/services/`: chamadas HTTP e estruturas usadas na integração.
- `src/assets/`: logotipos e imagens.
- `src/global.scss`: estilos compartilhados do Ionic; páginas mantêm seus estilos locais.
- `capacitor.config.ts`: configuração do Capacitor; não há projetos Android/iOS versionados nesta base.

## Apresentação pública recuperada

A referência visual é a página `src/app/home/home.page.*` da branch `lucca-frontend`, commit `db8b1503f8f88bf164ecba7883c2c02ab9a4a672`, preservada na revisão anterior do projeto.

A recuperação mantém a identidade roxa/amarela, a chamada principal e as seções sobre, mentorias e comunidade. Fica em `pages/apresentacao/`, na raiz `/`, enquanto o feed continua em `/home`. A referência de `/home` foi corrigida para o arquivo existente em `pages/home/`.

Pessoas e números demonstrativos estão identificados como fictícios. Os temas de mentorias são exemplos da proposta, sem agenda ou inscrições fictícias. A apresentação não anuncia ofertas de vagas que ainda não foram implementadas; o painel permanece Should Have no MoSCoW original. Não foram incorporados os serviços simulados nem a autenticação alternativa da branch antiga.

A página tem menu adaptado para celular, fechamento por Escape e navegação pelas seções com foco no destino. A seção Comunidade da apresentação aponta para o feed existente; a rota experimental `/comunidade` permanece separada.

## O que existe e o que falta

| Área | Estado observado no código |
| --- | --- |
| Apresentação | Página pública sem dependência de API |
| Cadastro/login | Chamadas HTTP; identificação da usuária armazenada no navegador após retorno de ID |
| Recuperação de senha | Solicitação por e-mail, nova senha e integração com endpoints `/auth` |
| Perfil | Consulta e edição via serviços HTTP |
| Feed | Consulta/criação de posts; curtidas locais e comentários ainda sem fluxo completo de persistência na interface |
| Mentorias | Listagem/cadastro iniciais; inscrições, agenda e gravações ainda não implementadas |
| Comunidade externa | Página experimental que abre serviço WordPress/Fluent Community em iframe |
| Aprovação e permissões | Sem guards de rota; identificação local não equivale a sessão autenticada e autorizada |

A comunidade externa monta a URL do iframe com `userEmail` do localStorage e uma chave fixa no próprio frontend. O fluxo de login atual não grava `userEmail`. Esse mecanismo demonstrativo precisa ser revisado antes de servir como autenticação real: valores públicos do navegador não comprovam identidade ou aprovação de acesso. O funcionamento e as permissões do serviço externo não foram validados nesta revisão.

## Escopo do piloto

Entrega prevista para **27/11/2026**: MVP funcional, testes com usuárias e Relatório Final. A referência é a classificação original do MoSCoW de 31/07/2026, restaurada pelo grupo:

| Prioridade | Funcionalidades |
| --- | --- |
| Must Have | Autenticação segura; criação, visualização e inscrição em mentorias; cursos básicos; perfis personalizáveis; feed básico; moderação básica |
| Should Have | Curtir, comentar e compartilhar; denúncias; painel básico de vagas afirmativas; exclusão de conta |
| Could Have | Onboarding; avaliações; habilidades no perfil; notificações; downloads offline |
| Won't Have | Currículo automático; temas/personalização da experiência; chat em tempo real individual/em grupo; recomendação avançada com ML |

Essa classificação descreve a meta, não funcionalidades já concluídas. O planejamento semanal está sendo revisto com capacidade informada de 2 horas por integrante por semana. Detalhes e decisões de implementação precisam de validação do grupo.

## Verificações

```bash
npm run build
npm run build -- --configuration development
npm test -- --watch=false --browsers=ChromeHeadless --include='src/app/pages/apresentacao/apresentacao.page.spec.ts'
npm test -- --watch=false --browsers=ChromeHeadless
npm run lint
```

O build gera `www/`. Karma precisa de Chrome/Chromium; configure `CHROME_BIN` se necessário. Os testes da apresentação verificam menu, teclado/foco e separação entre apresentação e feed. Eles não atestam os fluxos completos da aplicação.

A base possui problemas herdados nos testes e no lint. Os estilos existentes do feed e do perfil também ultrapassam o limite de erro de 4 kB do build de produção; a recuperação da apresentação não altera esses arquivos nem aumenta o orçamento configurado. A configuração de desenvolvimento não aplica esse limite, mas sua compilação não substitui a validação de produção.

Para revisar manualmente, abra `/` em computador e celular, use o menu, Escape e os links das seções; confira os exemplos identificados e os links para login, cadastro e feed. Operações com dados devem ser verificadas com a API configurada e dados de teste.

## Recuperação de senha

A tela `forgot-password` usa como base o visual da main (`6b71d8a`), agora integrada aos endpoints reais de recuperação e redefinição. O login permanece igual ao da main. A implementação antiga do fork não foi restaurada.

A solicitação envia apenas o e-mail. O backend procura nos dois perfis e só gera link se encontrar exatamente uma conta; a tela não exige escolher estudante ou mentora. A confirmação aparece apenas após o backend aceitar a solicitação. Ao entrar na tela, `ionViewWillEnter` limpa os dados e o estado de confirmação; ao sair, a requisição pendente é cancelada para evitar que sua resposta altere uma próxima visita. A confirmação não comprova entrega do e-mail nem existência da conta.

O link do e-mail abre `/redefinir-senha#token=...`, usando a mesma identidade visual para informar e confirmar a nova senha. O fragmento é removido da barra e o token é enviado no corpo do POST. São tratados erros de conexão, limite de tentativas, senha inválida e link expirado ou já utilizado.

```bash
npm test -- --watch=false --browsers=ChromeHeadless --include='src/app/pages/forgot-password/*.spec.ts'
```

Seis testes de interação passaram, incluindo reentrada na tela e cancelamento do pedido ao sair. A compilação de desenvolvimento também passou. O ambiente local e os provedores de e-mail são configurados no backend; consulte seu README.

## Trabalho em equipe

Nathalia é a representante do grupo e trabalha no backend. Thiago trabalha no frontend. Lucca auxilia na organização, documentação, testes e apoio técnico; não decide sozinho o escopo ou as prioridades. As decisões finais devem ser validadas pelo grupo.

Crie uma branch, mantenha mudanças pequenas e descreva no PR o comportamento alterado, como testar e as limitações. Não versione `node_modules/`, `www/`, credenciais ou dados de participantes. Atualize o README quando mudar rotas, comandos ou integração.

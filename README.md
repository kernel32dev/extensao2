Extensão 2.0
---

A versão 2.0 do projeto de extensão

### Instalando

Primeiro [instale o node](https://nodejs.org/en/download) se não já tiver instalado,

e execute `npm install` para instalar os pacotes

### Executando

Para executar o servidor rode `npm run watch`, já que é watch, você não precisa reiniciar o servidor para ver suas mudanças, bastar recarregar a página

Caso queira apenas executar e queira servir arquivos otimizados e minificados, considere executar `npm run serve:prod` que executa o serviço em produção

Quando executando, a página estará disponível em http://127.0.0.1:8080/

### Design

Isso é um site com backend que serve os arquivos e faz a lógica do servidor e um frontend que dá uma interface para que o usuário possa falar com o servidor

#### Frontend

O frontend usa uma biblioteca chamada **Levi** que te ajuda a criar elementos e atualizar eles, apesar de usarmos arquivos `.tsx` esse projeto não usa React

Já que usamos **typescript**, precisamos compilar-lo em **javascript**, para isso usamos **Babel** para compilar em javascript, e **Webpack** para juntar os vários arquivos em apenas `script.js` e `style.css`

#### Backend

O backend é um servidor http comum, ele serve três arquivos estáticos: `index.html`, `script.js` e `style.css`, e também oferece uma api **Websocket** para todo a lógica

Websocket foi usado pois permite que o servidor atualize o cliente com mais informações em tempo real

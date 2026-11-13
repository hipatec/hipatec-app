const fs=require('fs'),assert=require('assert'),crypto=require('crypto'),cp=require('child_process');
const WebSocket=require(process.cwd()+'/node_modules/ws');
const dir=process.env.HIPATEC_TEST_SCRATCH || __dirname, base='http://localhost:14286', api='http://127.0.0.1:18086';
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function account(role) {
 const suffix=crypto.randomUUID().replaceAll('-','').slice(0,10), email=`ui-${suffix}@example.test`, password=crypto.randomBytes(18).toString('base64url')+'aA1!';
 const jar=new Map();
 async function request(method,path,data) {
  let token;
  if(method!=='GET') token=await request('GET','/auth/csrf');
  const response=await fetch(api+path,{method,headers:{'Content-Type':'application/json',Cookie:[...jar].map(([k,v])=>`${k}=${v}`).join('; '),...(token?{[token.headerName]:token.token}:{})},body:data===undefined?undefined:JSON.stringify(data)});
  for(const line of response.headers.getSetCookie()){const [pair]=line.split(';'),i=pair.indexOf('=');jar.set(pair.slice(0,i),pair.slice(i+1));}
  assert(response.ok,`seed/read API ${method} ${path}: ${response.status}`);const raw=await response.text();return raw?JSON.parse(raw):null;
 }
 await request('POST','/'+role,{nome:'Pessoa sintética UI',usuario:'ui'+suffix,email,senha:password,dataNascimento:'1995-01-01'});
 if(role==='mentoras') cp.execFileSync('docker',['exec','hipatec-real-pg-161513','psql','-U','postgres','-d','hipatec_test','-v','ON_ERROR_STOP=1','-c',`UPDATE mentora SET aprovada=true WHERE email='${email}'`],{stdio:'ignore'});
 await request('POST','/auth/login',{role,email,senha:password});
 return {role,email,password,request};
}
(async()=>{
 const student=await account('estudantes'),mentor=await account('mentoras');
 const port=fs.readFileSync(dir+'/chrome/DevToolsActivePort','utf8').split('\n')[0];
 const tabs=await(await fetch('http://127.0.0.1:'+port+'/json')).json();
 const ws=new WebSocket(tabs[0].webSocketDebuggerUrl);await new Promise(r=>ws.on('open',r));
 let id=0,scenario='',failure='';const pending=new Map(),errors=[],network=[],results=[];
 const call=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});
 ws.on('message',async bytes=>{const m=JSON.parse(bytes);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);return;}
  if(m.method==='Fetch.requestPaused'){
   const r=m.params.request,u=new URL(r.url);
   if(['8080','18086'].includes(u.port)) {
    if(failure && r.method==='POST' && u.pathname===failure) {await call('Fetch.fulfillRequest',{requestId:m.params.requestId,responseCode:503,responseHeaders:[{name:'Access-Control-Allow-Origin',value:base},{name:'Access-Control-Allow-Credentials',value:'true'},{name:'Content-Type',value:'application/json'}],body:Buffer.from('{}').toString('base64')});return;}
    u.port='18086';await call('Fetch.continueRequest',{requestId:m.params.requestId,url:u.toString()});
   } else if(['localhost','127.0.0.1'].includes(u.hostname)) await call('Fetch.continueRequest',{requestId:m.params.requestId});
   else {errors.push({scenario,type:'external-blocked',host:u.hostname});await call('Fetch.failRequest',{requestId:m.params.requestId,errorReason:'BlockedByClient'});}
  } else if(m.method==='Runtime.exceptionThrown')errors.push({scenario,type:'exception',text:m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text});
  else if(m.method==='Runtime.consoleAPICalled'&&['error','warning'].includes(m.params.type)) errors.push({scenario,type:m.params.type,text:m.params.args.map(a=>a.value??a.description??a.type).join(' ').slice(0,600)});
  else if(m.method==='Network.responseReceived'){const r=m.params.response; if(/:18086|:8080/.test(r.url)) network.push({scenario,path:new URL(r.url).pathname,status:r.status});}
 });
 const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};
 const wait=async(expression)=>{for(let i=0;i<160;i++){if(await evaluate(expression))return;await delay(100);}throw Error('Timeout '+expression);};
 const nav=async path=>{await call('Page.navigate',{url:base+path});await wait('document.readyState==="complete"');await delay(400);};
 const click=async selector=>{await wait(`!!document.querySelector(${JSON.stringify(selector)})`);await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);await delay(150);};
 const fill=async(selector,value)=>{await wait(`!!document.querySelector(${JSON.stringify(selector)})`);await evaluate(`document.querySelector(${JSON.stringify(selector)}).focus();document.querySelector(${JSON.stringify(selector)}).select()`);await call('Input.insertText',{text:value});await delay(60);};
 const select=async(selector,value)=>evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('change',{bubbles:true}));})()`);
 const escape=async()=>{await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await delay(250);};
 const shot=async name=>{const dimensions=await evaluate('({width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth})');assert(!dimensions.overflow,`${name}: horizontal overflow`);const png=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync(dir+'/'+name+'.png',Buffer.from(png.data,'base64'));results.push({scenario,name,...dimensions});};
 const card=title=>`Array.from(document.querySelectorAll('.post-card')).find(e=>e.textContent.includes(${JSON.stringify(title)}))`;
 const cardClick=async(title,selector)=>{await wait(`!!(${card(title)})`);await evaluate(`(${card(title)}).querySelector(${JSON.stringify(selector)}).click()`);await delay(180);};
 const menuClick=async(title,text)=>{await cardClick(title,'.btn-options');await evaluate(`Array.from((${card(title)}).querySelectorAll('[role=menuitem]')).find(e=>e.textContent.includes(${JSON.stringify(text)})).click()`);await delay(150);};
 const login=async user=>{await call('Network.clearBrowserCookies');await nav('/login');await wait('!!document.querySelector("#login-password")');if(user.role==='mentoras') await click('ion-segment-button[value="mentoras"]');await fill('#login-identifier',user.email);await fill('#login-password',user.password);await click('button[type=submit]');await wait('location.pathname==="/home"');await wait('!!document.querySelector(".home-create-post")');};
 try {
  await call('Page.enable');await call('Runtime.enable');await call('Network.enable');await call('Fetch.enable',{patterns:[{urlPattern:'http*',requestStage:'Request'}]});
  await login(student);
  const posts=[];
  for(const width of [390,768,1024,1440]) {
   scenario='social-'+width;await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
   await nav('/home');await click('.home-create-post');await wait('!!document.querySelector("#publicacao-conteudo")');
   await click('.btn-submit-post');await wait('!!document.querySelector("#publicacao-conteudo-erro")');
   const title='UI real '+width+' '+Date.now();posts.push(title);await fill('#publicacao-conteudo',title+' — texto sintético para leitura e persistência.');
   if(width===390){const root=await call('DOM.getDocument');const input=await call('DOM.querySelector',{nodeId:root.root.nodeId,selector:'input[type=file]'});await call('DOM.setFileInputFiles',{nodeId:input.nodeId,files:[dir+'/test.png']});}
   await shot('publicacao-form-'+width);
   if(width===768){failure='/posts';await click('.btn-submit-post');await wait('!!document.querySelector("app-create-post-modal .hipatec-state[role=alert]")');assert(await evaluate('document.querySelector("#publicacao-conteudo").value.includes("UI real")'));await shot('publicacao-erro-injetado-'+width);failure='';}
   await click('.btn-submit-post');await wait('!document.querySelector("ion-modal")');await wait(`!!(${card(title)})`);
   await cardClick(title,'.btn-like');await wait(`(${card(title)}).querySelector('.btn-like').getAttribute('aria-pressed')==='true'`);
   await cardClick(title,'.btn-comment');await wait('!!document.querySelector("app-comment-modal textarea")');await fill('app-comment-modal textarea','Comentário UI '+width);await click('app-comment-modal .btn-submit-post');await wait(`document.querySelector('app-comment-modal').textContent.includes('Comentário UI ${width}')`);await shot('comentario-real-'+width);await escape();await wait('!document.querySelector("ion-modal")');
   await cardClick(title,'.btn-repost');await wait(`(${card(title)}).querySelector('.btn-repost').getAttribute('aria-pressed')==='true'`);
   await nav('/home');await wait(`!!(${card(title)})`);assert(await evaluate(`(${card(title)}).querySelector('.btn-like').getAttribute('aria-pressed')==='true'`));
   await cardClick(title,'.btn-repost-comment');await wait('!!document.querySelector("app-comment-modal textarea")');await fill('app-comment-modal textarea','Minha republicação '+width);await click('app-comment-modal .btn-submit-post');await wait('!document.querySelector("ion-modal")');await wait(`document.body.textContent.includes('Minha republicação ${width}')`);
   await menuClick(title,'Editar publicação');await wait('!!document.querySelector("#publicacao-conteudo")');await fill('#publicacao-conteudo',title+' editado');await click('.btn-submit-post');await wait('!document.querySelector("ion-modal")');await wait(`document.body.textContent.includes(${JSON.stringify(title+' editado')})`);
   await shot('feed-real-'+width);
   const dbPosts=await student.request('GET','/posts');const p=dbPosts.find(p=>p.conteudo===title+' editado');assert(p);await nav('/post/'+p.id);await wait('!!document.querySelector(".detail-card")');await shot('detalhe-real-'+width);
   await nav('/profile');await wait('!!document.querySelector(".profile-header") || !!document.querySelector(".profile-shell") || document.body.textContent.includes("Editar perfil")');await shot('perfil-real-'+width);
  }
  await login(mentor);
  for(const width of [390,768,1024,1440]) {
   scenario='conteudos-'+width;await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
   for(const [path,prefix,label] of [['/aprendizado/cursos/novo','curso','Curso'],['/mentorias/novo','mentoria','Mentoria']]){
    await nav(path);await wait(`!!document.querySelector('#${prefix}-titulo')`);assert(await evaluate('document.querySelector(".content-actions .hipatec-btn-primary").disabled'));
    const title=label+' UI '+width+' '+Date.now();await fill('#'+prefix+'-titulo',title);await select('#'+prefix+'-formato','Online');await fill('#'+prefix+'-descricao','Descrição real preservada em banco. '.repeat(width===390?30:2));
    await fill('#'+prefix+(prefix==='curso'?'-instituicao':'-area'),'Hipatec sintética');await shot(prefix+'-form-'+width);
    await click('.content-actions .hipatec-btn-primary');await wait('!document.querySelector("ion-modal")');await nav('/gestao-mentorias');await wait(`document.body.textContent.includes(${JSON.stringify(title)})`);await shot(prefix+'-gestao-'+width);
   }
   await nav('/home');await menuClick(posts[0],'Denunciar publicação');await wait('!!document.querySelector("#report-reason")');await select('#report-reason','spam');await shot('denuncia-'+width);await click('app-report-modal .hipatec-btn-primary');await wait('!document.querySelector("ion-modal")');await wait('document.body.textContent.includes("registrada para análise manual")');
  }
  scenario='nova-sessao';await login(student);await nav('/home');await wait(`!!(${card(posts[0])})`);await shot('nova-sessao');
  await menuClick(posts[0],'Excluir publicação');await wait('!!document.querySelector("ion-alert")');await click('ion-alert .alert-button-role-cancel');await wait('!document.querySelector("ion-alert")');assert(await evaluate(`!!(${card(posts[0])})`));
  await menuClick(posts[0],'Excluir publicação');await wait('!!document.querySelector("ion-alert")');await click('ion-alert .alert-button-role-destructive');await wait('!document.querySelector("ion-alert")');await delay(500);
  assert(!(await student.request('GET','/posts')).some(p=>p.conteudo===posts[0]+' editado'));
  fs.writeFileSync(dir+'/browser-results.json',JSON.stringify({results,errors,network},null,2));assert.equal(errors.filter(e=>e.type==='exception').length,0,JSON.stringify(errors));console.log('PASS navegador: '+results.length+' capturas, API real, quatro larguras');
 } catch(error){fs.writeFileSync(dir+'/browser-results.json',JSON.stringify({results,errors,network,failure:String(error)},null,2));console.error(String(error));process.exitCode=1;}
 finally{ws.close();}
})();

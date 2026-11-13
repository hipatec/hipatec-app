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
  await call('Page.enable');await call('Page.bringToFront');await call('Runtime.enable');await call('Network.enable');await call('Fetch.enable',{patterns:[{urlPattern:'http*',requestStage:'Request'}]});
  await login(student);
  const pointer=async selector=>{
    await wait(`!!document.querySelector(${JSON.stringify(selector)})`);
    const rect=await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
    await call('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...rect});
    await call('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...rect});await delay(180);
  };
  for(const width of [390,768,1024,1440]){
    scenario='settings-focus-'+width;await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
    await nav('/configuracoes');await wait('!!document.querySelector("#nome")');
    assert.equal(await evaluate('document.querySelector("#novaSenha").value'),'');
    await pointer('app-password-field button');assert.equal(await evaluate('document.querySelector("#novaSenha").type'),'text');
    await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
    await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});await delay(200);
    assert(await evaluate('document.activeElement.matches("app-password-field button")'));
    await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});await delay(100);assert(await evaluate('document.activeElement.id==="confirmarSenha"'));
    await fill('#nome','Nome UI '+width);await pointer('button[type=submit]');await wait('document.body.textContent.includes("Dados confirmados pelo servidor")');
    await shot('settings-real-'+width);await nav('/configuracoes');await wait(`document.querySelector('#nome')?.value==='Nome UI ${width}'`);
    await nav('/profile');await wait('!!document.querySelector(".btn-edit-profile")');await pointer('.btn-edit-profile');
    await wait('!!document.querySelector(".input-bio")');await fill('.input-bio','Biografia extensa preservada '.repeat(8));
    if(width===390){const root=await call('DOM.getDocument');const input=await call('DOM.querySelector',{nodeId:root.root.nodeId,selector:'#pfp-upload'});await call('DOM.setFileInputFiles',{nodeId:input.nodeId,files:[dir+'/test.png']});}
    await shot('perfil-edicao-'+width);await pointer('ion-modal .btn-save');await wait('!document.querySelector("ion-modal.show-modal")');
    await nav('/home');await pointer('.home-create-post');await wait('!!document.querySelector("#publicacao-conteudo")');
    await wait('document.activeElement.classList.contains("modal-title")');
    await fill('#publicacao-conteudo','Rascunho longo '.repeat(250));await escape();await wait('!!document.querySelector("ion-alert")');
    await pointer('ion-alert .alert-button-role-cancel');await wait('!document.querySelector("ion-alert")');
    assert((await evaluate('document.querySelector("#publicacao-conteudo").value')).length>3000);
    await shot('rascunho-cancelamento-'+width);await escape();await wait('!!document.querySelector("ion-alert")');await pointer('ion-alert .alert-button-role-destructive');await wait('!document.querySelector("ion-modal")');
    assert(await evaluate('document.activeElement.classList.contains("home-create-post")'));
  }
  scenario='seguir-foto-quebrada';
  const ms=await mentor.request('GET','/auth/session'), mp=await mentor.request('GET','/perfil/mentoras/'+ms.id);
  cp.execFileSync('docker',['exec','hipatec-real-pg-161513','psql','-U','postgres','-d','hipatec_test','-v','ON_ERROR_STOP=1','-c',`UPDATE perfil SET pfp='http://localhost:18086/test-media/ausente.png' WHERE id=${Number(mp.id)}`],{stdio:'ignore'});
  await nav('/profile/mentoras/'+ms.id);await wait('!!document.querySelector(".btn-edit-profile:not([disabled])")');
  await wait('!document.querySelector(".profile-header app-avatar img")');await pointer('.btn-edit-profile');await wait('document.querySelector(".btn-edit-profile").textContent.includes("Seguindo")');
  assert.equal((await mentor.request('GET','/perfil/mentoras/'+ms.id)).num_seguidores,mp.num_seguidores+1);
  await nav('/profile/mentoras/'+ms.id);await wait('document.querySelector(".btn-edit-profile")?.textContent.includes("Seguindo")');await shot('seguir-persistido-foto-quebrada');
  await pointer('.btn-edit-profile');await wait('document.querySelector(".btn-edit-profile").textContent.trim()==="Seguir"');assert.equal((await mentor.request('GET','/perfil/mentoras/'+ms.id)).num_seguidores,mp.num_seguidores);
  scenario='senha-real';await nav('/configuracoes');await wait('!!document.querySelector("#novaSenha")');
  await fill('#novaSenha',student.password+'x');await fill('#confirmarSenha','diferente');await pointer('button[type=submit]');await wait('document.body.textContent.includes("As senhas não coincidem")');await shot('senha-divergente');
  await fill('#confirmarSenha',student.password+'x');await pointer('button[type=submit]');await wait('location.pathname==="/login"');student.password+='x';await login(student);await nav('/profile');await wait('document.body.textContent.includes("Nome UI 1440")');await shot('perfil-nova-sessao');
  fs.writeFileSync(dir+'/browser-extra-results.json',JSON.stringify({results,errors,network},null,2));assert.equal(errors.filter(e=>e.type==='exception'||e.type==='error'||e.type==='external-blocked').length,0,JSON.stringify(errors));console.log('PASS navegador: '+results.length+' capturas adicionais, API real, quatro larguras');
 } catch(error){fs.writeFileSync(dir+'/browser-extra-results.json',JSON.stringify({results,errors,network,failure:String(error)},null,2));console.error(String(error));process.exitCode=1;}
 finally{ws.close();}
})();

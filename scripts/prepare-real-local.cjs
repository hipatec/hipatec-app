// Artefatos de teste somente no scratch; não altera environments nem dependências.
const fs=require('fs'),path=require('path'),os=require('os');
const scratch=path.resolve(process.env.HIPATEC_TEST_SCRATCH||'');
if(!scratch.startsWith(path.join(os.homedir(),'.hermes/cache/scratch')+path.sep))throw Error('Defina HIPATEC_TEST_SCRATCH sob ~/.hermes/cache/scratch');
const project=path.resolve(__dirname,'..');
for(const name of fs.readdirSync(path.join(scratch,'ui/browser')).filter(n=>n.endsWith('.js'))){const file=path.join(scratch,'ui/browser',name);const source=fs.readFileSync(file,'utf8');if(source.includes('http://localhost:8080'))fs.writeFileSync(file,source.replaceAll('http://localhost:8080','http://localhost:18086'));}
fs.writeFileSync(path.join(scratch,'karma.cjs'),`module.exports=config=>{require(${JSON.stringify(path.join(project,'karma.conf.js'))})(config);config.set({basePath:${JSON.stringify(project)},port:19876});};`);
fs.writeFileSync(path.join(scratch,'test.png'),Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aV5cAAAAASUVORK5CYII=','base64'));
console.log('Prévia configurada para API18086; fixture PNG e Karma19876 no scratch.');

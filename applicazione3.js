const KOA = require('koa');
const ROUTER = require('@koa/router');
const render = require('koa-ejs');
const FileReadLine = require('file-readline');
const path = require('path');
const sessione=require('koa-session');
//const logger = require('koa-logger');
//const os = require('os');
const fs = require('fs');
//const bodyparser= require('koa-bodyparser');
const koaBody = require('koa-body');
const serve = require('koa-static');
//const { RSA_X931_PADDING } = require('constants');
const app = new KOA();
const root = new ROUTER();
//app.use(bodyparser());
app.keys=["yannick"]
app.use(sessione(app));
app.use(koaBody({ multipart: true }));
//app.use(logger());
app.use(serve(path.join(__dirname, '/Risultato')));
render(app,{
    root:path.join(__dirname,'views'),
    layout:false,
    viewExt:'html',
    cache:false,
    debug:false
})

root.get("/login.html", async (ctx,next) =>{
    //await next();
    if(ctx.path == "/favicon.ico") return;
    console.log("roote");
    await ctx.render("login");
  }).post("/carica.html", async (ctx,next) =>{
    try {
        if(ctx.path == "/favicon.ico") return;
          await next();
          console.log("rivenuto");
      } catch (err) {
          ctx.status = 400;
          ctx.set('autenticazione', 'fallita');
          ctx.body = err.message;
      }
  }).post("/file.txt", async (ctx,next)=>
  {  
    const file = ctx.request.files.file;
    console.log(file.path);
    const reader = fs.createReadStream(file.path);
    const stream = fs.createWriteStream(path.join(__dirname, "/Risultato/risultato.txt"));
    reader.pipe(stream);
    console.log('caricato il file %s -> %s', file.name, stream.path);
    ctx.body="sucesso del caricamento del file"

  }).get("/risultati.html",async (ctx,next)=>{
      const date=Date.now();
      ctx.session.bol="true";
      ctx.session.tempoaccesso=date;
      await next();
      var render=ctx.session.render;
      await ctx.render("risultati",{
        render: render
      });
      console.log(date);
      ctx.session.bol="false"

  });

  app.use(root.routes()).use(root.allowedMethods());
//dedicato un middleware per la gestione degli errori
  app.use(async (ctx, next) => {
    if(ctx.session.bol==="true")
    {
      return await next();
    }
    if(ctx.path == "/favicon.ico") return;
     console.log("body", ctx.request.body);
     if(ctx.request.body.username !=="admin")
     {
        throw new Error('nome sbagliato');

     }else if(ctx.request.body.password !=="admin")
     {
        throw new Error('password sbagliata');
     }
     else
     {
        await ctx.render("carica");
     }
     
    })
// dedicato un middleware per creazione dell'array di stringhe con le partite che rispettano il tempo
    app.use(async (ctx, next) => {
      const acceso=ctx.session.tempoaccesso;
      const risultato=[];
      //const opts = { separator: '\n' };
      const file = './Risultato/risultato.txt';
      let line="";
      const read = new FileReadLine(file);
      while ((line = await read.next()) !== false) {
        const tempi=line.toString().split(":")[1];
        //console.log(line.toString().split(":")[1]);
        var d=new Date().setHours(tempi);
        if(acceso >= d)
        {
          console.log(line.toString());
          risultato.push(line);
        }
      }
      ctx.session.render=risultato;
})

    app.listen(3000,()=>{
        console.log('server è stato lanciato'); });
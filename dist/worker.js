import {loadData} from './data.js';
import {indexData,respond} from './engine.js';
let db;
self.onmessage=async({data:{id,question,lang}})=>{
  try{
    if(!db)db=loadData(({loaded,total})=>{const pct=Math.round(100*loaded/total);
      self.postMessage({id,type:'progress',message:{uz:'Reyestr yuklanmoqda · '+pct+'%',ru:'Загрузка реестра · '+pct+'%'}});
    }).then(indexData).catch(error=>{db=undefined;throw error;});
    const result=respond(question,lang,await db);
    self.postMessage({id,result});
  }catch(error){
    console.error('Registry query failed',error);
    self.postMessage({id,error:'request_failed'});
  }
};
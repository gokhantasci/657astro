import {test,expect} from '@playwright/test';
import {memurMaas,netEkOdemeBrutu} from '../src/lib/memur-maas';
import {baslangicGirdi,maasKatsayilari,donem,parametreler,dereceler} from '../src/lib/maas-veri';
import {birikimliVergi} from '../src/lib/vergi';
import vergi from '../src/data/vergi.json' with {type:'json'};

// 30-10-2026: MAHEP, Bakteriyolog, Yataklı Tedavi Kurumları, 1/1, kıdem 0,
// 5510, bekâr/çocuksuz, sendika/BES yok, Ekim 2026. Aynı formda üç GV oranı.
for(const [oran,ekOdeme,gv,damga] of [[15,24332.80,2184.84,496.16],[20,25868.16,5091.89,507.81],[27,28374.73,9516.11,526.84]])test(`sağlık net korunan ödeme: MAHEP sabit %${oran}`,()=>{
 const r=memurMaas({...baslangicGirdi,unvan:21071,unvanKosulu:'k107111',derece:'1/1',hizmetYili:0,mezuniyet:1,bes:false,ay:10,gelirVergisiOrani:oran},maasKatsayilari(donem,'maas'),parametreler,dereceler);
 if(r.eksik)throw Error(r.eksikNedeni);
 expect(r.gelirler.find(x=>x.ad==='Sabit ek ödeme (net korumalı brüt)')?.tutar).toBe(ekOdeme);
 expect([r.gelirVergisi,r.damga]).toEqual([gv,damga]);
});

test('otomatik brütleştirme dilim geçişini aynı ödeme içinde böler',()=>{
 const nominal=20000,matrah=30000,onceki=150000,dv=7.59;
 const brut=netEkOdemeBrutu(nominal,matrah,onceki,dv,vergi);
 const net=brut-(birikimliVergi(onceki+matrah+brut,vergi)-birikimliVergi(onceki+matrah,vergi))-brut*dv/1000;
 expect(net).toBeCloseTo(19848.2,2);
 expect(brut).toBeGreaterThan(netEkOdemeBrutu(nominal,matrah,0,dv,vergi));
});

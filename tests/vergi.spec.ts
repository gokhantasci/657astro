import {test,expect} from '@playwright/test';
import {aylikVergi,vergiIstisnasi,birikimliVergi} from '../src/lib/vergi';
import v from '../src/data/vergi.json' with {type:'json'};
test('2026 ücret tarifesinde ay içinde dilim geçişi',()=>{
 expect(aylikVergi(20000,180000,v)).toBe(3500); // 10.000 × %15 + 10.000 × %20
 expect(birikimliVergi(400000,v)).toBe(70500);
 expect(aylikVergi(20000,390000,v)).toBe(4700);
});
test('asgari ücret istisnası ay boyunca doğru dilimden hesaplanır',()=>{
 expect(vergiIstisnasi(1,v).gelir).toBe(4211.33);
 expect(vergiIstisnasi(7,v).gelir).toBe(4537.75);
 expect(vergiIstisnasi(10,v).gelir).toBe(5615.10);
 expect(vergiIstisnasi(10,v).damga).toBe(250.70);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {rentalSummary,routeEmails,buildEmail,defaultTemplates,renderTemplate,validateTemplate} from '../mail-content.mjs';
const row={id:'test',name:'<img src=x onerror=alert(1)>',product_name:'Generator',email:'kunde@example.com',from_date:'2026-09-14',to_date:'2026-09-15',start_half:'pm',end_half:'pm'};
test('half-day boundaries and generator tariff thresholds',()=>{
 const p={category:'Generatoren',day_price:100,tier5_price:80,tier20_price:60};
 assert.equal(rentalSummary(row,p).total,150);
 assert.equal(rentalSummary({...row,to_date:row.from_date},p).units,.5);
 assert.equal(rentalSummary({...row,start_half:'am',to_date:'2026-09-18'},p).total,400);
 assert.equal(rentalSummary({...row,start_half:'am',to_date:'2026-10-03'},p).total,1200);
 assert.throws(()=>rentalSummary({...row,to_date:row.from_date,end_half:'am'},p));
});
test('recipient routing deduplicates locations and retains fallback',()=>{
 assert.deepEqual(routeEmails(null,'info@lehmann-gt.ch').recipients,['info@lehmann-gt.ch']);
 assert.deepEqual(routeEmails({pickup:{notification_email:'A@example.com'},return:{notification_email:'a@example.com'}},'info@lehmann-gt.ch').recipients,['a@example.com']);
 assert.deepEqual(routeEmails({pickup:{notification_email:'a@example.com'},return:{notification_email:'b@example.com'}},'info@lehmann-gt.ch').recipients,['a@example.com','b@example.com']);
});
test('editable text escapes user HTML and always includes details and request disclaimer',()=>{
 const t={subject:'Anfrage {{geraet}}',body:'Hallo {{name}}\n{{abholstandort}}'};
 const mail=buildEmail('request_customer',t,row,{day_price:100},{pickup:{name:'Depot <A>',address:'Test 1'}},'info@lehmann-gt.ch','https://example.com');
 assert.match(mail.text,/150/);assert.match(mail.text,/erst nach unserer ausdrücklichen Bestätigung verbindlich/);
 assert.ok(!mail.html.includes('<img'));assert.match(mail.html,/&lt;img/);assert.match(mail.html,/Depot &lt;A&gt;/);
});
test('template validation and placeholders',()=>{
 for(const t of Object.values(defaultTemplates))validateTemplate(t);
 assert.throws(()=>validateTemplate({subject:'Hi',body:'{{unbekannt}}'}));
 assert.throws(()=>validateTemplate({subject:'Hi\nX',body:'Text'}));
 assert.equal(renderTemplate({subject:'{{name}}',body:'{{name}}'},{name:'Test\r\nCc: bad'}).subject,'Test  Cc: bad');
});

import type {APIRoute} from 'astro';
import {guncelYayin} from '../../lib/maas-yazilari';
export const GET:APIRoute=()=>new Response(JSON.stringify(guncelYayin),{headers:{'Content-Type':'application/json; charset=utf-8'}});

import akis from '../data/haber-akisi.json';
export function GET() {
  return Response.json(akis);
}

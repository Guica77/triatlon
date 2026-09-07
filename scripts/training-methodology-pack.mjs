import { createHash } from 'node:crypto';

export const PACK_SOURCE = 'user:training-methodology:2026-09-07';
export const CAVEAT = 'Síntesis aportada; referencias no verificadas exhaustivamente. Ejemplos orientativos, no protocolos universales. Adaptar a nivel, historial, dolor y recuperación; no sustituye valoración médica.';
const tags = {
  1:'desarrollo atleta nivel principiante intermedio avanzado', 2:'base aeróbica resistencia volumen frecuencia preparación',
  3:'intensidad zonas polarizado piramidal umbral', 4:'periodización temporada macrociclo mesociclo microciclo taper descarga competición',
  5:'natación swim ciclismo bike carrera run técnica transiciones brick', 6:'fuerza gimnasio economía rendimiento',
  7:'recuperación carga sueño fatiga nutrición RPE ACWR', 8:'errores lesiones dolor RED-S energía prevención',
  9:'sesiones ejemplos principiante intermedio avanzado natación ciclismo carrera fuerza brick',
  10:'personalización objetivos disponibilidad historial', 11:'limitaciones evidencia individualización',
};
function uuid(value) {
  const hash = createHash('sha256').update(value).digest('hex');
  return `${hash.slice(0,8)}-${hash.slice(8,12)}-5${hash.slice(13,16)}-a${hash.slice(17,20)}-${hash.slice(20,32)}`;
}
export function compileMethodologyPack(raw) {
  if (typeof raw !== 'string' || !raw.startsWith('Triathlon Training Methodology Research Pack')) throw new Error('Unexpected research pack');
  const sha256 = createHash('sha256').update(raw).digest('hex');
  const id = uuid(`${PACK_SOURCE}:${sha256}:v1`);
  const headings = [...raw.matchAll(/^(\d{1,2})\. ([A-Z][^\n]+)$/gm)];
  if(headings.length !== 11) throw new Error('Expected all 11 methodology sections');
  const references = raw.slice(raw.lastIndexOf('\nReferences\n')).trim();
  const chunks = [];
  for(let n=0;n<headings.length;n++) {
    const match=headings[n], section=Number(match[1]);
    const text=raw.slice(match.index+match[0].length,headings[n+1]?.index ?? raw.lastIndexOf('\nReferences\n')).trim();
    const urls = [...new Set([...text.matchAll(/https:\/\/[^)\s]+/g)].map(m=>m[0]))];
    const prefix=`${CAVEAT}\nSección ${section}: ${match[2]}. Etiquetas: ${tags[section]}.\nFuentes citadas por la sección: ${urls.join(' ')}\n`;
    // Short chunks keep their entire caveat and citations inside the existing 1,200-character context cap.
    const budget=1200-prefix.length;
    const paragraphs=text.split(/\n\s*\n/).map(p=>p.replace(/\s+/g,' ').trim()).filter(Boolean);
    let current='';
    const append=()=>{if(current){chunks.push({id:uuid(`${id}:${chunks.length}`),document_id:id,chunk_index:chunks.length,content:prefix+current,active:true});current='';}};
    for(const paragraph of paragraphs) {
      // Keep source URLs intact, even when a long paragraph needs splitting.
      const words=paragraph.split(' ');
      for(const word of words) {
        if(word.length>budget)throw new Error('Unbreakable source token exceeds chunk budget');
        if((current ? current.length+1 : 0)+word.length>budget)append();
        current+=(current?' ':'')+word;
      }
      if(current.length>budget*0.65)append();
    }
    append();
  }
  // References are separate searchable chunks; inline citations remain in the methodology itself.
  for(const reference of references.split('\n').filter(line=>/^•\s*S\d+/.test(line))) {
    const content=`${CAVEAT}\nReferencia del documento aportado: ${reference.trim()}`;
    if(content.length>1200)throw new Error('Reference exceeds context cap');
    chunks.push({id:uuid(`${id}:${chunks.length}`),document_id:id,chunk_index:chunks.length,content,active:true});
  }
  return {
    document:{id,title:'Triathlon Training Methodology Research Pack · 2026-09-07',category:'training_methodology',sport_type:null,source:PACK_SOURCE,active:true},
    sha256,chunker_version:1,chunks,
  };
}

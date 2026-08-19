const BUILTIN_VERSION = 3;
const builtInCards = [
  {
    id:'porta-falsch-p4',
    term:'falsch (P4)',
    description:'Mit einer Faust mit abgespreiztem Daumen und kleinem Finger ans Kinn tippen.',
    image:'',
    source:'PORTA / Stiftung Tanne',
    sourceUrl:'https://tanne.ch/porta/',
    builtin:true
  },
  {
    id:'porta-wetter-p4',
    term:'Wetter (P4)',
    description:'Eine Hand wird seitlich über dem Kopf ausgestreckt und mehrmals aus dem Handgelenk heraus gedreht.',
    image:'https://tanne.ch/wp-content/uploads/Wetter_o-800x578.jpg',
    source:'PORTA / Stiftung Tanne',
    builtin:true
  },
  {
    id:'porta-tal-bonus',
    term:'Tal (BONUS)',
    description:'Aufgestellte Hände, Handflächen zueinander gerichtet, sind oberhalb der Schulterhöhe. Hände mit einer Abwärtsbewegung zueinander führen, bis die Handkanten sich berühren.',
    image:'https://tanne.ch/wp-content/uploads/Tal_o-800x578.jpg',
    source:'PORTA / Stiftung Tanne',
    builtin:true
  },
  {
    id:'porta-abend',
    term:'Abend',
    description:'Beide offenen Hände ungefähr auf Kopfhöhe halten. Die Hände in zwei Bögen nach unten zur Körpermitte führen – wie in der PORTA-Zeichnung dargestellt.',
    image:'https://tanne.ch/wp-content/uploads/Abend_o.jpg',
    source:'PORTA / Stiftung Tanne',
    builtin:true
  }
];

let cards=load();
let index=0;
let showingImage=false;
let editingId=null;
let pendingImage=null;
let pendingDescriptionImage=null;

function load(){
  let stored=[];
  try{stored=JSON.parse(localStorage.getItem('portaCards'))||[]}catch{}
  const oldVersion=Number(localStorage.getItem('portaBuiltinVersion')||0);
  // Bei einer neuen App-Version die offiziellen Startkarten ergänzen, ohne eigene Karten zu überschreiben.
  if(oldVersion<BUILTIN_VERSION){
    const custom=stored.filter(c=>!c.builtin && c.term!=='Meine erste Gebärde');
    stored=[...builtInCards,...custom];
    localStorage.setItem('portaCards',JSON.stringify(stored));
    localStorage.setItem('portaBuiltinVersion',String(BUILTIN_VERSION));
  }
  return stored.length?stored:[...builtInCards];
}
function save(){localStorage.setItem('portaCards',JSON.stringify(cards))}
const $=id=>document.getElementById(id);

function render(){
  if(!cards.length){cards=[...builtInCards];save()}
  index=Math.max(0,Math.min(index,cards.length-1));
  const c=cards[index];
  $('term').textContent=c.term;
  $('termBack').textContent=c.term;
  $('description').textContent=c.description;
  if(c.descriptionImage){$('descriptionImage').src=c.descriptionImage;$('descriptionImageFrame').classList.remove('hidden')}else{$('descriptionImage').removeAttribute('src');$('descriptionImageFrame').classList.add('hidden')}
  $('source').innerHTML=''; if(c.source){const span=document.createElement('span'); span.textContent=`Quelle: ${c.source}`; $('source').append(span); if(c.sourceUrl){const a=document.createElement('a'); a.href=c.sourceUrl; a.target='_blank'; a.rel='noopener'; a.textContent=' · PORTA öffnen'; a.addEventListener('click',e=>e.stopPropagation()); $('source').append(a);}}
  $('counter').textContent=`${index+1} / ${cards.length}`;
  $('progressBar').style.width=`${((index+1)/cards.length)*100}%`;
  $('front').classList.toggle('hidden',showingImage);
  $('back').classList.toggle('hidden',!showingImage);
  if(c.image){
    $('signImage').src=c.image;
    $('signImage').classList.remove('hidden');
    $('noImage').classList.add('hidden');
  }else{
    $('signImage').removeAttribute('src');
    $('signImage').classList.add('hidden');
    $('noImage').textContent=c.sourceUrl?'Offizielles Bild über „PORTA öffnen“ ansehen oder eigenes Bild hinterlegen.':'Noch kein Bild hinterlegt'; $('noImage').classList.remove('hidden');
  }
}

function next(){index=(index+1)%cards.length;showingImage=false;render()}
function prev(){index=(index-1+cards.length)%cards.length;showingImage=false;render()}

$('card').addEventListener('click',()=>{if(!showingImage){showingImage=true;render()}else next()});
$('card').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();$('card').click()}});
$('nextBtn').onclick=e=>{e.stopPropagation();next()};
$('prevBtn').onclick=e=>{e.stopPropagation();prev()};
$('shuffleBtn').onclick=e=>{e.stopPropagation();cards=[...cards].sort(()=>Math.random()-.5);index=0;showingImage=false;render()};

$('settingsBtn').onclick=()=>{renderList();$('editor').showModal()};
function renderList(){
  $('list').innerHTML='';
  cards.forEach(c=>{
    const row=document.createElement('div');row.className='listItem';
    const img=document.createElement('img');img.className='thumb';if(c.image)img.src=c.image;
    const txt=document.createElement('div');txt.className='listText';
    txt.innerHTML=`<b>${escapeHtml(c.term||'Ohne Titel')}</b><span>${escapeHtml(c.description||'Keine Beschreibung')}</span>${c.builtin?'<em>Vorinstalliert</em>':'<em>Eigene Karte</em>'}`;
    const b=document.createElement('button');b.type='button';b.className='editMini';b.textContent='Bearbeiten';b.onclick=()=>openEdit(c.id);
    row.append(img,txt,b);$('list').append(row)
  })
}
function escapeHtml(s){return String(s).replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]))}

$('addBtn').onclick=()=>{
  const c={id:crypto.randomUUID(),term:'Neue Gebärde',description:'Beschreibung eintragen',image:'',source:'Eigene Karte',builtin:false};
  cards.push(c);save();renderList();openEdit(c.id)
};

function openEdit(id){
  editingId=id;pendingImage=null;pendingDescriptionImage=null;
  const c=cards.find(x=>x.id===id);
  $('editTerm').value=c.term;
  $('editDescription').value=c.description;
  $('editImage').value='';
  $('editDescriptionImage').value='';
  $('deleteBtn').disabled=!!c.builtin;
  $('deleteBtn').textContent=c.builtin?'Vorinstalliert':'Löschen';
  if(c.descriptionImage){$('descriptionPreview').src=c.descriptionImage;$('descriptionPreview').classList.remove('hidden')}else{$('descriptionPreview').classList.add('hidden');$('descriptionPreview').removeAttribute('src')}
  if(c.image){$('preview').src=c.image;$('preview').classList.remove('hidden')}else{$('preview').classList.add('hidden');$('preview').removeAttribute('src')}
  $('editCardDialog').showModal()
}


$('editDescriptionImage').addEventListener('change',async e=>{
  const f=e.target.files[0];if(!f)return;
  try{
    pendingDescriptionImage=await resizeImage(f,1280,0.84);
    $('descriptionPreview').src=pendingDescriptionImage;$('descriptionPreview').classList.remove('hidden');
  }catch(err){alert('Das Foto zur Beschreibung konnte nicht verarbeitet werden.')}
});

$('editImage').addEventListener('change',async e=>{
  const f=e.target.files[0];if(!f)return;
  try{
    pendingImage=await resizeImage(f,1280,0.84);
    $('preview').src=pendingImage;$('preview').classList.remove('hidden');
  }catch(err){alert('Das Bild konnte nicht verarbeitet werden.')}
});

function resizeImage(file,maxSide=1280,quality=.84){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onerror=reject;
    reader.onload=()=>{
      const img=new Image();
      img.onerror=reject;
      img.onload=()=>{
        let w=img.naturalWidth,h=img.naturalHeight;
        const scale=Math.min(1,maxSide/Math.max(w,h));w=Math.round(w*scale);h=Math.round(h*scale);
        const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
        canvas.getContext('2d').drawImage(img,0,0,w,h);
        resolve(canvas.toDataURL('image/jpeg',quality));
      };
      img.src=reader.result;
    };
    reader.readAsDataURL(file)
  })
}

$('saveBtn').onclick=()=>{
  const c=cards.find(x=>x.id===editingId);
  c.term=$('editTerm').value.trim()||'Ohne Titel';
  c.description=$('editDescription').value.trim()||'Keine Beschreibung';
  if(pendingDescriptionImage){c.descriptionImage=pendingDescriptionImage;c.builtin=false}
  if(pendingImage){c.image=pendingImage;c.source='Eigenes Bild';c.builtin=false}
  save();renderList();render();$('editCardDialog').close();$('editImage').value='';$('editDescriptionImage').value=''
};

$('deleteBtn').onclick=()=>{
  const c=cards.find(x=>x.id===editingId);
  if(c?.builtin)return;
  if(!confirm('Diese eigene Gebärde wirklich löschen?'))return;
  cards=cards.filter(x=>x.id!==editingId);index=0;save();renderList();render();$('editCardDialog').close()
};

$('resetBtn').onclick=()=>{
  if(!confirm('Vorinstallierte PORTA-Karten wiederherstellen? Eigene Karten bleiben erhalten.'))return;
  const custom=cards.filter(c=>!c.builtin);
  cards=[...builtInCards,...custom];save();index=0;showingImage=false;renderList();render()
};

if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js'));
render();

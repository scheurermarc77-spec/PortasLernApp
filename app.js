const builtInCards = [];

let cards=load();
let index=0;
let showingImage=false;
let editingId=null;
let pendingImage=null;
let pendingDescriptionImage=null;

function load(){
  let stored=[];
  try{stored=JSON.parse(localStorage.getItem('portaCards'))||[]}catch{}
  // Alte vorinstallierte/externe Beispielkarten aus früheren Versionen entfernen.
  stored=stored.filter(c=>!c.builtin && !c.sourceUrl && !(c.source||'').includes('Stiftung Tanne'));
  localStorage.setItem('portaCards',JSON.stringify(stored));
  localStorage.removeItem('portaBuiltinVersion');
  return stored;
}
function save(){localStorage.setItem('portaCards',JSON.stringify(cards))}
const $=id=>document.getElementById(id);

function render(){
  if(!cards.length){
    $('term').textContent='Noch keine Gebärden';
    $('termBack').textContent='Noch keine Gebärden';
    $('description').textContent='Tippe oben rechts auf ⚙︎ und füge deine erste eigene Gebärde hinzu.';
    $('descriptionImage').removeAttribute('src');
    $('descriptionImageFrame').classList.add('hidden');
    $('source').innerHTML='';
    $('counter').textContent='0 / 0';
    $('progressBar').style.width='0%';
    $('front').classList.remove('hidden');
    $('back').classList.add('hidden');
    $('signImage').removeAttribute('src');
    $('signImage').classList.add('hidden');
    $('noImage').textContent='Noch kein Bild hinterlegt';
    $('noImage').classList.remove('hidden');
    return;
  }
  index=Math.max(0,Math.min(index,cards.length-1));
  const c=cards[index];
  $('term').textContent=c.term;
  $('termBack').textContent=c.term;
  $('description').textContent=c.description;
  if(c.descriptionImage){$('descriptionImage').src=c.descriptionImage;$('descriptionImageFrame').classList.remove('hidden')}else{$('descriptionImage').removeAttribute('src');$('descriptionImageFrame').classList.add('hidden')}
  $('source').innerHTML='';
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
    $('noImage').textContent='Noch kein Bild hinterlegt';
    $('noImage').classList.remove('hidden');
  }
}

function next(){if(!cards.length)return;index=(index+1)%cards.length;showingImage=false;render()}
function prev(){if(!cards.length)return;index=(index-1+cards.length)%cards.length;showingImage=false;render()}

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
    txt.innerHTML=`<b>${escapeHtml(c.term||'Ohne Titel')}</b><span>${escapeHtml(c.description||'Keine Beschreibung')}</span><em>Eigene Karte</em>`;
    const b=document.createElement('button');b.type='button';b.className='editMini';b.textContent='Bearbeiten';b.onclick=()=>openEdit(c.id);
    row.append(img,txt,b);$('list').append(row)
  })
}
function escapeHtml(s){return String(s).replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]))}

$('addBtn').onclick=()=>{
  const c={id:crypto.randomUUID(),term:'Neue Gebärde',description:'Beschreibung eintragen',image:'',source:'',builtin:false};
  cards.push(c);save();renderList();openEdit(c.id)
};

function openEdit(id){
  editingId=id;pendingImage=null;pendingDescriptionImage=null;
  const c=cards.find(x=>x.id===id);
  $('editTerm').value=c.term;
  $('editDescription').value=c.description;
  $('editImage').value='';
  $('editDescriptionImage').value='';
  $('deleteBtn').disabled=false;
  $('deleteBtn').textContent='Löschen';
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
  if(pendingImage){c.image=pendingImage;c.source='';c.builtin=false}
  save();renderList();render();$('editCardDialog').close();$('editImage').value='';$('editDescriptionImage').value=''
};

$('deleteBtn').onclick=()=>{
  const c=cards.find(x=>x.id===editingId);
    if(!confirm('Diese eigene Gebärde wirklich löschen?'))return;
  cards=cards.filter(x=>x.id!==editingId);index=0;save();renderList();render();$('editCardDialog').close()
};

$('resetBtn').onclick=()=>{
  if(!cards.length)return;
  if(!confirm('Wirklich alle eigenen Lernkarten löschen?'))return;
  cards=[];save();index=0;showingImage=false;renderList();render()
};

if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js'));
render();

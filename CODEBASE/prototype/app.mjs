import {fresh,api} from './model.mjs';
const $=id=>document.getElementById(id),key='pb03-warehouse-v1';let state=fresh(),draft=[{productId:'BUT',quantity:''}],blocked=false;
function message(text,error=false){$('message').textContent=text;$('message').className=error?'error':'success';}
try{const saved=localStorage.getItem(key);if(saved){const candidate=JSON.parse(saved);if(!Array.isArray(candidate.products)||!Array.isArray(candidate.receipts)||new Set(candidate.products.map(p=>p.id)).size!==candidate.products.length||candidate.products.some(p=>typeof p.id!=='string'||typeof p.name!=='string'||typeof p.unit!=='string'||!Number.isSafeInteger(p.stock)||p.stock<0))throw Error('invalid');state=candidate;}$('storageNote').textContent='Phiếu đã lưu được giữ trên trình duyệt này.';}catch{blocked=true;$('storageNote').textContent='Không đọc được dữ liệu demo. Đã chặn lưu để tránh ghi đè dữ liệu lỗi. Hãy giữ lại dữ liệu và kiểm tra lỗi trình duyệt.';}
const activeProducts=()=>state.products.filter(p=>p.active!==false);
const parsed=()=>draft.map(l=>({productId:l.productId,quantity:l.quantity.trim()===''?NaN:Number(l.quantity)}));
function controls(){
 const edit=$('role').value==='keeper'&&!blocked;
 $('receiptSection').hidden=$('role').value!=='keeper';
 $('adjustmentSection').hidden=$('role').value!=='keeper';$('reviewSection').hidden=!$('role').value;
 const used=new Set(draft.map(l=>l.productId));
 $('catalog').hidden=$('role').value!=='manager';$('createProduct').disabled=blocked;$('save').disabled=!edit;$('add').disabled=!edit||used.size>=activeProducts().length;
 $('hint').textContent=used.size>=activeProducts().length?'Đã chọn hết hàng trong danh mục. Mỗi hàng chỉ xuất hiện một dòng.':'Thêm dòng sẽ chọn một hàng chưa có trên phiếu.';
 $('permission').textContent=edit?'Bạn đang nhập với vai trò Thủ kho.':'Chỉ Thủ kho được nhập; Quản lý có thể tạo mã hàng ở phần Danh mục.';
 document.querySelectorAll('#lines input,#lines select,#lines button').forEach(e=>e.disabled=!edit);
 document.querySelectorAll('#lines select').forEach((select,i)=>{
  for(const option of select.options)option.disabled=draft.some((l,j)=>j!==i&&l.productId===option.value);
 });
}
function renderDraft(){ $('lines').replaceChildren();draft.forEach((line,i)=>{
 const row=document.createElement('div');row.className='line';const select=document.createElement('select');select.setAttribute('aria-label',`Hàng dòng ${i+1}`);
 activeProducts().forEach(p=>{const option=document.createElement('option');option.value=p.id;option.textContent=`${p.id} — ${p.name}`;select.append(option);});select.value=line.productId;
 select.onchange=()=>{line.productId=select.value;controls();};
 const input=document.createElement('input');input.type='number';input.step='1';input.placeholder='Số lượng';input.setAttribute('aria-label',`Số lượng dòng ${i+1}`);input.value=line.quantity;input.oninput=()=>line.quantity=input.value;
 const remove=document.createElement('button');remove.textContent='Bỏ dòng';remove.onclick=()=>{draft.splice(i,1);renderDraft();};row.append(select,input,remove);$('lines').append(row);
 });controls();}
function renderData(){ $('stock').replaceChildren();$('history').replaceChildren();if(!$('role').value){$('history').textContent='Chọn người dùng demo để xem dữ liệu.';return;}for(const p of api(state,$('role').value,'GET','/api/products').body){const tr=document.createElement('tr');for(const value of [p.id,p.name+(p.active===false?' (ngừng sử dụng)':''),p.stock,p.unit]){const td=document.createElement('td');td.textContent=value;tr.append(td);}$('stock').append(tr);}if(!state.receipts.length)$('history').textContent='Chưa có phiếu nhập.';for(const r of [...api(state,$('role').value,'GET','/api/receipts').body].reverse()){const item=document.createElement('p');item.textContent=`${r.id} · ${new Date(r.at).toLocaleString('vi-VN')} · ${r.actor} · ${r.lines.map(l=>`${l.productId}: +${l.quantity}`).join(', ')}`;$('history').append(item);}}
$('role').onchange=()=>{$('reviewMessage').hidden=true;$('createMessage').hidden=true;clearCatalogMessage();renderDraft();renderData();renderExtended();message('Đã đổi vai trò demo. Phiếu nháp chưa được lưu.');};$('add').onclick=()=>{const next=activeProducts().find(p=>!draft.some(l=>l.productId===p.id));if(!next)return;draft.push({productId:next.id,quantity:''});renderDraft();};
$('save').onclick=()=>{if(blocked)return message('Lưu bị chặn vì dữ liệu lỗi.',true);const r=api(state,$('role').value,'POST','/api/receipts',{lines:parsed()});if(r.status!==201)return message(`${r.status}: ${r.body.message}`,true);try{localStorage.setItem(key,JSON.stringify(r.next));}catch{return message('Không lưu được vào trình duyệt. Phiếu và tồn chưa được cập nhật. Giữ phiếu nháp để thử lại.',true);}state=r.next;renderExtended();draft=activeProducts().length?[{productId:activeProducts()[0].id,quantity:''}]:[];renderDraft();renderData();message(`Đã lưu ${r.body.id}. Tồn và lịch sử đã cập nhật.`);};renderDraft();renderData();

function createFeedback(text,error=false){const el=$('createMessage');el.textContent=text;el.className=error?'error':'success';el.hidden=false;el.focus({preventScroll:true});el.scrollIntoView({block:'nearest',behavior:'instant'});}
$('createProduct').onclick=()=>{
 if(blocked)return createFeedback('Dữ liệu lỗi, đã chặn ghi.',true);
 const r=api(state,$('role').value,'POST','/api/products',{id:$('productId').value,name:$('productName').value,unit:$('productUnit').value});
 if(r.status!==201)return createFeedback(r.body.message,true);
 try{localStorage.setItem(key,JSON.stringify(r.next));}catch{return createFeedback('Không lưu được danh mục; chưa tạo mã hàng.',true);}
 state=r.next;renderExtended();for(const id of ['productId','productName','productUnit'])$(id).value='';renderDraft();renderData();createFeedback(`Tạo mã hàng thành công: ${r.body.id} với tồn 0. Chọn Thủ kho để nhập hàng.`);
};

function option(select,value,text){const o=document.createElement('option');o.value=value;o.textContent=text;select.append(o);}
function clearCatalogMessage(){$('catalogMessage').hidden=true;$('catalogMessage').textContent='';}
function fillEdit(){const p=state.products.find(p=>p.id===$('manageProduct').value);for(const [field,key] of [['editId','id'],['editName','name'],['editUnit','unit']])$(field).value=p?.[key]||'';}
function renderExtended(){
 const old=$('manageProduct').value;$('manageProduct').replaceChildren();$('adjustProduct').replaceChildren();
 state.products.forEach(p=>option($('manageProduct'),p.id,`${p.id} — ${p.name}${p.active===false?' (ngừng sử dụng)':''}`));
 if(state.products.some(p=>p.id===old))$('manageProduct').value=old;fillEdit();
 activeProducts().forEach(p=>option($('adjustProduct'),p.id,`${p.name} — tồn ${p.stock}`));
 $('adjustmentList').replaceChildren();
 const labels={pending:'Chờ duyệt',approved:'Đã duyệt',rejected:'Từ chối'};
 for(const r of [...(state.adjustments||[])].reverse()){
  const box=document.createElement('div'),text=document.createElement('p');
  text.textContent=`${r.id} · ${r.productId} · giảm ${r.quantity} · ${r.reason} · ${labels[r.status]} · ${r.requestedBy} (${new Date(r.requestedAt).toLocaleString('vi-VN')})${r.reviewedBy?' · '+r.reviewedBy+' ('+new Date(r.reviewedAt).toLocaleString('vi-VN')+')':''}${r.status==='approved'?' · tồn '+r.beforeStock+' → '+r.afterStock:''}${r.reviewNote?' · '+r.reviewNote:''}`;box.append(text);
  if(r.status==='pending'&&$('role').value==='manager'){
   const approve=document.createElement('button');approve.textContent='Duyệt '+r.id;approve.onclick=()=>commit('/api/adjustments/review',{id:r.id,action:'approve'},`Duyệt ${r.id} thành công. Tồn kho đã được cập nhật.`);
   const note=document.createElement('input');note.placeholder='Lý do từ chối';note.setAttribute('aria-label','Lý do từ chối '+r.id);note.maxLength=500;
   const reject=document.createElement('button');reject.textContent='Từ chối '+r.id;reject.onclick=()=>commit('/api/adjustments/review',{id:r.id,action:'reject',note:note.value},`Từ chối ${r.id} thành công. Tồn kho không thay đổi.`);box.append(approve,note,reject);
  }$('adjustmentList').append(box);
 }if(!(state.adjustments||[]).length)$('adjustmentList').textContent='Chưa có đề nghị.';
}
function commit(path,payload,success){
 const notify=(text,error=false)=>{if(path==='/api/adjustments/review'){const el=$('reviewMessage');el.textContent=text;el.className=error?'error':'success';el.hidden=false;el.focus({preventScroll:true});el.scrollIntoView({block:'nearest',behavior:'instant'});}else if(path==='/api/products/manage'){const el=$('catalogMessage');el.textContent=text;el.className=error?'error':'success';el.hidden=false;el.focus({preventScroll:true});el.scrollIntoView({block:'nearest',behavior:'instant'});}else message(text,error);};
 if(blocked)return notify('Dữ liệu lỗi, đã chặn ghi.',true);
 const r=api(state,$('role').value,'POST',path,payload);if(r.status>=400)return notify(r.body.message,true);
 try{localStorage.setItem(key,JSON.stringify(r.next));}catch{return notify('Không lưu được; dữ liệu chưa thay đổi.',true);}
 state=r.next;draft=draft.filter(l=>activeProducts().some(p=>p.id===l.productId));renderDraft();renderData();renderExtended();if(path==='/api/products/manage'&&payload.action==='edit'){$('manageProduct').value=payload.id.trim().toUpperCase();fillEdit();}notify(success);return true;
}
$('manageProduct').onchange=fillEdit;

$('editProduct').onclick=()=>commit('/api/products/manage',{action:'edit',originalId:$('manageProduct').value,id:$('editId').value,name:$('editName').value,unit:$('editUnit').value},'Chỉnh sửa hàng thành công.');
let pendingDelete=null;
function catalogFeedback(text,error=false){const el=$('catalogMessage');el.textContent=text;el.className=error?'error':'success';el.hidden=false;el.focus({preventScroll:true});el.scrollIntoView({block:'nearest',behavior:'instant'});}
function closeDelete(){pendingDelete=null;$('deleteConfirmation').hidden=true;}
$('deleteProduct').onclick=()=>{
 closeDelete();
 const product=state.products.find(p=>p.id===$('manageProduct').value);
 if(!product)return catalogFeedback('Không thể xóa: chưa chọn mặt hàng.',true);
 if(product.stock>0)return catalogFeedback(`Không thể xóa ${product.id} — ${product.name}: còn ${product.stock} ${product.unit} trong kho.`,true);
 pendingDelete=product.id;
 $('deleteQuestion').textContent=`Xóa ${product.id} — ${product.name} (tồn 0)? Lịch sử vẫn được giữ. Các đề nghị chờ của mã hàng sẽ được đóng.`;
 $('deleteConfirmation').hidden=false;
 catalogFeedback(`Mặt hàng ${product.id} có tồn bằng 0. Hãy bấm “Xác nhận xóa” để thực hiện.`);
 $('confirmDelete').focus();
};
$('confirmDelete').onclick=()=>{
 const product=state.products.find(p=>p.id===pendingDelete);
 closeDelete();if(!product)return catalogFeedback('Không thể xóa: mã hàng không còn tồn tại.',true);
 commit('/api/products/manage',{action:'delete',originalId:product.id},`Xóa hàng thành công: ${product.id} — ${product.name}. Danh mục đã được cập nhật.`);
};
$('cancelDelete').onclick=()=>{closeDelete();catalogFeedback('Đã hủy xóa. Dữ liệu không thay đổi.');};
$('manageProduct').onchange=()=>{closeDelete();fillEdit();};
$('role').addEventListener('change',closeDelete);
$('requestAdjustment').onclick=()=>{if(commit('/api/adjustments',{productId:$('adjustProduct').value,quantity:$('adjustQuantity').value.trim()===''?NaN:Number($('adjustQuantity').value),reason:$('adjustReason').value},'Đã gửi đề nghị, tồn chưa thay đổi.')){$('adjustQuantity').value='';$('adjustReason').value='';}};
renderExtended();
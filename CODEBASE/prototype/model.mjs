export const fresh = () => ({products:[{id:'BUT',name:'Bút bi',unit:'cây',stock:10},{id:'SO',name:'Sổ tay',unit:'quyển',stock:20}],receipts:[]});
const fail=(status,message)=>({status,body:{message}});
function validate(state,lines){
 if(!Array.isArray(lines)||!lines.length) return 'Phiếu cần ít nhất một dòng hàng.';
 for(const [index,l] of lines.entries()){
  if(!state.products.some(p=>p.id===l.productId&&p.active!==false)) return `Dòng ${index+1}: hãy chọn mã hàng hợp lệ.`;
  if(!Number.isSafeInteger(l.quantity)||l.quantity<=0) return `Dòng ${index+1} (${l.productId}): số lượng phải là số nguyên lớn hơn 0. Hãy nhập số lượng hoặc bỏ dòng chưa dùng.`;
 }
 return null;
}
export function api(state,role,method,path,payload={},now=()=>new Date().toISOString()){
 if(!['keeper','manager'].includes(role))return fail(401,'Hãy chọn người dùng demo.');
 if(method==='GET'&&path==='/api/products')return {status:200,body:structuredClone(state.products)};
 if(method==='GET'&&path==='/api/receipts')return {status:200,body:structuredClone(state.receipts)};
 if(method==='POST'&&path==='/api/products'){
  if(role!=='manager')return fail(403,'Chỉ Quản lý được tạo mã hàng mới.');
  const id=typeof payload.id==='string'?payload.id.trim().toUpperCase():'';
  const name=typeof payload.name==='string'?payload.name.trim():'';
  const unit=typeof payload.unit==='string'?payload.unit.trim():'';
  if(!/^[A-Z0-9_-]{1,30}$/.test(id)||!name||name.length>100||!unit||unit.length>30)return fail(400,'Nhập mã 1–30 ký tự A-Z, số, _ hoặc -; tên tối đa 100 và đơn vị tối đa 30 ký tự.');
  if(state.products.some(p=>p.id===id)||(state.deletedProducts||[]).some(p=>p.id===id))return fail(409,'Mã hàng đã tồn tại hoặc đã xóa và giữ trong lịch sử. Hãy dùng mã khác.');
  const next=structuredClone(state),product={id,name,unit,stock:0};next.products.push(product);
  next.catalogEvents??=[];next.catalogEvents.push({action:'CREATE_PRODUCT',productId:id,actor:'Quản lý demo',at:now()});
  return {status:201,body:structuredClone(product),next};
 }

 const used=id=>state.receipts.some(r=>r.lines.some(l=>l.productId===id))||(state.adjustments||[]).some(a=>a.productId===id)||(state.catalogEvents||[]).some(e=>e.action==='DELETE_PRODUCT'&&e.productId===id);
 if(method==='POST'&&path==='/api/products/manage'){
  if(role!=='manager')return fail(403,'Chỉ Quản lý được sửa/xóa danh mục.');
  const product=state.products.find(p=>p.id===payload.originalId);if(!product)return fail(404,'Không tìm thấy hàng.');
  const next=structuredClone(state),target=next.products.find(p=>p.id===product.id);
  if(payload.action==='edit'){
   const id=String(payload.id||'').trim().toUpperCase(),name=String(payload.name||'').trim(),unit=String(payload.unit||'').trim();
   if(!/^[A-Z0-9_-]{1,30}$/.test(id)||!name||name.length>100||!unit||unit.length>30)return fail(400,'Mã, tên hoặc đơn vị không hợp lệ.');
   if(id!==product.id&&(used(product.id)||product.stock!==0))return fail(409,'Hàng đã có tồn hoặc được sử dụng: giữ nguyên mã để bảo toàn lịch sử.');
   if(unit!==product.unit&&(used(product.id)||product.stock!==0))return fail(409,'Hàng đã sử dụng: không đổi đơn vị để tránh sai số lượng lịch sử.');
   if(next.products.some(p=>p.id===id&&p.id!==product.id)||(id!==product.id&&(state.deletedProducts||[]).some(p=>p.id===id)))return fail(409,'Mã hàng đã tồn tại.');
   Object.assign(target,{id,name,unit});
  }else if(payload.action==='delete'){
   if(product.stock!==0)return fail(409,`Không thể xóa ${product.id}: còn ${product.stock} ${product.unit} trong kho.`);
   next.deletedProducts??=[];next.deletedProducts.push({...structuredClone(product),deletedBy:'Quản lý demo',deletedAt:now()});
   for(const request of next.adjustments||[])if(request.productId===product.id&&request.status==='pending')Object.assign(request,{status:'rejected',reviewedBy:'Quản lý demo',reviewedAt:now(),reviewNote:'Đề nghị đã đóng vì mã hàng được xóa khi tồn bằng 0.'});
   next.products=next.products.filter(p=>p.id!==product.id);
  }else if(payload.action==='archive'){
   if((state.adjustments||[]).some(a=>a.productId===product.id&&a.status==='pending'))return fail(409,'Còn đề nghị chờ duyệt. Hãy xử lý trước khi ngừng sử dụng.');
   target.active=false;
  }else if(payload.action==='restore')target.active=true;
  else return fail(400,'Thao tác không hợp lệ.');
  next.catalogEvents??=[];next.catalogEvents.push({action:payload.action.toUpperCase()+'_PRODUCT',productId:product.id,before:structuredClone(product),after:payload.action==='delete'?null:structuredClone(target),actor:'Quản lý demo',at:now()});
  return {status:200,body:{message:'Đã cập nhật danh mục.'},next};
 }
 if(method==='POST'&&path==='/api/adjustments'){
  if(role!=='keeper')return fail(403,'Chỉ Thủ kho gửi đề nghị giảm tồn.');
  const product=state.products.find(p=>p.id===payload.productId&&p.active!==false);
  if(!product||!Number.isSafeInteger(payload.quantity)||payload.quantity<=0)return fail(400,'Chọn hàng đang sử dụng và số lượng nguyên lớn hơn 0.');
  if(payload.quantity>product.stock)return fail(409,'Số lượng đề nghị vượt tồn hiện tại.');
  if(typeof payload.reason!=='string'||!payload.reason.trim()||payload.reason.trim().length>500)return fail(400,'Cần lý do giảm tồn, tối đa 500 ký tự.');
  const next=structuredClone(state);next.adjustments??=[];
  const request={id:'DC-'+(next.adjustments.length+1),productId:product.id,quantity:payload.quantity,reason:payload.reason.trim(),status:'pending',requestedBy:'Thủ kho demo',requestedAt:now()};next.adjustments.push(request);
  return {status:201,body:structuredClone(request),next};
 }
 if(method==='POST'&&path==='/api/adjustments/review'){
  if(role!=='manager')return fail(403,'Chỉ Quản lý được duyệt/từ chối.');
  const request=(state.adjustments||[]).find(a=>a.id===payload.id);if(!request)return fail(404,'Không tìm thấy đề nghị.');
  if(request.status!=='pending')return fail(409,'Đề nghị đã xử lý, không được xử lý lần nữa.');
  if(!['approve','reject'].includes(payload.action))return fail(400,'Thao tác không hợp lệ.');
  if(payload.action==='reject'&&(typeof payload.note!=='string'||!payload.note.trim()||payload.note.length>500))return fail(400,'Cần lý do từ chối, tối đa 500 ký tự.');
  const next=structuredClone(state),item=next.adjustments.find(a=>a.id===request.id),product=next.products.find(p=>p.id===request.productId);
  if(payload.action==='approve'){
   if(!product||product.active===false||product.stock<request.quantity)return fail(409,'Không đủ tồn hiện tại hoặc hàng đã ngừng sử dụng; chưa thể duyệt.');
   item.beforeStock=product.stock;product.stock-=request.quantity;item.afterStock=product.stock;
  }
  Object.assign(item,{status:payload.action==='approve'?'approved':'rejected',reviewedBy:'Quản lý demo',reviewedAt:now(),reviewNote:payload.action==='reject'?payload.note.trim():''});
  return {status:200,body:structuredClone(item),next};
 }
 if(method!=='POST'||path!=='/api/receipts')return fail(404,'Không tìm thấy API mock.');
 if(role!=='keeper')return fail(403,'Chỉ Thủ kho được lập phiếu nhập.');
 const lines=payload.lines,error=validate(state,lines);if(error)return fail(400,error);
 if(new Set(lines.map(l=>l.productId)).size!==lines.length)return fail(409,'Phiếu có mã hàng trùng. Mỗi mã chỉ được xuất hiện một dòng; hãy sửa phiếu.');
 for(const l of lines)if(!Number.isSafeInteger(state.products.find(p=>p.id===l.productId).stock+l.quantity))return fail(400,'Tồn kho vượt giới hạn an toàn.');
 const next=structuredClone(state),receipt={id:`PN-${state.receipts.length+1}`,at:now(),actor:'Thủ kho demo',lines:structuredClone(lines)};
 for(const l of lines)next.products.find(p=>p.id===l.productId).stock+=l.quantity;
 next.receipts.push(receipt);
 return {status:201,body:structuredClone(receipt),next};
}

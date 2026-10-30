from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from pathlib import Path
import threading
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args): pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(root)))
threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':1100,'height':900}); errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(f'http://127.0.0.1:{server.server_port}/MO-DEMO.html')
  assert page.locator('#receiptSection').is_hidden()
  page.select_option('#role','keeper')
  assert page.locator('#receiptSection').is_visible()
  page.locator('#lines input').fill('3');page.click('#save')
  assert page.locator('#stock tr').first.inner_text().split('\t')[2]=='13'
  page.locator('#lines input').fill('-3');page.click('#save')
  assert 'lớn hơn 0' in page.inner_text('#message')
  assert page.locator('#stock tr').first.inner_text().split('\t')[2]=='13'
  page.locator('#lines input').fill('');page.click('#add')
  assert page.locator('#lines select').nth(1).input_value()=='SO'
  assert page.locator('#lines select').nth(1).locator('option[value="BUT"]').is_disabled()
  assert page.locator('#add').is_disabled()
  page.locator('#lines input').nth(1).fill('10');page.click('#save')
  assert 'Dòng 1 (BUT)' in page.inner_text('#message')
  assert page.locator('#stock tr').nth(1).inner_text().split('\t')[2]=='20'
  page.locator('#lines button').first.click();page.click('#save')
  assert page.locator('#stock tr').nth(1).inner_text().split('\t')[2]=='30'
  page.reload();page.select_option('#role','manager')
  assert page.locator('#receiptSection').is_hidden()
  assert page.locator('#stock tr').nth(1).inner_text().split('\t')[2]=='30'
  assert page.locator('#history p').count()==2
  assert page.locator('#save').is_disabled()
  page.select_option('#role','keeper');assert page.locator('#receiptSection').is_visible();page.click('#add');page.locator('#lines button').first.click()
  assert not page.locator('#lines select').first.locator('option[value="BUT"]').is_disabled()
  page.select_option('#role','manager');page.fill('#productId','THUOC');page.fill('#productName','Thước kẻ');page.fill('#productUnit','cây');page.click('#createProduct')
  assert page.locator('#createMessage').is_visible()
  assert 'Tạo mã hàng thành công: THUOC' in page.inner_text('#createMessage')
  assert page.locator('#createMessage').evaluate('(el)=>el.previousElementSibling.id==="createProduct"')
  page.fill('#productId','THUOC');page.fill('#productName','Trùng mã');page.fill('#productUnit','cây');page.click('#createProduct')
  assert 'đã tồn tại' in page.inner_text('#createMessage')
  assert page.locator('#createMessage').evaluate('(el)=>el===document.activeElement')
  page.fill('#productId','');page.click('#createProduct')
  assert page.locator('#createMessage').get_attribute('class')=='error'
  page.reload();page.select_option('#role','keeper')
  assert page.locator('#catalog').is_hidden()
  page.select_option('#lines select','THUOC');page.locator('#lines input').fill('7');page.click('#save')
  assert page.locator('#stock tr').nth(2).inner_text().split('\t')[2]=='7'
  page.select_option('#adjustProduct','THUOC');page.fill('#adjustQuantity','2');page.fill('#adjustReason','Bị hỏng');page.click('#requestAdjustment')
  assert 'tồn chưa thay đổi' in page.inner_text('#message')
  assert page.locator('#stock tr').nth(2).inner_text().split('\t')[2]=='7'
  page.select_option('#role','manager');page.get_by_role('button',name='Duyệt DC-1',exact=True).click()
  assert page.locator('#stock tr').nth(2).inner_text().split('\t')[2]=='5'
  assert page.locator('#reviewMessage').is_visible()
  assert 'Duyệt DC-1 thành công' in page.inner_text('#reviewMessage')
  assert page.locator('#reviewMessage').evaluate('(el)=>el.previousElementSibling.id==="adjustmentList"')
  page.select_option('#manageProduct','THUOC');page.fill('#editName','Thước mới');page.click('#editProduct')
  assert 'Thước mới' in page.inner_text('#stock')
  assert page.locator('#catalogMessage').is_visible()
  assert 'Chỉnh sửa hàng thành công' in page.inner_text('#catalogMessage')
  assert page.locator('#editProduct').locator('..').get_by_role('button').count()==2
  page.click('#deleteProduct')
  assert 'còn 5 cây trong kho' in page.inner_text('#catalogMessage')
  assert page.locator('#manageProduct option[value="THUOC"]').count()==1
  page.fill('#productId','TEMP');page.fill('#productName','Tạm');page.fill('#productUnit','cái');page.click('#createProduct')
  page.select_option('#manageProduct','TEMP');page.click('#deleteProduct');page.click('#cancelDelete')
  assert 'Đã hủy xóa' in page.inner_text('#catalogMessage')
  assert page.locator('#manageProduct option[value="TEMP"]').count()==1
  page.fill('#editId','TEMP2');page.click('#editProduct')
  page.click('#deleteProduct');assert page.locator('#deleteConfirmation').is_visible();page.click('#confirmDelete')
  assert page.locator('#manageProduct option[value="TEMP2"]').count()==0
  assert page.locator('#catalogMessage').is_visible()
  assert 'Xóa hàng thành công' in page.inner_text('#catalogMessage')
  assert 'TEMP2' in page.inner_text('#catalogMessage')
  assert page.locator('#catalogMessage').evaluate('(el)=>el===document.activeElement')
  assert page.locator('#catalogMessage').evaluate('(el)=>{const r=el.getBoundingClientRect();return r.top>=0 && r.bottom<=innerHeight}')
  page.select_option('#manageProduct','BUT');assert 'TEMP2' in page.inner_text('#catalogMessage')
  page.click('#deleteProduct')
  assert 'Không thể xóa BUT' in page.inner_text('#catalogMessage')
  assert page.locator('#deleteConfirmation').is_hidden()
  page.select_option('#role','keeper');page.select_option('#adjustProduct','BUT');page.fill('#adjustQuantity','1');page.fill('#adjustReason','Kiểm kê');page.click('#requestAdjustment')
  page.select_option('#role','manager');page.get_by_role('button',name='Từ chối DC-2',exact=True).click()
  assert 'Cần lý do từ chối' in page.inner_text('#reviewMessage')
  assert page.locator('#reviewMessage').get_attribute('class')=='error'
  page.get_by_label('Lý do từ chối DC-2',exact=True).fill('Cần kiểm đếm lại');page.get_by_role('button',name='Từ chối DC-2',exact=True).click()
  assert 'Cần kiểm đếm lại' in page.inner_text('#adjustmentList')
  assert 'Từ chối DC-2 thành công' in page.inner_text('#reviewMessage')
  assert page.locator('#reviewMessage').evaluate('(el)=>el===document.activeElement')
  page.reload();page.select_option('#role','manager');assert 'Đã duyệt' in page.inner_text('#adjustmentList');assert 'Từ chối' in page.inner_text('#adjustmentList')
  page.select_option('#role','keeper');page.select_option('#adjustProduct','BUT');page.fill('#adjustQuantity','13');page.fill('#adjustReason','Kiểm kê giảm hết');page.click('#requestAdjustment')
  page.select_option('#role','manager');page.get_by_role('button',name='Duyệt DC-3',exact=True).click()
  assert page.locator('#stock tr').first.inner_text().split('\t')[2]=='0'
  page.select_option('#manageProduct','BUT');page.click('#deleteProduct');page.click('#confirmDelete')
  assert 'Xóa hàng thành công: BUT' in page.inner_text('#catalogMessage')
  assert page.locator('#catalogMessage').is_visible()
  assert page.locator('#manageProduct option[value="BUT"]').count()==0
  assert 'BUT' in page.inner_text('#history')
  assert 'Kiểm kê giảm hết' in page.inner_text('#adjustmentList')
  page.reload();page.select_option('#role','manager')
  assert page.locator('#manageProduct option[value="BUT"]').count()==0
  assert 'BUT' in page.inner_text('#history')
  assert not errors, errors
  page.screenshot(path=str(root/'demo-desktop.png'),full_page=True)
  page.set_viewport_size({'width':390,'height':844})
  assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
  page.screenshot(path=str(root/'demo-mobile.png'),full_page=True)
  browser.close()
 print('PASS browser v2: valid receipt, negative rejection, row-specific empty error, So 20+10=30, unique options, add limit, option restored after removal, persistence, manager cannot receive; manager creates product, reload and keeper receives it; no JS errors, mobile width.')
finally: server.shutdown()

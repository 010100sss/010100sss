function saveToCache(k, v) { try { localStorage.setItem('mugen_' + k, JSON.stringify(v)) } catch (e) {} }
function loadFromCache(k, d) { try { const v = localStorage.getItem('mugen_' + k); if (v !== null) return JSON.parse(v) } catch (e) {} return d }
let R = [], updatesData = [], cP = 'home', sQ = '', _sTimer = null, _curUser = null, _fromPage = 'home';
const _tC = document.getElementById('tC'), _ct = document.getElementById('ct'), _sI = document.getElementById('sI'), _sbMobile = document.getElementById('sbMobile'), _moOv = document.getElementById('moOv');
let _navItems = null, _pages = null;
function getNavItems() { if (!_navItems) _navItems = document.querySelectorAll('.n'); return _navItems }
function getPages() { if (!_pages) _pages = document.querySelectorAll('.pg'); return _pages }
function toast(m) { const d = document.createElement('div'); d.className = 'ti'; d.textContent = m; _tC.appendChild(d); requestAnimationFrame(() => d.classList.add('sh')); setTimeout(() => { d.classList.remove('sh'); setTimeout(() => d.remove(), 300) }, 2500) }
function opM(id) { document.getElementById(id).classList.add('sh'); document.body.style.overflow = 'hidden' }
function clM(id) { document.getElementById(id).classList.remove('sh'); document.body.style.overflow = '' }
function cp(t) { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(t).then(() => toast('复制成功')).catch(() => fallbackCopy(t)) } else fallbackCopy(t) }
function fallbackCopy(t) { try { const i = document.createElement('input'); i.value = t; i.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0'; document.body.appendChild(i); i.select(); document.execCommand('copy'); document.body.removeChild(i); toast('复制成功') } catch (e) { toast('复制失败，请手动复制') } }
function updateThemeColor(isLight) { const meta = document.getElementById('themeColorMeta'); if (meta) meta.content = isLight ? '#f5f5f5' : '#0a0a0f' }
function tgSw(el) { el.classList.toggle('on'); const isLight = el.classList.contains('on'); if (isLight) { document.body.classList.remove('light-theme'); saveToCache('theme', 'dark') } else { document.body.classList.add('light-theme'); saveToCache('theme', 'light') } updateThemeColor(!isLight); toast(isLight ? '夜间模式' : '日间模式') }
function tgSB() { const isOpen = _sbMobile.classList.toggle('op'); _moOv.classList.toggle('sh', isOpen) }
function openLoginPage() { window.location.href = 'login.html' }
// ===== Supabase 客户端配置 =====
const _SB_URL = 'https://zsqqyvmoejbljzvztclf.supabase.co';
const _SB_KEY = 'sb_publishable_W8Wz85rKZOwqa76AG0WNGw_JjK2_8qE';
const _sb = supabase.createClient(_SB_URL, _SB_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
});
async function handleLogout() {
    const btns = document.querySelectorAll('#profileContent button');
    let btn = null;
    for (const b of btns) if (b.textContent.trim() === '退出账号') { btn = b; break; }
    if (btn) { btn.disabled = true; btn.innerHTML = '<iconify-icon icon="lucide:loader-circle" width="15" class="animate-spin"></iconify-icon> 正在退出...'; }
    await _sb.auth.signOut();
    toast('已退出登录');
    localStorage.removeItem('mugen_login_sync');
    if (R.length) { R.forEach(item => { item.fav = false; item.paid = false; }); if (cP === 'home') rH(); else if (cP === 'fav') rF(); else if (cP === 'purchased') rP(); }
}
async function handleChangePassword() {
    if (!_curUser) { toast('请先登录'); return; }
    const pw = document.getElementById('chPwNew').value, cf = document.getElementById('chPwConf').value;
    if (!pw || pw.length < 6) { setChPwMsg('新密码至少需要6位', true); return; }
    if (pw !== cf) { setChPwMsg('两次密码不一致', true); return; }
    const btn = document.getElementById('chPwBtn');
    btn.disabled = true; btn.textContent = '请稍候…';
    const { error } = await _sb.auth.updateUser({ password: pw });
    btn.disabled = false; btn.textContent = '确认修改';
    if (error) { setChPwMsg(error.message || '修改失败', true); } else { setChPwMsg('密码修改成功', false); document.getElementById('chPwNew').value = ''; document.getElementById('chPwConf').value = ''; setTimeout(() => { clM('chPwM'); setChPwMsg('', false); }, 1500); }
}
function setChPwMsg(msg, isErr) { const el = document.getElementById('chPwMsg'); if (!msg) { el.style.display = 'none'; return; } el.style.display = 'block'; el.style.background = isErr ? 'rgba(239,68,68,.15)' : 'rgba(255,255,255,.08)'; el.style.color = isErr ? '#f87171' : 'rgba(255,255,255,.7)'; el.style.border = isErr ? '1px solid rgba(239,68,68,.3)' : '1px solid rgba(255,255,255,.1)'; el.textContent = msg; }
function applyUserData(favIds, paidIds) {
    let changed = false;
    R.forEach(item => { const nf = favIds.includes(item.id), np = paidIds.includes(item.id); if (nf !== item.fav || np !== item.paid) changed = true; item.fav = nf; item.paid = np; });
    if (!changed) return;
    if (cP === 'home') rH(); else if (cP === 'fav') rF(); else if (cP === 'purchased') rP();
}
async function pushUserMeta() {
    if (!_curUser) return;
    const favIds = R.filter(item => item.fav).map(item => item.id), paidIds = R.filter(item => item.paid).map(item => item.id);
    const { data, error } = await _sb.auth.updateUser({ data: { favs: favIds, paid: paidIds } });
    if (!error && data?.user) _curUser = data.user;
}
function updateAuthUI(user) {
    _curUser = user;
    const icon = document.getElementById('hAvIcon'), letter = document.getElementById('hAvLetter'), pc = document.getElementById('profileContent');
    if (user) {
        const initial = (user.email || 'U')[0].toUpperCase();
        if (icon) icon.classList.add('hidden');
        if (letter) { letter.textContent = initial; letter.classList.remove('hidden'); }
        if (pc) pc.innerHTML = `<div class="flex flex-col items-center gap-3 pb-5 mb-5" style="border-bottom:1px solid rgba(255,255,255,.06)"><div class="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-xl text-white font-bold">${initial}</div><div class="text-center"><p class="text-white font-medium text-sm">${user.email}</p><p class="text-white/30 text-xs mt-0.5">已登录账户</p></div></div><div class="flex flex-col gap-2"><button onclick="if(!_curUser){toast('请先登录');return;}opM('chPwM')" class="w-full py-2.5 rounded-xl text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition flex items-center justify-center gap-2"><iconify-icon icon="lucide:key-round" width="15"></iconify-icon>修改密码</button><button onclick="handleLogout()" class="w-full py-2.5 rounded-xl text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition flex items-center justify-center gap-2"><iconify-icon icon="lucide:log-out" width="15"></iconify-icon>退出账号</button></div>`;
        if (R.length) { const favIds = user.user_metadata?.favs || [], paidIds = user.user_metadata?.paid || []; applyUserData(favIds, paidIds); }
    } else {
        if (icon) icon.classList.remove('hidden');
        if (letter) { letter.textContent = ''; letter.classList.add('hidden'); }
        if (pc) pc.innerHTML = `<iconify-icon icon="lucide:user" width="48" class="text-white/20 mx-auto mb-4"></iconify-icon><p class="text-white/40 text-sm mb-6">登录后查看个人资料</p><button onclick="openLoginPage()" class="w-full py-2.5 rounded-xl text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition">登录 / 注册</button>`;
        if (R.length) { R.forEach(item => { item.fav = false; item.paid = false; }); applyUserData([], []); }
    }
}
(function checkLoginSync() {
    const sync = localStorage.getItem('mugen_login_sync');
    if (sync) {
        localStorage.removeItem('mugen_login_sync');
        setTimeout(async () => {
            try {
                const { data: { session } } = await _sb.auth.getSession();
                if (session) { updateAuthUI(session.user); toast('登录成功'); if (cP === 'home') rH(); else if (cP === 'fav') rF(); else if (cP === 'purchased') rP(); }
                else { setTimeout(async () => { const { data: { session: s2 } } = await _sb.auth.getSession(); if (s2) { updateAuthUI(s2.user); toast('登录成功'); if (cP === 'home') rH(); else if (cP === 'fav') rF(); else if (cP === 'purchased') rP(); } }, 500); }
            } catch (e) {}
        }, 300);
    }
})();
_sb.auth.onAuthStateChange((_event, session) => { if (_event === 'PASSWORD_RECOVERY') { toast('请前往登录页面重置密码'); window.location.href = 'login.html'; } updateAuthUI(session ? session.user : null); });
_sb.auth.getSession().then(({ data: { session } }) => { updateAuthUI(session ? session.user : null); if (session && localStorage.getItem('mugen_needProfile')) { localStorage.removeItem('mugen_needProfile'); setTimeout(() => go('profile'), 200); } });
window.addEventListener('storage', function(e) { if (e.key === 'mugen_login_sync' && e.newValue) { _sb.auth.getSession().then(({ data: { session } }) => { updateAuthUI(session ? session.user : null); if (session) { toast('登录成功'); localStorage.removeItem('mugen_login_sync'); if (cP === 'home') rH(); else if (cP === 'fav') rF(); else if (cP === 'purchased') rP(); } }); } });
function go(p) { if (cP !== 'detail') _fromPage = cP; cP = p; getNavItems().forEach(n => n.classList.toggle('on', n.dataset.p === p)); getPages().forEach(el => el.classList.remove('on')); const target = document.getElementById('p-' + p); if (target) target.classList.add('on'); _sI.value = ''; sQ = ''; if (p === 'home') rH(); if (p === 'fav') rF(); if (p === 'purchased') rP(); if (p === 'updates') rU(); _ct.scrollTop = 0; if (window.innerWidth <= 768 && _sbMobile.classList.contains('op')) tgSB() }
function doS() { clearTimeout(_sTimer); _sTimer = setTimeout(() => { sQ = _sI.value.trim().toLowerCase(); if (cP !== 'home') go('home'); rH() }, 300) }
function cHTML(r, sp) { const fc = r.fav ? 'on' : ''; let pt = ''; if (sp && r.paid) pt = '<span class="text-xs text-emerald-400/70 bg-emerald-400/10 px-2 py-0.5 rounded-md ml-2">已付费</span>'; return `<div class="c p-4 flex gap-4 items-start" data-card="${r.id}" onclick="goDt(${r.id})"><div class="db w-20 h-20 flex-shrink-0"><img src="${r.cover||''}" class="w-full h-full object-cover rounded" loading="lazy" decoding="async" onerror="this.parentElement.innerHTML='图片'"></div><div class="flex-1 min-w-0"><div class="flex items-center"><h3 class="text-white text-sm font-medium leading-snug truncate">${r.name||'未命名'}</h3>${pt}</div><p class="text-white/30 text-xs mt-1.5">${r.size||'未知大小'} · ${r.time||'刚刚'}</p></div><div class="flex flex-col gap-2 flex-shrink-0" onclick="event.stopPropagation()"><span class="ht ${fc}" data-fav="${r.id}" onclick="tgF(${r.id})" title="收藏"><iconify-icon icon="lucide:star" width="18"></iconify-icon></span><button class="bd px-3 py-1.5 rounded-lg text-xs" onclick="opD(${r.id})">下载</button></div></div>` }
function renderList(gId, eId, filter) { let items = R.filter(filter); items.sort((a, b) => (b.time || '').localeCompare(a.time || '')); const g = document.getElementById(gId), e = document.getElementById(eId); if (!g || !e) return; if (items.length) { g.innerHTML = items.map(r => cHTML(r, false)).join(''); g.classList.remove('hidden'); e.classList.add('hidden'); e.classList.remove('flex') } else { g.classList.add('hidden'); e.classList.remove('hidden'); e.classList.add('flex') } const tc = document.getElementById('totalCount'); if (tc) tc.textContent = R.length }
function rH() { renderList('hG', 'hE', r => sQ ? r.name.toLowerCase().includes(sQ) : true) }
function rF() { renderList('fvG', 'fvE', r => r.fav) }
function rP() { renderList('puG', 'puE', r => r.paid) }
function rU() { const list = document.getElementById('upL'); if (!list) return; if (updatesData.length) { const sorted = [...updatesData].sort((a, b) => b.d.localeCompare(a.d)); list.innerHTML = sorted.map(x => `<div class="glass rounded-xl p-4"><div class="flex items-center gap-3 mb-2"><span class="text-xs font-medium text-white/70 bg-white/10 px-2 py-0.5 rounded-md">${x.v}</span><span class="text-xs text-white/30">${x.d}</span></div><p class="text-white/50 text-sm">${x.t}</p></div>`).join('') } }
function tgF(id) { const r = R.find(item => item.id === id); if (!r) return; if (!_curUser) { toast('请登录后再收藏'); return; } r.fav = !r.fav; toast(r.fav ? '已收藏' : '已取消收藏'); document.querySelectorAll('[data-fav="' + id + '"]').forEach(el => el.classList.toggle('on', r.fav)); const dh = document.querySelector('#dtC .ht'); if (dh) dh.classList.toggle('on', r.fav); pushUserMeta(); if (cP === 'fav') rF() }

// ============================================================
// ===== 评论功能 =====
// ============================================================

function toggleComments(resourceId) {
    const section = document.getElementById('commentSection');
    const btn = document.getElementById('commentToggleBtn');
    if (!section || !btn) return;
    const isHidden = section.classList.contains('hidden');
    if (isHidden) {
        section.classList.remove('hidden');
        btn.innerHTML = '💬 评论(<span id="commentCount">0</span>) ▲';
        loadComments(resourceId);
    } else {
        section.classList.add('hidden');
        btn.innerHTML = '💬 评论(<span id="commentCount">0</span>) ▶';
    }
}

async function loadComments(resourceId) {
    const list = document.getElementById('commentList');
    const countEl = document.getElementById('commentCount');
    if (!list) return;
    
    try {
        const { data, error } = await _sb
            .from('comments')
            .select('*')
            .eq('resource_id', resourceId)
            .order('created_at', { ascending: false })
            .headers({ apikey: _SB_KEY });

        if (error) {
            console.error('加载评论失败:', error);
            list.innerHTML = '<p class="text-white/30 text-sm">评论加载失败</p>';
            return;
        }

        if (countEl) countEl.textContent = data ? data.length : 0;

        if (!data || data.length === 0) {
            list.innerHTML = '<p class="text-white/30 text-sm text-center py-4">暂无评论，来说点什么吧</p>';
            return;
        }

        list.innerHTML = data.map(c => `
            <div class="bg-white/5 rounded-xl px-4 py-3">
                <div class="flex items-center gap-2 mb-1">
                    <span class="text-white/60 text-xs font-medium">${escapeHtml(c.user_email)}</span>
                    <span class="text-white/20 text-xs">${new Date(c.created_at).toLocaleString()}</span>
                </div>
                <p class="text-white/80 text-sm">${escapeHtml(c.content)}</p>
            </div>
        `).join('');
    } catch (e) {
        console.error('加载评论异常:', e);
        list.innerHTML = '<p class="text-white/30 text-sm">加载失败，请刷新重试</p>';
    }
}

function getCurrentResourceId() {
    const btn = document.getElementById('commentToggleBtn');
    if (btn && btn.dataset.resourceId) return parseInt(btn.dataset.resourceId);
    return null;
}

async function submitComment() {
    if (!_curUser) {
        toast('请先登录');
        return;
    }
    const input = document.getElementById('commentInput');
    if (!input) {
        toast('输入框未找到');
        return;
    }
    const content = input.value.trim();
    if (!content) {
        toast('请输入内容');
        return;
    }
    const resourceId = getCurrentResourceId();
    if (!resourceId) {
        toast('获取资源信息失败');
        return;
    }
    
    try {
        const { data, error } = await _sb
            .from('comments')
            .insert({
                resource_id: resourceId,
                user_email: _curUser.email,
                content: content
            })
            .select()
            .headers({ apikey: _SB_KEY });

        if (error) {
            console.error('发送评论失败:', error);
            toast('发送失败: ' + error.message);
            return;
        }
        toast('评论成功');
        input.value = '';
        loadComments(resourceId);
    } catch (e) {
        console.error('发送评论异常:', e);
        toast('发送失败，请重试');
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================================
// ===== goDt 详情页（已包含评论按钮和评论区） =====
// ============================================================

function goDt(id) {
    const r = R.find(item => item.id === id);
    if (!r) { toast('资源不存在'); return }
    if (cP !== 'detail') _fromPage = cP;
    document.getElementById('dtC').innerHTML = `
        <div class="glass rounded-2xl overflow-hidden">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-0">
                <div class="aspect-[4/3] bg-white/5 flex items-center justify-center overflow-hidden">
                    <img src="${r.img1||r.cover||''}" class="w-full h-full object-cover" 
                         onerror="this.parentElement.innerHTML='<span class=\\'text-white/15 text-xs\\'>图片1</span>'">
                </div>
                <div class="aspect-[4/3] bg-white/5 flex items-center justify-center overflow-hidden">
                    <img src="${r.img2||r.cover||''}" class="w-full h-full object-cover" 
                         onerror="this.parentElement.innerHTML='<span class=\\'text-white/15 text-xs\\'>图片2</span>'">
                </div>
                <div class="aspect-[4/3] bg-white/5 flex items-center justify-center overflow-hidden">
                    <img src="${r.img3||r.cover||''}" class="w-full h-full object-cover" 
                         onerror="this.parentElement.innerHTML='<span class=\\'text-white/15 text-xs\\'>图片3</span>'">
                </div>
            </div>
            <div class="p-6 md:p-8">
                <h2 class="text-white text-xl font-semibold mb-3">${r.name||'未命名'}</h2>
                <div class="flex flex-wrap gap-2 mb-5">
                    <span class="tag"><iconify-icon icon="lucide:hard-drive" width="12"></iconify-icon>${r.size||'未知大小'}</span>
                    <span class="tag"><iconify-icon icon="lucide:clock" width="12"></iconify-icon>${r.time||'刚刚'}</span>
                    <span class="tag"><iconify-icon icon="lucide:monitor" width="12"></iconify-icon>${r.compat||'通用'}</span>
                </div>
                <div class="mb-6">
                    <h3 class="text-white/60 text-xs font-medium uppercase tracking-wider mb-2">资源介绍</h3>
                    <p class="text-white/40 text-sm leading-relaxed">${r.desc||'暂无介绍'}</p>
                </div>
                <div class="flex items-center gap-3 flex-wrap">
                    <span class="ht ${r.fav?'on':''} text-lg" data-fav="${r.id}" onclick="tgF(${r.id})" title="收藏">
                        <iconify-icon icon="lucide:star" width="20"></iconify-icon>
                    </span>
                    <button class="bd px-5 py-2.5 rounded-xl text-sm font-medium" onclick="opD(${r.id})">下载</button>
                    <button id="commentToggleBtn" class="bd px-5 py-2.5 rounded-xl text-sm font-medium" 
                            onclick="toggleComments(${r.id})" data-resource-id="${r.id}">
                        💬 评论(<span id="commentCount">0</span>) ▶
                    </button>
                </div>
                <div id="commentSection" class="mt-6 pt-4 border-t border-white/10 hidden">
                    <div id="commentList" class="space-y-3"></div>
                    <div class="mt-4 flex gap-2">
                        <input id="commentInput" type="text" placeholder="说点什么..." 
                               class="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30">
                        <button onclick="submitComment()" class="bd px-4 py-2 rounded-xl text-sm">发送</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    cP = 'detail';
    getPages().forEach(el => el.classList.remove('on'));
    document.getElementById('p-detail').classList.add('on');
    _ct.scrollTop = 0;
}

const _enablePaidDownload = false;
function opD(id) {
    const r = R.find(item => item.id === id);
    if (!r) return;
    if (_enablePaidDownload) {
        if (r.paid) { document.getElementById('dlB').innerHTML = `<div class="flex items-center gap-3 p-4 rounded-xl bg-white/5"><div class="flex-1 min-w-0"><p class="text-white/40 text-xs mb-1">下载链接</p><p class="text-white text-sm truncate">${r.dl||''}</p></div><button onclick="cp('${r.dl||''}')" class="copy-btn text-xs text-white/50 hover:text-white/80 transition px-3 py-1.5 rounded-lg bg-white/8 hover:bg-white/15">复制</button></div>`; opM('dlM'); return; }
        document.getElementById('dlB').innerHTML = `<div class="grid grid-cols-1 sm:grid-cols-2 gap-4"><div class="p-4 rounded-xl bg-white/5 flex flex-col items-center"><p class="text-white/60 text-xs font-medium mb-3">付费下载</p><img src="固定图片/收款码.jpg" class="w-full max-w-[160px] h-auto rounded-lg mb-3 object-cover" onerror="this.style.display='none'"><p class="text-white text-lg font-semibold mb-3">${r.price||'¥0'}</p><button onclick="mkPd(${r.id})" class="w-full py-2 rounded-xl text-sm font-medium bg-white/15 text-white hover:bg-white/25 transition">我已付费</button></div><div class="p-4 rounded-xl bg-white/5 flex flex-col items-center"><p class="text-white/60 text-xs font-medium mb-3">免费下载</p><img src="/固定图片/群二维码.jpg" class="w-full max-w-[160px] h-auto rounded-lg mb-3 object-cover" onerror="this.style.display='none'"><p class="text-white/40 text-xs mt-1">加入QQ群：1044609733</p><button onclick="cp('1044609733')" class="copy-btn text-xs text-white/40 hover:text-white/70 transition px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10">复制</button></div></div>`;
    } else {
        document.getElementById('dlB').innerHTML = `<div class="flex flex-col items-center p-4 rounded-xl bg-white/5"><p class="text-white/60 text-xs font-medium mb-3">免费下载</p><img src="/固定图片/群二维码.jpg" class="w-full max-w-[160px] h-auto rounded-lg mb-3 object-cover" onerror="this.style.display='none'"><p class="text-white/40 text-xs mt-1">加入QQ群：1044609733</p><button onclick="cp('1044609733')" class="copy-btn text-xs text-white/40 hover:text-white/70 transition px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10">复制</button></div>`;
    }
    opM('dlM')
}
function mkPd(id) { const r = R.find(item => item.id === id); if (!r) { toast('资源不存在'); return } if (r.paid) { toast('该资源已付费'); return } r.paid = true; clM('dlM'); toast('付费成功'); pushUserMeta(); rP(); opD(id) }
function restoreCache() {
    const theme = loadFromCache('theme', 'light'), toggle = document.getElementById('themeToggle');
    let isLight = false;
    if (theme === 'light') { toggle.classList.remove('on'); document.body.classList.add('light-theme'); isLight = true; } else { toggle.classList.add('on'); document.body.classList.remove('light-theme'); }
    updateThemeColor(isLight);
    try { localStorage.removeItem('mugen_favs'); localStorage.removeItem('mugen_paid'); } catch (e) {}
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') { clM('dlM'); clM('spM'); clM('anM'); clM('chPwM'); } });
restoreCache();
fetch('data.json').then(res => res.json()).then(data => { 
    if (data.resources && data.resources.length) {
        R = data.resources;
    }
    updatesData = data.updates || []; 
    if (_curUser) { const favIds = _curUser.user_metadata?.favs || [], paidIds = _curUser.user_metadata?.paid || []; R.forEach(item => { if (favIds.includes(item.id)) item.fav = true; if (paidIds.includes(item.id)) item.paid = true }); } 
    if (!R.length) toast('暂无资源'); 
    rH() 
}).catch(() => { toast('加载失败'); rH() });
opM('anM');

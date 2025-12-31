// --- VERİLER ---
let personnel = [
    { id: 1, name: "Mehmet Öz", dept: "Sistem Yönetimi", salary: 45000, perf: 98 },
    { id: 2, name: "Ayşe Kaya", dept: "İnsan Kaynakları", salary: 32000, perf: 85 },
    { id: 3, name: "Ali Veli", dept: "Veritabanı", salary: 38000, perf: 92 },
    { id: 4, name: "Zeynep Su", dept: "Halkla İlişkiler", salary: 29000, perf: 78 },
];

let applications = [
    { id: 201, name: "Ahmet Yılmaz", pos: "Siber İstihbarat Uzmanı", exp: "8 Yıl", score: 98 },
    { id: 202, name: "Elif Demir", pos: "Kriptografi Analisti", exp: "5 Yıl", score: 94 },
    { id: 203, name: "Caner Kara", pos: "Ağ Sızma Testçisi", exp: "12 Yıl", score: 99 }
];

let lanDevices = [
    { id: 101, name: "Admin-PC-Main", ip: "192.168.1.10", mac: "00:1B:44:11:3A:B7", ping: "2ms", status: "online" },
    { id: 102, name: "Firewall-Gateway", ip: "192.168.1.1", mac: "AA:BB:CC:DD:EE:FF", ping: "1ms", status: "online" },
    { id: 103, name: "Unknown-Android", ip: "192.168.1.45", mac: "A2:4B:22:11:9A:00", ping: "124ms", status: "offline" },
    { id: 104, name: "Ofis-Yazıcı-01", ip: "192.168.1.200", mac: "B4:22:11:00:AA:11", ping: "8ms", status: "online" },
    { id: 105, name: "Misafir-Laptop", ip: "192.168.1.199", mac: "FF:FF:00:11:22:33", ping: "45ms", status: "online" },
];

let notes = [];
let systemLogs = [
    { time: "10:42:05", event: "Yönetici Girişi", user: "Admin (192.168.1.10)", status: "success", statusText: "Başarılı" },
    { time: "09:15:00", event: "Otomatik Yedekleme", user: "System Daemon", status: "success", statusText: "Tamamlandı" },
    { time: "03:45:12", event: "Port Taraması (LAN)", user: "192.168.1.45", status: "danger", statusText: "Engellendi" }
];

// --- SİMÜLASYON DEĞİŞKENLERİ ---
let simulationActive = false;
let insiderSimulationActive = false;
let attackerIP = "0.0.0.0";
let glitchInterval = null;
let budgetInterval = null;
let currentBudget = 845000;
let suspiciousUser = "";

// --- YARDIMCI FONKSİYONLAR ---
function showConfirm(title, message, callback) {
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-message').innerText = message;
    document.getElementById('modal-input-container').style.display = 'none';
    document.getElementById('custom-modal').style.display = 'flex';
    document.getElementById('modal-cancel').style.display = 'inline-flex';
    document.getElementById('modal-confirm').onclick = () => { closeModal(); if(callback) callback(true); };
    document.getElementById('modal-cancel').onclick = () => { closeModal(); if(callback) callback(false); };
}

function showPrompt(title, message, defaultValue, callback) {
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-message').innerText = message;
    const inputContainer = document.getElementById('modal-input-container');
    inputContainer.style.display = 'block';
    const input = document.getElementById('modal-input');
    input.value = defaultValue || '';
    document.getElementById('modal-cancel').style.display = 'inline-flex';
    document.getElementById('custom-modal').style.display = 'flex';
    input.focus();
    document.getElementById('modal-confirm').onclick = () => { const val = input.value; closeModal(); if(callback) callback(val); };
    document.getElementById('modal-cancel').onclick = () => { closeModal(); if(callback) callback(null); };
}

function showAlert(title, message) {
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-message').innerText = message;
    document.getElementById('modal-input-container').style.display = 'none';
    document.getElementById('custom-modal').style.display = 'flex';
    document.getElementById('modal-cancel').style.display = 'none';
    document.getElementById('modal-confirm').onclick = closeModal;
}

function closeModal() { document.getElementById('custom-modal').style.display = 'none'; }

function showInstructions() {
    document.getElementById('instructions-modal').style.display = 'flex';
}

// --- LOGLAR ---
function renderLogs() {
    const tbody = document.getElementById('log-list');
    tbody.innerHTML = "";
    systemLogs.forEach(log => {
        let badgeClass = log.status === 'success' ? 'badge-online' : (log.status === 'danger' ? 'badge-offline' : 'badge-warn');
        const tr = document.createElement('tr');
        tr.innerHTML = `<td style="font-family:monospace; color:#64748b;">${log.time}</td><td style="font-weight:600;">${log.event}</td><td>${log.user}</td><td><span class="badge ${badgeClass}">${log.statusText}</span></td>`;
        tbody.appendChild(tr);
    });
}
function addLog(event, user, status, statusText) {
    systemLogs.unshift({ time: new Date().toLocaleTimeString('tr-TR'), event, user, status, statusText });
    if(systemLogs.length > 10) systemLogs.pop();
    renderLogs();
}

// --- UI ---
function showSection(sectionId, btnElement) {
    document.querySelectorAll('.section').forEach(el => el.style.display = 'none');
    document.getElementById(sectionId).style.display = 'block';
    const titles = {'dashboard': 'Genel Bakış', 'personnel': 'Personel Yönetimi', 'applications': 'Yüksek Güvenlikli Alan', 'lan': 'Ağ Altyapısı (LAN)', 'notes': 'Görevler ve Bildirimler'};
    if(titles[sectionId]) document.getElementById('page-title').innerText = titles[sectionId];
    document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));
    if(btnElement) btnElement.classList.add('active');
}

function showBanner(title, text, type = 'normal') {
    const banner = document.getElementById('notificationBanner');
    document.getElementById('notifTitle').innerText = title;
    document.getElementById('notifText').innerText = text;
    banner.className = 'notification-banner';
    if(type === 'alert') banner.classList.add('alert');
    else if(type === 'warn') banner.classList.add('warn');
    banner.style.display = 'flex';
}
function closeBanner() { document.getElementById('notificationBanner').style.display = 'none'; }

// --- TERMİNAL ---
function toggleTerminal(show) {
    const term = document.getElementById('terminal');
    term.style.display = show ? 'flex' : 'none';
    if(show) document.getElementById('terminal-input').focus();
}
function terminalPrint(text, type = 'info') {
    const body = document.getElementById('terminal-body');
    const div = document.createElement('div');
    div.className = 'log-entry';
    if(type === 'error') div.className += ' log-error'; if(type === 'warn') div.className += ' log-warn'; if(type === 'success') div.className += ' log-success';
    div.innerText = `> ${text}`;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
}

// --- SYSTEM LOCKDOWN (YENİ) ---
function triggerSystemLockdown() {
    clearInterval(budgetInterval);
    document.getElementById('lockdown-overlay').style.display = 'flex';
    toggleTerminal(false);
    
    let timeLeft = 25;
    const timerEl = document.getElementById('restart-timer');
    
    const countdown = setInterval(() => {
        timeLeft--;
        timerEl.innerText = timeLeft;
        if(timeLeft <= 0) {
            clearInterval(countdown);
            location.reload(); // Sayfayı sıfırdan yükle
        }
    }, 1000);
}

// --- SİMÜLASYONLAR ---
function startSimulation() {
    if(simulationActive || insiderSimulationActive) return alert("Zaten aktif bir tatbikat var!");
    simulationActive = true;
    attackerIP = `${Math.floor(Math.random()*200+50)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`;
    document.body.classList.add('alert-mode');
    document.getElementById('system-dot').style.backgroundColor = 'red';
    document.getElementById('system-text').innerText = "SİSTEM SALDIRI ALTINDA";
    document.getElementById('system-text').style.color = "red";
    addLog("KRİTİK: Bilinmeyen Trafik Artışı", "WARNING", "danger", "Saldırı");
    showBanner("GÜVENLİK UYARISI", "Sisteme sızma girişimi tespit edildi!", "alert");
    toggleTerminal(true);
    terminalPrint("DIŞ SALDIRI SİMÜLASYONU BAŞLATILDI", "warn");
    terminalPrint("HEDEF: Saldırgan IP adresini tespit et ve engelle.", "info");
    
    glitchInterval = setInterval(() => {
        if(!simulationActive) return;
        document.getElementById('stat-personnel').innerText = Math.floor(Math.random() * 999);
        document.getElementById('stat-uptime').innerText = (Math.random() * 100).toFixed(1) + "%";
        document.getElementById('stat-lan').innerText = Math.floor(Math.random() * 500);
        document.getElementById('stat-budget').innerText = "ERROR";
        document.querySelectorAll('.card-val').forEach(el => { el.style.color = Math.random() > 0.5 ? '#ef4444' : '#334155'; });
    }, 100);
}

function endSimulation() {
    simulationActive = false;
    clearInterval(glitchInterval);
    document.getElementById('stat-personnel').innerText = personnel.length;
    document.getElementById('stat-uptime').innerText = "99.9%";
    document.getElementById('stat-lan').innerText = lanDevices.filter(x => x.status === 'online').length;
    document.getElementById('stat-budget').innerText = `₺${currentBudget.toLocaleString()}`;
    document.querySelectorAll('.card-val').forEach(el => el.style.color = '');
    document.body.classList.remove('alert-mode');
    resetSystemStatus();
    showBanner("TEHDİT ENGELLENDİ", "Başarılı savunma. Sistem güvenli.", "normal");
    addLog(`Saldırı Engellendi: ${attackerIP}`, "Admin", "success", "Korundu");
}

function startInsiderSimulation() {
    if(simulationActive || insiderSimulationActive) return alert("Zaten aktif bir tatbikat var!");
    insiderSimulationActive = true;
    suspiciousUser = personnel[Math.floor(Math.random() * personnel.length)].name;
    document.body.classList.add('insider-mode');
    document.getElementById('system-dot').style.backgroundColor = 'orange';
    document.getElementById('system-text').innerText = "BÜTÇE SIZINTISI TESPİT EDİLDİ";
    document.getElementById('system-text').style.color = "orange";
    addLog("ANOMALİ: Yetkisiz Fon Transferi", "System", "danger", "Kritik");
    showBanner("FİNANSAL ALARM", "Bütçeden yetkisiz para çıkışı var!", "warn");
    toggleTerminal(true);
    terminalPrint("İÇ TEHDİT SİMÜLASYONU BAŞLATILDI", "warn");
    terminalPrint("DURUM: Bir personel yetkilerini kötüye kullanıyor.", "info");
    
    budgetInterval = setInterval(() => {
        if(!insiderSimulationActive) return;
        currentBudget -= 100000;
        
        // KİLİTLENME KONTROLÜ
        if(currentBudget <= 0) {
            currentBudget = 0;
            document.getElementById('stat-budget').innerText = "₺0";
            triggerSystemLockdown();
            return;
        }

        document.getElementById('stat-budget').innerText = `₺${currentBudget.toLocaleString()}`;
        terminalPrint(`UYARI: -₺100,000 transfer edildi! Kalan: ₺${currentBudget.toLocaleString()}`, "error");
        const budgetCard = document.getElementById('stat-budget').parentElement.parentElement;
        budgetCard.style.backgroundColor = '#fee2e2';
        setTimeout(() => budgetCard.style.backgroundColor = '', 500);
    }, 5000);
}

function endInsiderSimulation() {
    insiderSimulationActive = false;
    clearInterval(budgetInterval);
    document.body.classList.remove('insider-mode');
    resetSystemStatus();
    showBanner("TEHDİT ETKİSİZ HALE GETİRİLDİ", `${suspiciousUser} hesabı donduruldu.`, "normal");
    addLog(`İç Tehdit Engellendi: ${suspiciousUser}`, "Admin", "success", "Donduruldu");
}

function resetSystemStatus() {
    document.getElementById('system-dot').style.backgroundColor = '#10b981';
    document.getElementById('system-text').innerText = "Sistem Aktif";
    document.getElementById('system-text').style.color = "#94a3b8";
}

// --- TERMİNAL GİRDİ ---
document.getElementById('terminal-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        const rawCmd = this.value.trim();
        const cmd = rawCmd.toLowerCase();
        terminalPrint(rawCmd, 'info');
        this.value = '';

        if (cmd === 'help') {
            terminalPrint("KOMUT LİSTESİ:", "info");
            terminalPrint("- status: Sistem durumu", "info");
            terminalPrint("- clear: Ekranı temizle", "info");
            if(simulationActive) {
                terminalPrint("[SİMÜLASYON 1]", "warn");
                terminalPrint("- scan_threat: Tehdit tara", "info");
                terminalPrint("- firewall block [IP]: IP engelle", "info");
            }
            if(insiderSimulationActive) {
                terminalPrint("[SİMÜLASYON 2]", "warn");
                terminalPrint("- audit_logs: Logları denetle", "info");
                terminalPrint("- suspend_user [Ad Soyad]: Kullanıcıyı dondur", "info");
            }
        }
        else if (cmd === 'clear') { document.getElementById('terminal-body').innerHTML = ''; }
        else if (cmd === 'status') {
            if(simulationActive) terminalPrint("KRİTİK: Dış saldırı devam ediyor!", "error");
            else if(insiderSimulationActive) terminalPrint("KRİTİK: Bütçe sızıntısı var!", "warn");
            else terminalPrint("Sistem stabil.", "success");
        }
        else if (simulationActive && cmd === 'scan_threat') {
            terminalPrint("Tarama başlatılıyor...", "warn");
            setTimeout(() => { terminalPrint(`KAYNAK TESPİT EDİLDİ: ${attackerIP}`, "error"); }, 1500);
        }
        else if (simulationActive && cmd.startsWith('firewall block')) {
            const parts = cmd.split(' ');
            if(parts.length < 3) terminalPrint("HATA: IP adresi eksik.", "error");
            else if(parts[2] === attackerIP) {
                terminalPrint(`${parts[2]} engellendi. Savunma başarılı.`, "success");
                setTimeout(endSimulation, 1500);
            } else terminalPrint("HATA: IP adresi tehdit ile uyuşmuyor.", "error");
        }
        else if (insiderSimulationActive && cmd === 'audit_logs') {
            terminalPrint("Log analizi başlatılıyor...", "warn");
            setTimeout(() => {
                terminalPrint("ANALİZ SONUCU:", "info");
                personnel.forEach(p => {
                    if(p.name === suspiciousUser) terminalPrint(`[!] ${p.name}: YÜKSEK HACİMLİ TRANSFER (ŞÜPHELİ)`, "error");
                    else terminalPrint(`[OK] ${p.name}: Normal aktivite`, "success");
                });
            }, 1500);
        }
        else if (insiderSimulationActive && cmd.startsWith('suspend_user')) {
            const targetName = rawCmd.substring(13).trim(); 
            if(!targetName) terminalPrint("HATA: Kullanıcı adı belirtilmedi.", "error");
            else if(targetName.toLowerCase() === suspiciousUser.toLowerCase()) {
                terminalPrint(`KULLANICI TESPİT EDİLDİ: ${suspiciousUser}`, "success");
                terminalPrint("Hesap donduruluyor...", "warn");
                setTimeout(endInsiderSimulation, 1500);
            } else terminalPrint(`HATA: '${targetName}' adlı kullanıcı şüpheli değil.`, "error");
        }
        else terminalPrint("Bilinmeyen komut. 'help' yazın.", "error");
    }
});

// --- İŞLEVLER ---
function renderPersonnel() {
    const tbody = document.getElementById('personnel-list');
    tbody.innerHTML = "";
    personnel.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td style="font-weight:600; color:var(--secondary);">${p.name}</td><td>${p.dept}</td><td style="font-family:monospace;">₺${p.salary.toLocaleString()} <i class="fas fa-pen" style="font-size:0.8rem; color:var(--primary); cursor:pointer; margin-left:8px;" onclick="editSalary(${p.id})"></i></td><td><span class="badge badge-online">${p.perf} Puan</span></td><td><button class="btn btn-sm btn-danger" onclick="firePerson(${p.id}, this)">İlişiği Kes</button></td>`;
        tbody.appendChild(tr);
    });
    document.getElementById('stat-personnel').innerText = personnel.length;
}
function firePerson(id, btnElement) {
    showConfirm("Personel Çıkarma", "Onaylıyor musunuz?", (confirmed) => {
        if(confirmed) {
            const p = personnel.find(x => x.id === id);
            if(p) addLog(`Personel Çıkarıldı: ${p.name}`, "Admin", "danger", "Silindi");
            const row = btnElement.closest('tr');
            row.style.opacity = "0";
            setTimeout(() => { personnel = personnel.filter(x => x.id !== id); renderPersonnel(); }, 500);
        }
    });
}
function editSalary(id) {
    let p = personnel.find(x => x.id === id);
    showPrompt("Maaş Düzenle", "Yeni tutar:", p.salary, (val) => {
        if(val && !isNaN(val)) {
            p.salary = parseInt(val);
            addLog(`Maaş Güncelleme: ${p.name}`, "Admin", "warning", "Düzenlendi");
            renderPersonnel();
        }
    });
}
function renderApplications() {
    const tbody = document.getElementById('applications-list');
    tbody.innerHTML = "";
    if(applications.length === 0) { tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px;">Bekleyen başvuru bulunmamaktadır.</td></tr>`; return; }
    applications.forEach(app => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td style="font-weight:bold;">${app.name}</td><td>${app.pos}</td><td>${app.exp}</td><td>${app.score}/100</td><td><button class="btn btn-sm btn-success" onclick="acceptApp(${app.id}, this)"><i class="fas fa-check"></i> Kabul Et</button> <button class="btn btn-sm btn-danger" onclick="rejectApp(${app.id}, this)"><i class="fas fa-times"></i> Reddet</button></td>`;
        tbody.appendChild(tr);
    });
}
function acceptApp(id, btnElement) {
    const app = applications.find(x => x.id === id); if(!app) return;
    addLog(`İşe Alım: ${app.name}`, "Admin", "success", "Onaylandı");
    const row = btnElement.closest('tr'); row.classList.add('success-row'); row.innerHTML = `<td colspan="5" style="text-align:center; color:green; font-weight:bold;"><i class="fas fa-check-circle"></i> PERSONEL KADROSUNA ALINDI</td>`;
    setTimeout(() => {
        personnel.push({ id: Date.now(), name: app.name, dept: app.pos, salary: 30000, perf: 50 });
        applications = applications.filter(x => x.id !== id); renderApplications(); renderPersonnel(); showBanner(`${app.name} ekibe katıldı!`);
    }, 1000);
}
function rejectApp(id, btnElement) {
    showConfirm("Başvuru Reddi", "Emin misiniz?", (confirmed) => {
        if(confirmed) {
            const app = applications.find(x => x.id === id); if(app) addLog(`Başvuru Reddi: ${app.name}`, "Admin", "danger", "Reddedildi");
            const row = btnElement.closest('tr'); row.classList.add('blocked-row'); row.innerHTML = `<td colspan="5" style="text-align:center; color:red; font-weight:bold;"><i class="fas fa-ban"></i> BAŞVURU REDDEDİLDİ</td>`;
            setTimeout(() => { applications = applications.filter(x => x.id !== id); renderApplications(); }, 1000);
        }
    });
}
function renderLan() {
    const tbody = document.getElementById('lan-list'); tbody.innerHTML = "";
    lanDevices.forEach(d => {
        let statusBadge = d.status === 'online' ? `<span class="badge badge-online">ONLINE</span>` : `<span class="badge badge-offline">OFFLINE</span>`;
        const tr = document.createElement('tr');
        tr.innerHTML = `<td style="font-weight:600;"><i class="fas fa-desktop" style="color:#94a3b8; margin-right:5px;"></i> ${d.name}</td><td>${d.ip}</td><td style="font-family:monospace; color:#64748b;">${d.mac}</td><td>${d.ping}</td><td>${statusBadge}</td><td><button class="btn btn-sm btn-warning" onclick="showAlert('Bilgi', 'Hız limiti: 10mbps')"><i class="fas fa-gauge-high"></i></button> <button class="btn btn-sm btn-danger" onclick="kickDevice(${d.id}, this)"><i class="fas fa-ban"></i></button></td>`;
        tbody.appendChild(tr);
    });
    document.getElementById('stat-lan').innerText = lanDevices.filter(x => x.status === 'online').length;
}
function scanNetwork() {
    const btn = document.getElementById('scan-btn'); const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Taranıyor...'; btn.disabled = true;
    setTimeout(() => {
        const newId = Date.now(); const randomLast = Math.floor(Math.random() * 254) + 2;
        const newDevice = { id: newId, name: "Unknown-Device-" + randomLast, ip: "192.168.1." + randomLast, mac: "XX:XX:XX:XX:XX", ping: Math.floor(Math.random() * 100) + "ms", status: "online" };
        lanDevices.push(newDevice); renderLan(); addLog(`Ağ Taraması: Yeni Cihaz`, "System Bot", "warning", "Bulundu"); showBanner("Taramada yeni cihaz bulundu: " + newDevice.ip);
        btn.innerHTML = originalText; btn.disabled = false;
    }, 2000);
}
function kickDevice(id, btnElement) {
    showConfirm("Erişim Engelleme", "Bu cihazı engellemek istiyor musunuz?", (confirmed) => {
        if(confirmed) {
            const dev = lanDevices.find(x => x.id === id); if(dev) addLog(`LAN Engelleme: ${dev.ip}`, "Admin", "danger", "Banlandı");
            const row = btnElement.closest('tr'); row.classList.add('blocked-row'); row.innerHTML = '<td colspan="6" class="blocked-text"><i class="fas fa-ban"></i> ERİŞİM ENGELLENDİ</td>';
            setTimeout(() => { lanDevices = lanDevices.filter(x => x.id !== id); renderLan(); }, 1000);
        }
    });
}
function unlockSecuredArea() {
    const pass = document.getElementById('admin-pass').value;
    if(pass === "admin123") {
        addLog(`Güvenli Alan Erişimi`, "Admin", "success", "Yetkilendirildi");
        document.getElementById('auth-error').style.display = 'none';
        document.getElementById('security-lock').style.opacity = '0';
        setTimeout(() => { document.getElementById('security-lock').style.display = 'none'; document.getElementById('secured-content').style.filter = 'none'; document.getElementById('secured-content').style.pointerEvents = 'auto'; }, 500);
    } else {
        addLog(`Yetkisiz Giriş Denemesi`, "Bilinmeyen IP", "danger", "Engellendi");
        document.getElementById('auth-error').style.display = 'block'; document.getElementById('admin-pass').value = "";
    }
}
function addNote() {
    const text = document.getElementById('note-input').value; const time = document.getElementById('note-time').value;
    if(!text) { showAlert("Uyarı", "Lütfen bir not giriniz!"); return; }
    notes.push({ id: Date.now(), text: text, targetTime: time ? new Date(time).getTime() : null, notified: false });
    addLog(`Yeni Görev/Not`, "Admin", "success", "Eklendi");
    renderNotes(); document.getElementById('note-input').value = ""; showBanner("Not başarıyla eklendi.");
}
function renderNotes() {
    const container = document.getElementById('notes-list'); container.innerHTML = "";
    notes.forEach(n => {
        let timeStr = n.targetTime ? new Date(n.targetTime).toLocaleString('tr-TR') : 'Zaman Ayarı Yok';
        let statusColor = n.notified ? 'var(--success)' : 'var(--primary)'; let statusText = n.notified ? 'Bildirim Yapıldı' : 'Beklemede';
        const div = document.createElement('div'); div.className = 'note-card'; div.style.borderLeftColor = statusColor;
        div.innerHTML = `<p style="font-weight:600; font-size:1.1rem; margin-bottom:8px;">${n.text}</p><div style="font-size:0.85rem; color:#64748b; display:flex; align-items:center; gap:5px;"><i class="far fa-clock"></i> ${timeStr}</div><div style="margin-top:10px; display:flex; justify-content:space-between; align-items:center;"><span style="font-size:0.75rem; font-weight:bold; color:${statusColor}">${statusText}</span><button onclick="notes = notes.filter(x => x.id !== ${n.id}); renderNotes();" style="border:none; background:none; color:var(--danger); cursor:pointer;"><i class="fas fa-trash"></i> Sil</button></div>`;
        container.appendChild(div);
    });
}

setInterval(() => {
    const now = new Date(); document.getElementById('clock').innerText = now.toLocaleTimeString('tr-TR');
    notes.forEach(note => { if(note.targetTime && !note.notified && now.getTime() >= note.targetTime) { showBanner("Hatırlatma", note.text); note.notified = true; renderNotes(); } });
}, 1000);

window.onload = function() { renderPersonnel(); renderApplications(); renderLan(); renderLogs(); }
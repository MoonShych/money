// --- โครงสร้างข้อมูลตั้งต้นแอปพลิเคชัน ---
let appState = {
    goals: [],
    history: [],
    xp: 0,
    level: 1,
    lastCheckIn: null, 
    checkInStreak: 0,
    buffActiveUntil: null 
};

// --- จุดเริ่มต้นของระบบเมื่อเปิดแอป ---
document.addEventListener("DOMContentLoaded", () => {
    loadData();
    initTheme();
    setupEventListeners();
    showPage("homePage"); // เปิดหน้าแรกพร้อมไฮไลท์เมนู
});

// --- ระบบการนำทางเปลี่ยนหน้าแอปแบบ Reactive ---
function showPage(pageId) {
    document.querySelectorAll(".page").forEach(page => page.style.display = "none");
    document.getElementById(pageId).style.display = "block";
    
    // จัดการ Active Class ที่ปุ่มเมนูด้านล่างให้เกิดการขยับและเปลี่ยนสี
    document.querySelectorAll(".bottom-nav button").forEach(btn => btn.classList.remove("active-nav"));
    const activeNavBtn = document.getElementById(`nav-${pageId}`);
    if(activeNavBtn) activeNavBtn.classList.add("active-nav");

    updateUI(); 
}

// --- การคำนวณระบบเลเวลและ XP ---
function getXpRequired(level) {
    return 50 + ((level - 1) * 10);
}

function addXp(amount) {
    if (appState.buffActiveUntil && new Date(appState.buffActiveUntil) >= new Date().setHours(0,0,0,0)) {
        amount = Math.floor(amount * 1.5);
    }

    appState.xp += amount;

    let leveledUp = false;
    while (appState.xp >= getXpRequired(appState.level)) {
        appState.xp -= getXpRequired(appState.level);
        appState.level++;
        leveledUp = true;
    }
    
    if(leveledUp) {
        triggerLevelUpModal(appState.level);
    }
    saveData();
}

// ระบบ Custom Modal เลเวลอัปแบบเคลื่อนไหว
function triggerLevelUpModal(currentLevel) {
    document.getElementById("lvlModalText").innerText = `ยินดีด้วย! คุณก้าวสู่ Level ${currentLevel} แล้ว!`;
    document.getElementById("levelUpModal").classList.add("active");
}

function closeLvlModal() {
    document.getElementById("levelUpModal").classList.remove("active");
}

// --- ฟังก์ชันจัดเตรียมอีเวนต์ (Event Listeners) ---
function setupEventListeners() {
    document.getElementById("goalForm").addEventListener("submit", handleGoalSubmit);
    document.getElementById("goalImage").addEventListener("change", handleImagePreview);
    document.getElementById("cancelEditBtn").addEventListener("click", resetGoalForm);
    document.getElementById("saveBtn").addEventListener("click", handleSavingSubmit);
    document.getElementById("checkInBtn").addEventListener("click", handleCheckIn);
    document.getElementById("themeToggleBtn").addEventListener("click", toggleTheme);
    document.getElementById("resetAppBtn").addEventListener("click", resetAllData);
}

// --- ระบบพรีวิวรูปภาพและแปลงไฟล์เป็น Base64 ---
let encodedImageBase64 = "";
function handleImagePreview(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            encodedImageBase64 = event.target.result;
            document.getElementById("imagePreview").innerHTML = `<img src="${encodedImageBase64}">`;
        };
        reader.readAsDataURL(file);
    }
}

// --- จัดการเพิ่ม / แก้ไข เป้าหมายเงินออม ---
function handleGoalSubmit(e) {
    e.preventDefault();
    const id = document.getElementById("editGoalId").value;
    const name = document.getElementById("goalName").value;
    const amount = parseFloat(document.getElementById("goalAmount").value);

    if (id) {
        const goalIndex = appState.goals.findIndex(g => g.id === id);
        if (goalIndex > -1) {
            appState.goals[goalIndex].name = name;
            appState.goals[goalIndex].targetAmount = amount;
            if (encodedImageBase64) appState.goals[goalIndex].image = encodedImageBase64;
        }
    } else {
        const newGoal = {
            id: Date.now().toString(),
            name: name,
            targetAmount: amount,
            currentSavings: 0,
            image: encodedImageBase64 || null
        };
        appState.goals.push(newGoal);
    }

    saveData();
    resetGoalForm();
    showPage("homePage");
}

function editGoal(id) {
    const goal = appState.goals.find(g => g.id === id);
    if (!goal) return;

    document.getElementById("editGoalId").value = goal.id;
    document.getElementById("goalName").value = goal.name;
    document.getElementById("goalAmount").value = goal.targetAmount;
    
    if (goal.image) {
        encodedImageBase64 = goal.image;
        document.getElementById("imagePreview").innerHTML = `<img src="${goal.image}">`;
    } else {
        encodedImageBase64 = "";
        document.getElementById("imagePreview").innerHTML = "";
    }

    document.getElementById("formTitle").innerText = "✏️ แก้ไขเป้าหมายออมเงิน";
    document.getElementById("submitGoalBtn").innerText = "บันทึกการแก้ไข";
    document.getElementById("cancelEditBtn").style.display = "block";

    showPage("goalPage");
}

function deleteGoal(id) {
    if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบเป้าหมายนี้?")) {
        appState.goals = appState.goals.filter(g => g.id !== id);
        saveData();
        updateUI();
    }
}

function resetGoalForm() {
    document.getElementById("goalForm").reset();
    document.getElementById("editGoalId").value = "";
    document.getElementById("imagePreview").innerHTML = "";
    encodedImageBase64 = "";
    document.getElementById("formTitle").innerText = "🎯 เพิ่มเป้าหมายออมเงิน";
    document.getElementById("submitGoalBtn").innerText = "สร้างเป้าหมายใหม่";
    document.getElementById("cancelEditBtn").style.display = "none";
}

// --- จัดการการออมเงินเพิ่ม ---
function handleSavingSubmit() {
    const goalId = document.getElementById("goalSelect").value;
    const amount = parseFloat(document.getElementById("savingAmount").value);

    if (!goalId || isNaN(amount) || amount <= 0) {
        alert("กรุณาเลือกเป้าหมายและระบุจำนวนเงินที่ถูกต้อง");
        return;
    }

    const goal = appState.goals.find(g => g.id === goalId);
    if (!goal) return;

    goal.currentSavings += amount;

    const gainedXp = Math.floor(amount / 100);
    if (gainedXp > 0) {
        addXp(gainedXp);
    }

    const historyItem = {
        date: "วันนี้",
        text: `➕ ออมเงินเพิ่มเข้าเป้าหมาย "${goal.name}" จำนวน ${amount.toLocaleString()} บาท`
    };
    appState.history.unshift(historyItem);

    saveData();
    document.getElementById("savingAmount").value = "";
    showPage("homePage");
}

// --- ระบบเช็กอินรายวัน ---
function handleCheckIn() {
    const todayStr = new Date().toISOString().split('T')[0];

    if (appState.lastCheckIn === todayStr) {
        alert("คุณเช็กอินในวันนี้ไปแล้ว!");
        return;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (appState.lastCheckIn === yesterdayStr) {
        appState.checkInStreak++;
    } else {
        appState.checkInStreak = 1;
    }

    appState.lastCheckIn = todayStr;
    let baseBonusXp = 10;

    if (appState.checkInStreak % 5 === 0) {
        baseBonusXp += 10; 
        
        const buffEnd = new Date();
        buffEnd.setDate(buffEnd.getDate() + 1);
        appState.buffActiveUntil = buffEnd.toISOString().split('T')[0];
        
        alert(`🔥 เช็กอินครบต่อเนื่อง ${appState.checkInStreak} วัน! ได้รับโบนัสพิเศษ +20 XP และบัฟ 💎 XP x1.5 เป็นเวลา 1 วัน!`);
    } else {
        alert(`🔥 เช็กอินสำเร็จ! ได้รับ +10 XP (เช็กอินต่อเนื่อง ${appState.checkInStreak} วัน)`);
    }

    addXp(baseBonusXp);
    saveData();
    updateUI();
}

// --- จัดการเรนเดอร์ UI ---
function updateUI() {
    // 1. แถบเลเวลด้านบน
    document.getElementById("currentLevel").innerText = `LV. ${appState.level}`;
    const reqXp = getXpRequired(appState.level);
    const percentXp = Math.min((appState.xp / reqXp) * 100, 100);
    document.getElementById("xpBarFill").style.width = `${percentXp}%`;
    document.getElementById("xpText").innerText = `XP ${appState.xp} / ${reqXp} (${Math.floor(percentXp)}%)`;

    // เช็กอินปุ่ม
    const todayStr = new Date().toISOString().split('T')[0];
    const checkInBtn = document.getElementById("checkInBtn");
    if (appState.lastCheckIn === todayStr) {
        checkInBtn.innerText = "✅ เช็กอินแล้ว";
        checkInBtn.disabled = true;
    } else {
        checkInBtn.innerText = "🔥 เช็กอินรายวัน";
        checkInBtn.disabled = false;
    }

    // แถบบัฟ
    const buffBadge = document.getElementById("buffBadge");
    if (appState.buffActiveUntil && new Date(appState.buffActiveUntil) >= new Date().setHours(0,0,0,0)) {
        buffBadge.style.display = "inline-block";
    } else {
        buffBadge.style.display = "none";
    }

    // 2. เรนเดอร์เป้าหมายหน้าหลัก
    const goalList = document.getElementById("goalList");
    goalList.innerHTML = "";
    
    const goalSelect = document.getElementById("goalSelect");
    goalSelect.innerHTML = '<option value="">เลือกเป้าหมาย</option>';

    if (appState.goals.length === 0) {
        goalList.innerHTML = `<p style="text-align:center; padding:40px 20px; opacity: 0.5; font-weight:600;">ยังไม่มีเป้าหมายในขณะนี้ เริ่มต้นสร้างความฝันกันเลย!</p>`;
    }

    appState.goals.forEach(goal => {
        const percentProgress = Math.min((goal.currentSavings / goal.targetAmount) * 100, 100);
        
        const option = document.createElement("option");
        option.value = goal.id;
        option.innerText = goal.name;
        goalSelect.appendChild(option);

        const card = document.createElement("div");
        card.className = "goal-card";
        
        let imgHtml = "";
        if (goal.image) {
            imgHtml = `<div class="goal-image-container"><img src="${goal.image}"></div>`;
        }

        card.innerHTML = `
            ${imgHtml}
            <div class="goal-details">
                <div class="goal-header">
                    <span class="goal-title">${goal.name}</span>
                    <span style="font-weight: 800; color: var(--primary-color);">${Math.floor(percentProgress)}%</span>
                </div>
                <div style="font-size: 0.95rem; opacity: 0.8; font-weight: 600;">
                    ${goal.currentSavings.toLocaleString()} / ${goal.targetAmount.toLocaleString()} บาท
                </div>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${percentProgress}%"></div>
                </div>
            </div>
            <div class="goal-actions">
                <button class="edit-btn" onclick="editGoal('${goal.id}')"><i class="fa-solid fa-pen-to-square"></i> แก้ไข</button>
                <button class="delete-btn" onclick="deleteGoal('${goal.id}')"><i class="fa-solid fa-trash"></i> ลบ</button>
            </div>
        `;
        goalList.appendChild(card);
    });

    // 3. หน้าประวัติ
    const historyList = document.getElementById("historyList");
    historyList.innerHTML = "";
    if (appState.history.length === 0) {
        historyList.innerHTML = `<p style="text-align:center; opacity:0.5; padding:20px; font-weight:600;">ไม่มีประวัติการบันทึกเงินออม</p>`;
    }
    appState.history.forEach(item => {
        const li = document.createElement("li");
        li.innerHTML = `<small>${item.date}</small> <span style="font-weight:600; font-size:0.95rem;">${item.text}</span>`;
        historyList.appendChild(li);
    });
}

// --- LocalStorage ออฟไลน์ ---
function saveData() {
    localStorage.setItem("save_money_state", JSON.stringify(appState));
}

function loadData() {
    const saved = localStorage.getItem("save_money_state");
    if (saved) {
        try { appState = JSON.parse(saved); } catch (e) { console.error("Error reading storage data", e); }
    }
}

// --- ระบบเปลี่ยนธีม Dark Mode โทน Cyberpunk Blue ---
function initTheme() {
    const currentTheme = localStorage.getItem("app_theme") || "light";
    document.documentElement.setAttribute("data-theme", currentTheme);
    const themeBtn = document.getElementById("themeToggleBtn");
    if (themeBtn) {
        themeBtn.innerText = currentTheme === "dark" ? "🌙 Dark Mode" : "🌞 Light Mode";
    }
}

function toggleTheme() {
    let activeTheme = document.documentElement.getAttribute("data-theme");
    let targetTheme = "light";

    if (activeTheme === "light") {
        targetTheme = "dark";
        document.getElementById("themeToggleBtn").innerText = "🌙 Dark Mode";
    } else {
        document.getElementById("themeToggleBtn").innerText = "🌞 Light Mode";
    }

    document.documentElement.setAttribute("data-theme", targetTheme);
    localStorage.setItem("app_theme", targetTheme);
}

// --- รีเซ็ตข้อมูล ---
function resetAllData() {
    if (confirm("🛑 คุณต้องการล้างข้อมูลแอปทั้งหมดจริงหรือไม่? ทุกอย่างจะหายไปทั้งหมดไม่สามารถกู้คืนได้!")) {
        localStorage.clear();
        location.reload();
    }
}
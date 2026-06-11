let goals = JSON.parse(localStorage.getItem("goals")) || [];
let history = JSON.parse(localStorage.getItem("history")) || [];

const goalForm = document.getElementById("goalForm");
const goalList = document.getElementById("goalList");
const goalSelect = document.getElementById("goalSelect");
const saveBtn = document.getElementById("saveBtn");
const historyList = document.getElementById("historyList");

/* =====================
   เพิ่มเป้าหมาย
===================== */
goalForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("goalName").value.trim();
    const amount = Number(document.getElementById("goalAmount").value);

    if (!name || amount <= 0) return;

    goals.push({
        id: Date.now(),
        name,
        target: amount,
        saved: 0
    });

    saveData();
    render();

    goalForm.reset();
});

/* =====================
   เพิ่มเงินออม
===================== */
saveBtn.addEventListener("click", () => {

    const goalId = Number(goalSelect.value);
    const money = Number(
        document.getElementById("savingAmount").value
    );

    if (!goalId || money <= 0) {
        alert("กรุณากรอกข้อมูลให้ถูกต้อง");
        return;
    }

    const goal = goals.find(g => g.id === goalId);

    if (!goal) return;

    goal.saved += money;

    history.unshift({
        goal: goal.name,
        amount: money,
        date: new Date().toLocaleString("th-TH")
    });

    saveData();
    render();

    document.getElementById("savingAmount").value = "";
});

/* =====================
   ลบเป้าหมาย
===================== */
function deleteGoal(id) {

    if (!confirm("ต้องการลบเป้าหมายนี้ใช่หรือไม่ ?")) {
        return;
    }

    goals = goals.filter(g => g.id !== id);

    saveData();
    render();
}

/* =====================
   แสดงผล
===================== */
function render() {

    goalList.innerHTML = "";

    goalSelect.innerHTML =
        '<option value="">เลือกเป้าหมาย</option>';

    goals.forEach(goal => {

        const percent = Math.min(
            (goal.saved / goal.target) * 100,
            100
        );

        const complete =
            goal.saved >= goal.target
                ? '<p class="goal-complete">🎉 สำเร็จแล้ว</p>'
                : '';

        goalSelect.innerHTML += `
            <option value="${goal.id}">
                ${goal.name}
            </option>
        `;

        goalList.innerHTML += `
            <div class="goal-card">

                <h3>${goal.name}</h3>

                <p>
                    ${goal.saved.toLocaleString()}
                    /
                    ${goal.target.toLocaleString()}
                    บาท
                </p>

                <div class="progress">
                    <div
                        class="progress-bar"
                        style="width:${percent}%">
                    </div>
                </div>

                ${complete}

                <button
                    class="delete-btn"
                    onclick="deleteGoal(${goal.id})">
                    ลบเป้าหมาย
                </button>

            </div>
        `;
    });

    renderHistory();
}

/* =====================
   ประวัติการออม
===================== */
function renderHistory() {

    historyList.innerHTML = "";

    if (history.length === 0) {
        historyList.innerHTML =
            "<li>ยังไม่มีประวัติการออม</li>";
        return;
    }

    history.forEach(item => {

        historyList.innerHTML += `
            <li style="
                background:#fff;
                padding:12px;
                margin-bottom:10px;
                border-radius:10px;
                list-style:none;
            ">
                💰 ${item.goal}
                +${item.amount.toLocaleString()} บาท
                <br>
                <small>${item.date}</small>
            </li>
        `;
    });
}

/* =====================
   บันทึกข้อมูล
===================== */
function saveData() {

    localStorage.setItem(
        "goals",
        JSON.stringify(goals)
    );

    localStorage.setItem(
        "history",
        JSON.stringify(history)
    );
}

/* =====================
   เริ่มต้น
===================== */
render();
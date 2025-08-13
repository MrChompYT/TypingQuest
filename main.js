// SharkBite Sites — Sunday layout + new features (subjects, weekly goals, clock/AFK, search)

let allUsers = JSON.parse(localStorage.getItem("allUsers")) || {};
let currentUser = null;
let currentRole = null;
let activityTimer = null;

/*
User shape:
{
  username, role: 'Student'|'Teacher',
  badges: [],
  typingMinutes: 0,
  subjects: [],          // multiple subjects assigned (e.g., ['Math','Writing','Coding'])
  activeSubject: null,   // current active subject
  assignedQuest: null,
  weeklyGoals: [         // teacher-approved weekly goals
    { id, title, subject, dueISO, status: 'assigned'|'submitted'|'approved'|'rejected' }
  ]
}
*/

function saveAllUsers() {
  localStorage.setItem("allUsers", JSON.stringify(allUsers));
}

/* --------------- Entry / Home (no search bar here) --------------- */
function showHomePage() {
  document.body.innerHTML = `
    <h2>Welcome to Typing Quest</h2>
    <div class="row">
      <button onclick="showLoginForm()">Log In</button>
      <button onclick="showCreateForm()">Create Account</button>
    </div>
  `;
  showClock();
  setupActivityGuard();
}

/* --------------- Auth (no search bar here) --------------- */
function showLoginForm() {
  document.body.innerHTML = `
    <h2>Log In</h2>
    <div class="section center">
      <input id="loginName" placeholder="Enter username" />
      <div class="row">
        <button onclick="login()">Log In</button>
        <button onclick="showHomePage()">Back</button>
      </div>
    </div>
  `;
  showClock();
  setupActivityGuard();
}

function showCreateForm() {
  document.body.innerHTML = `
    <h2>Create Account</h2>
    <div class="section center">
      <input id="newName" placeholder="Enter new username" />
      <select id="newRole">
        <option value="Student">Student</option>
        <option value="Teacher">Teacher</option>
      </select>
      <div class="row">
        <button onclick="createAccount()">Create</button>
        <button onclick="showHomePage()">Back</button>
      </div>
    </div>
  `;
  showClock();
  setupActivityGuard();
}

function createAccount() {
  const name = document.getElementById("newName").value.trim();
  const role = document.getElementById("newRole").value;
  if (!name || allUsers[name]) return alert("Invalid or taken username.");
  allUsers[name] = {
    username: name,
    role,
    badges: [],
    typingMinutes: 0,
    subjects: [],          // multiple subjects supported
    activeSubject: null,
    assignedQuest: null,
    weeklyGoals: []        // weekly goals container
  };
  saveAllUsers();
  showHomePage();
}

function login() {
  const name = document.getElementById("loginName").value.trim();
  if (!allUsers[name]) return alert("User not found.");
  currentUser = name;
  currentRole = allUsers[name].role;
  loadDashboard();
}

function logout() {
  currentUser = null;
  currentRole = null;
  showHomePage();
}

/* --------------- App Frame (search bar only after login) --------------- */
function loadDashboard() {
  document.body.innerHTML = "";
  // Only show search after login
  showSearchBar();
  showClock();
  setupActivityGuard();

  if (currentRole === "Student") {
    // Show weekly goals screen first (Mathspace vibe)
    showWeeklyGoalsScreen();
  } else {
    loadTeacherDashboard();
  }
}

/* --------------- Student: Weekly Goals + Dashboard --------------- */
function showWeeklyGoalsScreen() {
  const user = allUsers[currentUser];
  document.body.innerHTML = `
    <h2>Your Weekly Goals</h2>
    <div id="goalsWrap" class="section"></div>
    <div class="row">
      <button onclick="loadStudentDashboard()">Go to Dashboard</button>
    </div>
  `;
  showSearchBar();
  showClock();
  setupActivityGuard();

  renderStudentGoalsList(user);
}

function renderStudentGoalsList(user) {
  const wrap = document.getElementById("goalsWrap");
  const goals = user.weeklyGoals || [];
  if (goals.length === 0) {
    wrap.innerHTML = `<p class="small center">No weekly goals yet. Check back soon.</p>`;
    return;
  }
  const container = document.createElement("div");
  container.className = "goal-list";

  goals.forEach(g => {
    const div = document.createElement("div");
    div.className = "goal";
    const dueTxt = g.dueISO ? new Date(g.dueISO).toLocaleDateString() : "No due date";
    div.innerHTML = `
      <h4>${g.title}</h4>
      <div class="meta">Subject: ${g.subject} • Due: ${dueTxt} • Status: ${prettyStatus(g.status)}</div>
      <div class="actions"></div>
    `;
    const actions = div.querySelector(".actions");

    if (g.status === "assigned" || g.status === "rejected") {
      const submitBtn = document.createElement("button");
      submitBtn.textContent = "Submit for Approval";
      submitBtn.onclick = () => {
        g.status = "submitted";
        saveAllUsers();
        showWeeklyGoalsScreen();
      };
      actions.appendChild(submitBtn);
    } else if (g.status === "submitted") {
      const note = document.createElement("span");
      note.className = "small";
      note.textContent = "Waiting for teacher approval…";
      actions.appendChild(note);
    } else if (g.status === "approved") {
      const ok = document.createElement("span");
      ok.className = "small";
      ok.textContent = "Approved ✅";
      actions.appendChild(ok);
    }

    container.appendChild(div);
  });

  wrap.innerHTML = "";
  wrap.appendChild(container);
}

function loadStudentDashboard() {
  const data = allUsers[currentUser];
  document.body.innerHTML = `
    <h2>Welcome, ${data.username}</h2>
    <div class="section center" id="subjectSwitch"></div>
    <div class="section center" id="actions"></div>
    <div class="section center" id="badges"></div>
    <div class="row">
      <button onclick="showWeeklyGoalsScreen()">Weekly Goals</button>
      <button onclick="downloadTxt(allUsers[currentUser])">Download Progress</button>
      <button onclick="logout()">Logout</button>
    </div>
  `;
  showSearchBar();
  showClock();
  setupActivityGuard();

  // Subject switcher (multiple subjects; student can switch active)
  const ss = document.getElementById("subjectSwitch");
  if (!data.subjects || data.subjects.length === 0) {
    ss.innerHTML = `<p class="small">No subjects assigned yet.</p>`;
  } else {
    ss.innerHTML = `<p>Active Subject: <strong>${data.activeSubject || "None"}</strong></p>`;
    const row = document.createElement("div"); row.className = "row";
    data.subjects.forEach(sub => {
      const b = document.createElement("button");
      b.textContent = sub;
      b.onclick = () => {
        data.activeSubject = sub;
        saveAllUsers();
        loadStudentDashboard();
      };
      row.appendChild(b);
    });
    ss.appendChild(row);
  }

  // Actions based on active subject
  const act = document.getElementById("actions");
  const s = data.activeSubject;
  if (!s) {
    act.innerHTML = `<p class="small">Pick a subject to see activities.</p>`;
  } else if (s === "Math") {
    addActionButton(act, "Daily Challenge", launchDailyChallenge);
    addActionButton(act, "Typing Quest", launchTypingQuest);
  } else if (s === "Writing") { // Correct spelling
    addActionButton(act, "Story Builder", launchStoryBuilder);
    addActionButton(act, "Grammar Game", launchGrammarGame);
  } else if (s === "Coding") {
    addActionButton(act, "Typing Quest", launchTypingQuest);
    addActionButton(act, "Daily Challenge", launchDailyChallenge);
  }

  // Badges
  const bd = document.getElementById("badges");
  const badges = data.badges?.length ? data.badges.join(", ") : "None yet";
  bd.innerHTML = `<div class="badge-strip">🏅 Badges: ${badges}</div>`;
}

function addActionButton(container, label, fn) {
  const b = document.createElement("button");
  b.textContent = label;
  b.onclick = fn;
  container.appendChild(b);
}

/* --------------- Teacher --------------- */
function loadTeacherDashboard() {
  document.body.innerHTML = `
    <h2>Hello Teacher ${currentUser}</h2>
    <div class="section center">
      <div class="row">
        <button onclick="showAllStudents()">View Students</button>
        <button onclick="teacherAssignSubjects()">Assign Subjects</button>
        <button onclick="teacherSetWeeklyGoals()">Set Weekly Goals</button>
        <button onclick="teacherReviewGoals()">Review Submissions</button>
      </div>
    </div>
    <div class="row">
      <button onclick="downloadAll()">Download All (JSON)</button>
      <button onclick="logout()">Logout</button>
    </div>
  `;
  showSearchBar();
  showClock();
  setupActivityGuard();
}

function showAllStudents() {
  document.body.innerHTML = `
    <h2>Student Roster</h2>
    <div class="section" id="roster"></div>
    <div class="row"><button onclick="loadTeacherDashboard()">Back</button></div>
  `;
  showSearchBar();
  showClock();
  setupActivityGuard();

  const roster = document.getElementById("roster");
  Object.values(allUsers).forEach(u => {
    if (u.role !== "Student") return;
    const d = document.createElement("div");
    d.className = "goal";
    const badges = u.badges?.length ? u.badges.join(", ") : "None";
    d.innerHTML = `
      <h4>${u.username}</h4>
      <div class="meta">Subjects: ${u.subjects?.join(", ") || "None"} • Active: ${u.activeSubject || "None"} • Typing: ${u.typingMinutes} mins</div>
      <div class="small">Badges: ${badges}</div>
    `;
    roster.appendChild(d);
  });
}

/* Assign multiple subjects (comma-separated) to a student */
function teacherAssignSubjects() {
  const student = prompt("Enter student username:");
  if (!student || !allUsers[student]) return alert("Student not found.");
  if (allUsers[student].role !== "Student") return alert("That user is not a student.");
  const subjects = prompt("Assign subjects (comma-separated): Math, Writing, Coding");
  if (!subjects) return alert("No subjects entered.");
  const list = subjects.split(",").map(s => s.trim()).filter(Boolean);
  allUsers[student].subjects = Array.from(new Set(list)); // unique
  allUsers[student].activeSubject = allUsers[student].subjects[0] || null;
  saveAllUsers();
  alert(`Assigned subjects to ${student}: ${allUsers[student].subjects.join(", ")}`);
}

/* Create weekly goals for a student */
function teacherSetWeeklyGoals() {
  const student = prompt("Enter student username:");
  if (!student || !allUsers[student]) return alert("Student not found.");
  if (allUsers[student].role !== "Student") return alert("That user is not a student.");
  const title = prompt("Goal title (e.g., Complete 3 Math tasks):");
  if (!title) return alert("No title entered.");
  const subject = prompt("Subject for this goal (Math, Writing, Coding):");
  if (!subject) return alert("No subject entered.");
  const due = prompt("Due date (YYYY-MM-DD), leave blank for end of week:");
  const dueISO = due ? new Date(due).toISOString() : endOfWeekISO();

  const goal = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
    title,
    subject,
    dueISO,
    status: "assigned"
  };
  allUsers[student].weeklyGoals = allUsers[student].weeklyGoals || [];
  allUsers[student].weeklyGoals.push(goal);
  saveAllUsers();
  alert(`Goal created for ${student}.`);
}

/* Approve/reject submitted goals */
function teacherReviewGoals() {
  document.body.innerHTML = `
    <h2>Goal Submissions</h2>
    <div class="section" id="subList"></div>
    <div class="row"><button onclick="loadTeacherDashboard()">Back</button></div>
  `;
  showSearchBar();
  showClock();
  setupActivityGuard();

  const subList = document.getElementById("subList");
  let any = false;
  Object.values(allUsers).forEach(u => {
    if (u.role !== "Student") return;
    (u.weeklyGoals || []).forEach(g => {
      if (g.status === "submitted") {
        any = true;
        const card = document.createElement("div");
        card.className = "goal";
        card.innerHTML = `
          <h4>${u.username}: ${g.title}</h4>
          <div class="meta">Subject: ${g.subject} • Due: ${g.dueISO ? new Date(g.dueISO).toLocaleDateString() : "No due date"}</div>
          <div class="actions"></div>
        `;
        const actions = card.querySelector(".actions");
        const approve = document.createElement("button");
        approve.textContent = "Approve";
        approve.onclick = () => {
          g.status = "approved";
          addBadgeFor(u.username, "Goal Getter");
          saveAllUsers();
          teacherReviewGoals();
        };
        const reject = document.createElement("button");
        reject.textContent = "Reject";
        reject.onclick = () => {
          g.status = "rejected";
          saveAllUsers();
          teacherReviewGoals();
        };
        actions.appendChild(approve);
        actions.appendChild(reject);
        subList.appendChild(card);
      }
    });
  });
  if (!any) subList.innerHTML = `<p class="small center">No submissions waiting.</p>`;
}

/* --------------- Challenges --------------- */
function launchDailyChallenge() {
  document.body.innerHTML = `
    <h2>Daily Challenge</h2>
    <div class="section center" id="quiz"></div>
    <div class="row"><button onclick="loadStudentDashboard()">Back</button></div>
  `;
  showSearchBar();
  showClock();
  setupActivityGuard();

  const q = { text: "What is 7 × 8?", options: ["54","56","64","58"], answer: "56" };
  const el = document.getElementById("quiz");
  const p = document.createElement("p"); p.textContent = q.text; el.appendChild(p);
  const row = document.createElement("div"); row.className = "row"; el.appendChild(row);
  q.options.forEach(opt => {
    const b = document.createElement("button");
    b.textContent = opt;
    b.onclick = () => {
      if (opt === q.answer) addBadge("Math Master");
      loadStudentDashboard();
    };
    row.appendChild(b);
  });
}

function launchStoryBuilder() {
  document.body.innerHTML = `
    <h2>Story Builder</h2>
    <div class="section center" id="sb"></div>
    <div class="row"><button onclick="loadStudentDashboard()">Back</button></div>
  `;
  showSearchBar();
  showClock();
  setupActivityGuard();

  const parts = ["The shark", "wears a tuxedo", "and teaches JavaScript"];
  let sentence = "";
  const root = document.getElementById("sb");
  const display = document.createElement("p");
  display.textContent = "Build your story:";
  root.appendChild(display);

  const row = document.createElement("div"); row.className = "row"; root.appendChild(row);
  parts.forEach(piece => {
    const b = document.createElement("button");
    b.textContent = piece;
    b.onclick = () => {
      sentence += piece + " ";
      display.textContent = "Build your story: " + sentence;
    };
    row.appendChild(b);
  });

  const finish = document.createElement("button");
  finish.textContent = "Finish";
  finish.onclick = () => { addBadge("Creative Fin"); loadStudentDashboard(); };
  root.appendChild(finish);
}

function launchGrammarGame() {
  document.body.innerHTML = `
    <h2>Grammar Game</h2>
    <div class="section center" id="gg"></div>
    <div class="row"><button onclick="loadStudentDashboard()">Back</button></div>
  `;
  showSearchBar();
  showClock();
  setupActivityGuard();

  const bad = "he swim fast yesterday";
  const fix = "He swam fast yesterday.";

  const root = document.getElementById("gg");
  const p = document.createElement("p"); p.textContent = `Fix this sentence: "${bad}"`; root.appendChild(p);
  const input = document.createElement("input"); input.placeholder = "Type your fix here"; root.appendChild(input);
  const submit = document.createElement("button"); submit.textContent = "Submit";
  submit.onclick = () => {
    if (input.value.trim() === fix) addBadge("Grammar Shark");
    else alert("Not quite! Try again.");
    loadStudentDashboard();
  };
  root.appendChild(submit);
}

function launchTypingQuest() {
  document.body.innerHTML = `
    <h2>Typing Quest</h2>
    <div class="section center" id="tq"></div>
    <div class="row"><button onclick="loadStudentDashboard()">Back</button></div>
  `;
  showSearchBar();
  showClock();
  setupActivityGuard();

  const passage = "The shark swims silently below the waves";
  const root = document.getElementById("tq");
  const guide = document.createElement("p"); guide.textContent = `Type: "${passage}"`; root.appendChild(guide);
  const input = document.createElement("input"); input.placeholder = "Start typing..."; root.appendChild(input);
  const result = document.createElement("p"); root.appendChild(result);

  let startTime = null;
  input.addEventListener("input", () => {
    if (!startTime) startTime = Date.now();
    const typed = input.value;
    input.style.backgroundColor = passage.startsWith(typed) ? "#d4fcd4" : "#fcd4d4";
    if (typed === passage) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      result.textContent = `Finished in ${duration}s`;
      addBadge("Typing Shark");
      allUsers[currentUser].typingMinutes += Math.floor(duration / 60);
      saveAllUsers();
      setTimeout(loadStudentDashboard, 1200);
    }
  });
}

/* --------------- Badges / Downloads --------------- */
function addBadge(name) {
  const user = allUsers[currentUser];
  if (!user.badges.includes(name)) {
    user.badges.push(name);
    saveAllUsers();
    alert(`🏅 You earned the "${name}" badge!`);
  }
}

function addBadgeFor(username, name) {
  const user = allUsers[username];
  if (!user.badges.includes(name)) {
    user.badges.push(name);
    saveAllUsers();
  }
}

function downloadTxt(user) {
  const goals = (user.weeklyGoals || []).map(g =>
    `- [${g.status}] ${g.title} (${g.subject}) Due: ${g.dueISO ? new Date(g.dueISO).toLocaleDateString() : "N/A"}`
  ).join("\n") || "None";
  const content = `
Username: ${user.username}
Role: ${user.role}
Subjects: ${user.subjects?.join(", ") || "None"}
Active Subject: ${user.activeSubject || "None"}
Typing Time: ${user.typingMinutes} minutes
Badges: ${user.badges?.join(", ") || "None"}
Assigned Quest: ${user.assignedQuest || "None"}

Weekly Goals:
${goals}
  `.trim();

  const blob = new Blob([content], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${user.username}_progress.txt`;
  link.click();
}

function downloadAll() {
  const blob = new Blob([JSON.stringify(allUsers, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `sharkbite_all_users.json`;
  link.click();
}

/* --------------- Search (never on login/home) --------------- */
function showSearchBar() {
  // Guard: if not logged in, don't render
  if (!currentUser) return;

  // Avoid duplicates on re-render
  const existing = document.getElementById("searchBarContainer");
  if (existing) existing.remove();

  const bar = document.createElement("div");
  bar.id = "searchBarContainer";

  const input = document.createElement("input");
  input.placeholder = "Search Google...";

  const btn = document.createElement("button");
  btn.textContent = "🔍 Search";
  btn.onclick = () => {
    const q = input.value.trim();
    if (q) window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}`, "_blank");
  };

  bar.appendChild(input);
  bar.appendChild(btn);
  document.body.prepend(bar);
}

/* --------------- Clock + AFK --------------- */
function showClock() {
  if (!document.getElementById("clock")) {
    const clock = document.createElement("div");
    clock.id = "clock";
    document.body.appendChild(clock);
  }
  // Update
  const update = () => {
    const el = document.getElementById("clock");
    if (!el) return;
    el.textContent = new Date().toLocaleTimeString();
  };
  update();
  // One interval per page render
  if (window._clockInterval) clearInterval(window._clockInterval);
  window._clockInterval = setInterval(update, 1000);
}

function setupActivityGuard() {
  resetActivityTimer();
  document.onmousemove = resetActivityTimer;
  document.onkeydown = resetActivityTimer;
}

function resetActivityTimer() {
  clearTimeout(activityTimer);
  // Ask if still there at 5 minutes; auto-logout at 6 minutes if no interaction
  activityTimer = setTimeout(() => {
    const still = confirm("Are you still there?");
    if (!still) {
      setTimeout(() => {
        // If there was no interaction in the extra minute, log out
        logout();
      }, 60 * 1000);
    } else {
      resetActivityTimer();
    }
  }, 5 * 60 * 1000);
}

/* --------------- Helpers --------------- */
function prettyStatus(s) {
  if (s === "assigned") return "Assigned";
  if (s === "submitted") return "Submitted";
  if (s === "approved") return "Approved";
  if (s === "rejected") return "Rejected";
  return s || "Assigned";
}
function endOfWeekISO() {
  const now = new Date();
  const day = now.getDay(); // 0 Sun - 6 Sat
  const diff = 6 - day;     // days until Saturday (end of week)
  const end = new Date(now);
  end.setDate(now.getDate() + diff);
  end.setHours(23,59,59,999);
  return end.toISOString();
}

/* --------------- Boot --------------- */
showHomePage();

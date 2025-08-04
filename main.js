// SharkBite Sites — Full main.js with fixed login and full features

let allUsers = JSON.parse(localStorage.getItem("allUsers")) || {};
let currentUser = null;
let currentRole = null;

function saveAllUsers() {
  localStorage.setItem("allUsers", JSON.stringify(allUsers));
}

function createAccount(username, role) {
  if (!username || allUsers[username]) return alert("Username invalid or taken.");
  allUsers[username] = {
    username,
    role,
    badges: [],
    typingMinutes: 0,
    assignedQuest: null
  };
  saveAllUsers();
  showLoginPage();
}

function login(username) {
  if (!allUsers[username]) return alert("User not found.");
  currentUser = username;
  currentRole = allUsers[username].role;
  loadDashboard();
}

function logout() {
  currentUser = null;
  currentRole = null;
  showLoginPage();
}

function showLoginPage() {
  document.body.innerHTML = `
    <h2>🦈 SharkBite Sites Login</h2>

    <div>
      <h3>Create New Account</h3>
      <input id="newName" placeholder="Enter new username" />
      <select id="newRole">
        <option value="Student">Student</option>
        <option value="Teacher">Teacher</option>
      </select>
      <button id="createBtn">Create Account</button>
    </div>

    <div>
      <h3>Login with Username</h3>
      <input id="loginName" placeholder="Enter existing username" />
      <button id="loginBtn">Login</button>
    </div>

    <div>
      <h3>Quick Select:</h3>
      <div id="userList"></div>
    </div>
  `;

  document.getElementById("createBtn").onclick = () => {
    const name = document.getElementById("newName").value.trim();
    const role = document.getElementById("newRole").value;
    createAccount(name, role);
  };

  document.getElementById("loginBtn").onclick = () => {
    const name = document.getElementById("loginName").value.trim();
    login(name);
  };

  const userList = document.getElementById("userList");
  Object.keys(allUsers).forEach(name => {
    const btn = document.createElement("button");
    btn.innerText = `${name} (${allUsers[name].role})`;
    btn.onclick = () => login(name);
    userList.appendChild(btn);
  });
}

function loadDashboard() {
  document.body.innerHTML = "";
  resetActivityTimer();
  currentRole === "Student" ? loadStudentDashboard() : loadTeacherDashboard();
}

function loadStudentDashboard() {
  const data = allUsers[currentUser];
  addHeader(`👋 Welcome, ${data.username}`);
  if (data.assignedQuest) addText(`📌 Assigned Quest: ${data.assignedQuest}`);

  addButton("🧠 Daily Challenge", launchDailyChallenge);
  addButton("📖 Story Builder", launchStoryBuilder);
  addButton("🧹 Grammar Game", launchGrammarGame);
  addButton("⌨️ Typing Quest", launchTypingQuest);

  showBadges(data);
  addButton("📄 Download Progress", () => downloadTxt(data));
  addButton("🔒 Logout", logout);
}

function loadTeacherDashboard() {
  addHeader(`🎓 Hello Teacher ${currentUser}`);
  addButton("View Students", showAllStudents);
  addButton("Assign Quest", assignQuestToStudent);
  addButton("Logout", logout);
}

// === Challenges ===
function launchDailyChallenge() {
  document.body.innerHTML = '<h2>🗓️ Daily Challenge</h2>';
  const question = {
    text: "Which ocean is the largest?",
    options: ["Atlantic", "Indian", "Pacific", "Arctic"],
    answer: "Pacific"
  };
  addText(question.text);
  question.options.forEach(opt => {
    addButton(opt, () => {
      if (opt === question.answer) addBadge("Ocean Brain");
      loadDashboard();
    });
  });
}

function launchStoryBuilder() {
  document.body.innerHTML = '<h2>📖 Story Builder</h2>';
  const parts = ["The shark", "wears a tuxedo", "and solves math problems"];
  let sentence = "";
  const output = document.createElement("p");
  output.innerText = "Build your sentence:";
  document.body.appendChild(output);

  parts.forEach(piece => {
    const btn = document.createElement("button");
    btn.innerText = piece;
    btn.onclick = () => {
      sentence += piece + " ";
      output.innerText = "Build your sentence: " + sentence;
    };
    document.body.appendChild(btn);
  });

  addButton("✅ Finish", () => {
    addBadge("Creative Fin");
    loadDashboard();
  });
}

function launchGrammarGame() {
  document.body.innerHTML = '<h2>🧹 Grammar Game</h2>';
  const badSentence = "he swim fast yesterday";
  const fix = "He swam fast yesterday.";

  addText(`Fix this sentence: "${badSentence}"`);
  const input = document.createElement("input");
  input.placeholder = "Type your fix here";
  document.body.appendChild(input);

  addButton("Submit", () => {
    if (input.value.trim() === fix) {
      addBadge("Grammar Shark");
    } else alert("❌ Not quite! Try again.");
    loadDashboard();
  });
}

function launchTypingQuest() {
  document.body.innerHTML = '<h2>⌨️ Typing Quest</h2>';
  const passage = "The shark swims silently below the waves";
  const display = document.createElement("p");
  display.innerText = `Type: "${passage}"`;
  document.body.appendChild(display);

  const input = document.createElement("input");
  input.placeholder = "Start typing...";
  document.body.appendChild(input);

  const result = document.createElement("p");
  document.body.appendChild(result);

  let startTime = null;

  input.addEventListener("input", () => {
    if (!startTime) startTime = Date.now();
    const typed = input.value;
    input.style.backgroundColor = passage.startsWith(typed) ? "#d4fcd4" : "#fcd4d4";

    if (typed === passage) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      result.innerText = `✅ Finished in ${duration}s`;
      addBadge("Typing Shark");
      allUsers[currentUser].typingMinutes += Math.floor(duration / 60);
      saveAllUsers();
      setTimeout(loadDashboard, 2000);
    }
  });
}

// === Teacher Tools ===
function showAllStudents() {
  document.body.innerHTML = '<h2>📋 Student Roster</h2>';
  Object.values(allUsers).forEach(u => {
    if (u.role === "Student") {
      const d = document.createElement("div");
      d.innerHTML = `<strong>${u.username}</strong><br>Badges: ${u.badges.join(", ") || "None"}<br>Typing Time: ${u.typingMinutes} mins`;
      document.body.appendChild(d);
    }
  });
  addButton("⬅️ Back", loadDashboard);
}

function assignQuestToStudent() {
  const studentName = prompt("Enter the student's username:");
  if (!studentName || !allUsers[studentName]) {
    alert("❌ Student not found.");
    return;
  }

  if (allUsers[studentName].role !== "Student") {
    alert("⚠️ That user is not a student.");
    return;
  }

  const questName = prompt("Enter the name of the quest to assign:");
  if (!questName) {
    alert("⚠️ Quest name cannot be empty.");
    return;
  }

  allUsers[studentName].assignedQuest = questName;
  saveAllUsers();
  alert(`✅ Quest "${questName}" assigned to ${studentName}.`);
}

// === Helpers ===
function addBadge(name) {
  const user = allUsers[currentUser];
  if (!user.badges.includes(name)) {
    user.badges.push(name);
    saveAllUsers();
  }
}

function showBadges(data) {
  const div = document.createElement("div");
  div.innerHTML = `<h3>🏅 Badges:</h3><p>${data.badges.join(", ") || "None yet!"}</p>`;
  document.body.appendChild(div);
}

function addHeader(text) {
  const h = document.createElement("h1");
  h.innerText = text;
  document.body.appendChild(h);
}

function addText(content) {
  const p = document.createElement("p");
  p.innerText = content;
  document.body.appendChild(p);
}

function addButton(label, onClick) {
  const b = document.createElement("button");
  b.innerText = label;
  b.onclick = onClick;
  document.body.appendChild(b);
}

function downloadTxt(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${data.username}_progress.txt`;
  link.click();
}

// === Inactivity Timer ===
function resetActivityTimer() {
  clearTimeout(window.inactivity);
  window.inactivity = setTimeout(() => {
    alert("🕒 You've been inactive for 5 minutes. Logging out for safety.");
    logout();
  }, 300000);
}
document.addEventListener("mousemove", resetActivityTimer);
document.addEventListener("keydown", resetActivityTimer);

// === Boot the App ===
showLoginPage();

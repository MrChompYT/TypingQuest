let allUsers = JSON.parse(localStorage.getItem("allUsers")) || {};
let currentUser = null;
let currentRole = null;
let subjectPath = null;
let activityTimer;

function saveAllUsers() {
  localStorage.setItem("allUsers", JSON.stringify(allUsers));
}

function showHomePage() {
  document.body.innerHTML = `
    <h2>Welcome to Typing Quest</h2>
    <button onclick="showLoginForm()">Log In</button>
    <button onclick="showCreateForm()">Create Account</button>
  `;
  showClock();
  showSearchBar();
  resetActivityTimer();
}

function showLoginForm() {
  document.body.innerHTML = `
    <h2>Log In</h2>
    <input id="loginName" placeholder="Enter username" />
    <button onclick="login()">Log In</button>
  `;
}

function showCreateForm() {
  document.body.innerHTML = `
    <h2>Create Account</h2>
    <input id="newName" placeholder="Enter new username" />
    <select id="newRole">
      <option value="Student">Student</option>
      <option value="Teacher">Teacher</option>
    </select>
    <button onclick="createAccount()">Create</button>
  `;
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
  assignedQuest: null,
  subjects: [], // ← now supports multiple subjects
  activeSubject: null
};

  saveAllUsers();
  showHomePage();
}

function login() {
  const name = document.getElementById("loginName").value.trim();
  if (!allUsers[name]) return alert("User not found.");
  currentUser = name;
  currentRole = allUsers[name].role;
  subjectPath = allUsers[name].subject;
  loadDashboard();
}

function logout() {
  currentUser = null;
  currentRole = null;
  subjectPath = null;
  showHomePage();
}

function loadDashboard() {
  document.body.innerHTML = "";
  showClock();
  showSearchBar();
  resetActivityTimer();

  if (currentRole === "Student") {
    if (!subjectPath) {
      chooseSubjectPath();
    } else {
      loadStudentDashboard();
    }
  } else {
    loadTeacherDashboard();
  }
}

function chooseSubjectPath() {
  addHeader("Choose Your Subject Path");
  ["Math", "Writing", "Coding"].forEach(subject => {
    addButton(subject, () => {
      subjectPath = subject;
      allUsers[currentUser].subject = subject;
      saveAllUsers();
      loadStudentDashboard();
    });
  });
}

function loadStudentDashboard() {
  const data = allUsers[currentUser];
  addHeader(`Welcome, ${data.username}`);
  addText(`Active Subject: ${data.activeSubject}`);
  if (data.assignedQuest) addText(`Assigned Quest: ${data.assignedQuest}`);

  // Subject switcher
  if (data.subjects.length > 1) {
    addText("Switch Subject:");
    data.subjects.forEach(sub => {
      addButton(sub, () => {
        data.activeSubject = sub;
        saveAllUsers();
        loadStudentDashboard();
      });
    });
  }

  // Quests based on active subject
  const subject = data.activeSubject;
  if (subject === "Math") {
    addButton("Daily Challenge", launchDailyChallenge);
    addButton("Typing Quest", launchTypingQuest);
  } else if (subject === "Writing") {
    addButton("Story Builder", launchStoryBuilder);
    addButton("Grammar Game", launchGrammarGame);
  } else if (subject === "Coding") {
    addButton("Typing Quest", launchTypingQuest);
    addButton("Daily Challenge", launchDailyChallenge);
  }

  showBadges(data);
  addButton("Download Progress", () => downloadTxt(data));
  addButton("Logout", logout);
}


function loadTeacherDashboard() {
  addHeader(`Hello Teacher ${currentUser}`);
  addButton("View Students", showAllStudents);
  addButton("Assign Quest", assignQuestToStudent);
  addButton("Logout", logout);
}

// === Quests ===
function launchDailyChallenge() {
  document.body.innerHTML = '<h2>Daily Challenge</h2>';
  const question = {
    text: "What is 7 × 8?",
    options: ["54", "56", "64", "58"],
    answer: "56"
  };
  addText(question.text);
  question.options.forEach(opt => {
    addButton(opt, () => {
      if (opt === question.answer) addBadge("Math Master");
      loadDashboard();
    });
  });
}

function launchStoryBuilder() {
  document.body.innerHTML = '<h2>Story Builder</h2>';
  const parts = ["The shark", "wears a tuxedo", "and teaches JavaScript"];
  let sentence = "";
  const output = document.createElement("p");
  output.innerText = "Build your story:";
  document.body.appendChild(output);

  parts.forEach(piece => {
    const btn = document.createElement("button");
    btn.innerText = piece;
    btn.onclick = () => {
      sentence += piece + " ";
      output.innerText = "Build your story: " + sentence;
    };
    document.body.appendChild(btn);
  });

  addButton("Finish", () => {
    addBadge("Creative Fin");
    loadDashboard();
  });
}

function launchGrammarGame() {
  document.body.innerHTML = '<h2>Grammar Game</h2>';
  const badSentence = "he swim fast yesterday";
  const fix = "He swam fast yesterday.";

  addText(`Fix this sentence: "${badSentence}"`);
  const input = document.createElement("input");
  input.placeholder = "Type your fix here";
  document.body.appendChild(input);

  addButton("Submit", () => {
    if (input.value.trim() === fix) {
      addBadge("Grammar Shark");
    } else alert("Not quite! Try again.");
    loadDashboard();
  });
}

function launchTypingQuest() {
  document.body.innerHTML = '<h2>Typing Quest</h2>';
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
      result.innerText = `Finished in ${duration}s`;
      addBadge("Typing Shark");
      allUsers[currentUser].typingMinutes += Math.floor(duration / 60);
      saveAllUsers();
      setTimeout(loadDashboard, 2000);
    }
  });
}

// === Teacher Tools ===
function showAllStudents() {
  document.body.innerHTML = '<h2>Student Roster</h2>';
  Object.values(allUsers).forEach(u => {
    if (u.role === "Student") {
      const d = document.createElement("div");
      d.innerHTML = `<strong>${u.username}</strong><br>Subject: ${u.subject || "None"}<br>Badges: ${u.badges.join(", ") || "None"}<br>Typing Time: ${u.typingMinutes} mins`;
      document.body.appendChild(d);
    }
  });
  addButton("Back", loadDashboard);
}

function assignQuestToStudent() {
  const studentName = prompt("Enter the student's username:");
  if (!studentName || !allUsers[studentName]) return alert("Student not found.");
  if (allUsers[studentName].role !== "Student") return alert("That user is not a student.");

  const subjects = prompt("Assign subjects (comma-separated): Math, Writing, Coding");
  if (!subjects) return alert("No subjects entered.");

  const subjectList = subjects.split(",").map(s => s.trim());
  allUsers[studentName].subjects = subjectList;
  allUsers[studentName].activeSubject = subjectList[0]; // default to first
  saveAllUsers();

  const quest = prompt(`Assign a quest to ${studentName}:`);
  if (quest) {
    allUsers[studentName].assignedQuest = quest;
    saveAllUsers();
    alert(`Assigned subjects and quest to ${studentName}.`);
  }

  loadDashboard();
}


// === Utilities ===
function addHeader(text) {
  const h = document.createElement("h2");
  h.innerText = text;
  document.body.appendChild(h);
}

function addText(text) {
  const p = document.createElement("p");
  p.innerText = text;
  document.body.appendChild(p);
}

function addButton(label, onClick) {
  const btn = document.createElement("button");
  btn.innerText = label;
  btn.onclick = onClick;
  document.body.appendChild(btn);
}

function addBadge(badgeName) {
  const user = allUsers[currentUser];
  if (!user.badges.includes(badgeName)) {
    user.badges.push(badgeName);
    saveAllUsers();
    alert(`🏅 You earned the "${badgeName}" badge!`);
  }
}

function showBadges(user) {
  addText(`Badges: ${user.badges.join(", ") || "None yet"}`);
}

function downloadTxt(user) {
  const content = `
Username: ${user.username}
Role: ${user.role}
Subjects: ${user.subjects.join(", ") || "None"}
Active Subject: ${user.activeSubject || "None"}
Typing Time: ${user.typingMinutes} minutes
Badges: ${user.badges.join(", ") || "None"}
Assigned Quest: ${user.assignedQuest || "None"}
  `.trim();

  const blob = new Blob([content], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${user.username}_progress.txt`;
  link.click();
}


// === Clock + AFK Timer ===
function showClock() {
  const clock = document.createElement("div");
  clock.id = "clock";
  document.body.appendChild(clock);

  setInterval(() => {
    const now = new Date();
    clock.innerText = now.toLocaleTimeString();
  }, 1000);
}

function resetActivityTimer() {
  clearTimeout(activityTimer);
  activityTimer = setTimeout(() => {
    alert("⏳ Are you still there?");
  }, 5 * 60 * 1000); // 5 minutes
  document.body.onmousemove = resetActivityTimer;
  document.body.onkeydown = resetActivityTimer;
}

// === Google Search Bar ===
function showSearchBar() {
  const searchDiv = document.createElement("div");
  searchDiv.id = "searchBarContainer";

  const input = document.createElement("input");
  input.placeholder = "Search Google...";
  input.id = "searchInput";

  const btn = document.createElement("button");
  btn.innerText = "🔍 Search";
  btn.onclick = () => {
    const query = input.value.trim();
    if (query) window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, "_blank");
  };

  searchDiv.appendChild(input);
  searchDiv.appendChild(btn);
  document.body.appendChild(searchDiv);
}

// === Start App ===
showHomePage();

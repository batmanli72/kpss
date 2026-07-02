document.addEventListener("DOMContentLoaded", () => {
  initPlanner();
});

const examDate = new Date("2026-10-25T10:15:00");
let selectedDays = [];

const soruDagilimi = {
  "Türkçe": 30,
  "Matematik": 26,
  "Geometri": 4,
  "Tarih": 27,
  "Coğrafya": 18,
  "Vatandaşlık": 15
};

const toplamSoru = 120;

function initPlanner() {
  renderCountdownInfo();
  renderTopicsSelection();
  loadSavedProgram();
}

function renderCountdownInfo() {
  const now = new Date();
  const diff = examDate - now;
  const days = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  const weeks = Math.max(1, Math.ceil(days / 7));
  
  const container = document.getElementById("countdown-info");
  if (container) {
    container.innerHTML = `
      <h4>⏳ Sınav Geri Sayımı</h4>
      <p>KPSS Ortaöğretim sınavına <strong>${days} gün</strong> (yaklaşık <strong>${weeks} hafta</strong>) kaldı.</p>
      <p style="font-size: 0.85rem; margin-top: 0.25rem; color: #a5b4fc;">Sınav Tarihi: 25 Ekim 2026</p>
    `;
  }
}

function renderTopicsSelection() {
  const container = document.getElementById("topics-selection-container");
  if (!container) return;
  container.innerHTML = "";

  for (let subject in dersler) {
    const groupDiv = document.createElement("div");
    groupDiv.className = "subject-group";

    const titleDiv = document.createElement("div");
    titleDiv.className = "subject-title";
    titleDiv.innerHTML = `
      <span>${subject} <small style="color: var(--text-secondary); font-size: 0.8rem;">(${soruDagilimi[subject]} Soru)</small></span>
      <button onclick="toggleSubjectSelection('${subject}', true)">Tümünü Seç</button>
    `;
    groupDiv.appendChild(titleDiv);

    const gridDiv = document.createElement("div");
    gridDiv.className = "topics-grid";

    dersler[subject].forEach(topic => {
      const topicId = `${subject}_${topic}`;
      
      const label = document.createElement("label");
      label.className = "topic-checkbox-label";
      
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = topicId;
      checkbox.className = "topic-select-checkbox";
      checkbox.dataset.subject = subject;
      checkbox.dataset.topicName = topic;
      
      const savedSelection = JSON.parse(localStorage.getItem("planner_selected_topics")) || [];
      if (savedSelection.includes(topicId)) {
        checkbox.checked = true;
      }

      label.appendChild(checkbox);
      label.append(" " + topic);
      gridDiv.appendChild(label);
    });

    groupDiv.appendChild(gridDiv);
    container.appendChild(groupDiv);
  }
}

window.toggleSubjectSelection = function(subject, select) {
  const checkboxes = document.querySelectorAll(`.topic-select-checkbox[data-subject="${subject}"]`);
  checkboxes.forEach(cb => cb.checked = select);
  saveCurrentCheckboxSelection();
};

window.selectAllTopics = function(select) {
  const checkboxes = document.querySelectorAll(".topic-select-checkbox");
  checkboxes.forEach(cb => cb.checked = select);
  saveCurrentCheckboxSelection();
};

function saveCurrentCheckboxSelection() {
  const checkboxes = document.querySelectorAll(".topic-select-checkbox:checked");
  const selected = Array.from(checkboxes).map(cb => cb.value);
  localStorage.setItem("planner_selected_topics", JSON.stringify(selected));
}

document.addEventListener("change", (e) => {
  if (e.target.classList.contains("topic-select-checkbox")) {
    saveCurrentCheckboxSelection();
  }
});

window.toggleDay = function(btn) {
  const day = btn.dataset.day;
  if (selectedDays.includes(day)) {
    selectedDays = selectedDays.filter(d => d !== day);
    btn.classList.remove("selected");
  } else {
    selectedDays.push(day);
    btn.classList.add("selected");
  }
};

function formatHours(hours) {
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;

  if (h > 0 && m > 0) {
    return `${h} sa ${m} dk`;
  } else if (h > 0) {
    return `${h} sa`;
  } else {
    return `${m} dk`;
  }
}

function getWeekDateRange(weekIndex) {
  const start = new Date();
  start.setDate(start.getDate() + (weekIndex * 7));
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  
  const options = { day: 'numeric', month: 'short' };
  const startStr = start.toLocaleDateString('tr-TR', options);
  const endStr = end.toLocaleDateString('tr-TR', options);
  
  return `${startStr} - ${endStr}`;
}

window.generateProgram = function() {
  const checkedBoxes = document.querySelectorAll(".topic-select-checkbox:checked");
  if (checkedBoxes.length === 0) {
    alert("Lütfen en az bir konu seçiniz!");
    return;
  }

  if (selectedDays.length === 0) {
    alert("Lütfen çalışmak istediğiniz günleri seçiniz!");
    return;
  }

  const hoursPerDay = parseFloat(document.getElementById("hours-per-day").value) || 3;

  // Calculate weeks left
  const now = new Date();
  const diff = examDate - now;
  const daysLeft = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  const weeksLeft = Math.max(1, Math.ceil(daysLeft / 7));

  // Find active subjects and collect selected topics by subject
  const activeSubjects = new Set();
  const selectedTopicsBySubject = {};
  
  for (let subject in dersler) {
    selectedTopicsBySubject[subject] = [];
  }

  checkedBoxes.forEach(cb => {
    const subject = cb.dataset.subject;
    activeSubjects.add(subject);
    selectedTopicsBySubject[subject].push(cb.dataset.topicName);
  });

  // Calculate sum of weights for active subjects
  let activeWeightSum = 0;
  activeSubjects.forEach(subject => {
    activeWeightSum += soruDagilimi[subject] || 0;
  });

  // Calculate study hours per day for each subject based on question distribution ratio
  const dailyHoursAllocation = {};
  activeSubjects.forEach(subject => {
    const ratio = (soruDagilimi[subject] || 0) / activeWeightSum;
    const hours = hoursPerDay * ratio;
    dailyHoursAllocation[subject] = parseFloat(hours.toFixed(1));
  });

  // Build structure for ALL weeks
  const program = {
    generatedAt: new Date().toISOString(),
    hoursPerDay: hoursPerDay,
    selectedDays: selectedDays,
    activeSubjects: Array.from(activeSubjects),
    dailyHoursAllocation: dailyHoursAllocation,
    weeksCount: weeksLeft,
    weeks: []
  };

  const currentIndices = {};
  activeSubjects.forEach(sub => {
    currentIndices[sub] = 0;
  });

  // Generate for each week
  for (let w = 0; w < weeksLeft; w++) {
    const weekData = {
      weekIndex: w,
      dateRange: getWeekDateRange(w),
      days: {}
    };

    selectedDays.forEach(day => {
      weekData.days[day] = [];
      const sortedSubjects = Array.from(activeSubjects).sort((a, b) => soruDagilimi[b] - soruDagilimi[a]);

      sortedSubjects.forEach(sub => {
        const idx = currentIndices[sub];
        const topicsList = selectedTopicsBySubject[sub];
        const allocatedHours = dailyHoursAllocation[sub];

        if (idx < topicsList.length) {
          weekData.days[day].push({
            subject: sub,
            topicName: topicsList[idx],
            hours: allocatedHours,
            completed: false,
            isRevision: false
          });
          currentIndices[sub] += 1;
        } else {
          weekData.days[day].push({
            subject: sub,
            topicName: "Soru Çözümü & Genel Tekrar",
            hours: allocatedHours,
            completed: false,
            isRevision: true
          });
        }
      });
    });

    program.weeks.push(weekData);
  }

  renderProgramUI(program);

  const resultSec = document.getElementById("program-result-section");
  if (resultSec) {
    resultSec.scrollIntoView({ behavior: 'smooth' });
  }
};

function renderProgramUI(program) {
  const container = document.getElementById("program-output");
  const statsContainer = document.getElementById("program-stats");
  const section = document.getElementById("program-result-section");
  
  if (!container || !statsContainer || !section) return;

  container.innerHTML = "";
  section.style.display = "block";

  // Calculate total completed items
  let totalTasks = 0;
  let completedTasks = 0;
  program.weeks.forEach(w => {
    for (let day in w.days) {
      w.days[day].forEach(t => {
        totalTasks++;
        if (t.completed) completedTasks++;
      });
    }
  });

  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Render stats and progress bar
  let weightsInfoHtml = "";
  for (let sub in program.dailyHoursAllocation) {
    const qCount = soruDagilimi[sub];
    const hours = program.dailyHoursAllocation[sub];
    weightsInfoHtml += `
      <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border); padding: 0.5rem; border-radius: 8px; font-size: 0.85rem; text-align: center;">
        <strong>${sub}</strong><br>
        Soru: ${qCount} (%${((qCount / toplamSoru) * 100).toFixed(0)})<br>
        Hedef: <span style="color: #a5b4fc;">${formatHours(hours)}</span>
      </div>
    `;
  }

  statsContainer.innerHTML = `
    <h4>📊 Sınav Gününe Kadar Soru Dağılımlı Program Analizi</h4>
    <p style="margin-bottom: 0.75rem; font-size: 0.9rem; color: var(--text-secondary);">
      Günlük hedefiniz olan <strong>${formatHours(program.hoursPerDay)}</strong>, sınav ağırlıklarına göre derslere paylaştırıldı. Sınav gününe kadar toplam <strong>${program.weeksCount} haftalık</strong> program oluşturulmuştur.
    </p>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 0.5rem; margin-bottom: 1rem;">
      ${weightsInfoHtml}
    </div>
    
    <div style="margin-top: 1rem;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem; font-size: 0.9rem; font-weight: 500;">
        <span>Genel Program İlerlemesi</span>
        <span>%${progressPercent} (${completedTasks}/${totalTasks} Konu)</span>
      </div>
      <div style="width: 100%; height: 10px; background: rgba(255,255,255,0.1); border-radius: 5px; overflow: hidden;">
        <div id="overall-progress-bar" style="width: ${progressPercent}%; height: 100%; background: linear-gradient(90deg, #10b981 0%, #34d399 100%); transition: width 0.3s;"></div>
      </div>
    </div>
  `;

  // Render each week as a collapsible section (Accordion)
  program.weeks.forEach((w, wIdx) => {
    const weekAccordion = document.createElement("div");
    weekAccordion.className = "week-accordion";
    weekAccordion.style.background = "rgba(255, 255, 255, 0.02)";
    weekAccordion.style.border = "1px solid var(--glass-border)";
    weekAccordion.style.borderRadius = "12px";
    weekAccordion.style.marginBottom = "1rem";
    weekAccordion.style.overflow = "hidden";

    // Accordion Header
    const accHeader = document.createElement("div");
    accHeader.style.padding = "1rem 1.5rem";
    accHeader.style.background = "rgba(255, 255, 255, 0.04)";
    accHeader.style.cursor = "pointer";
    accHeader.style.display = "flex";
    accHeader.style.justifyContent = "space-between";
    accHeader.style.alignItems = "center";
    accHeader.style.userSelect = "none";
    
    // Calculate week completion rate
    let weekTotal = 0;
    let weekCompleted = 0;
    for (let day in w.days) {
      w.days[day].forEach(t => {
        weekTotal++;
        if (t.completed) weekCompleted++;
      });
    }
    const weekProgress = weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0;

    accHeader.innerHTML = `
      <div>
        <strong style="color: #fff; font-size: 1.05rem;">${wIdx + 1}. Hafta</strong>
        <span style="font-size: 0.85rem; color: var(--text-secondary); margin-left: 0.5rem;">(${w.dateRange})</span>
      </div>
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <span style="font-size: 0.8rem; background: ${weekProgress === 100 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(99, 102, 241, 0.1)'}; color: ${weekProgress === 100 ? '#34d399' : '#a5b4fc'}; padding: 0.2rem 0.6rem; border-radius: 20px;">
          %${weekProgress} Tamamlandı
        </span>
        <span class="acc-chevron" style="transition: transform 0.2s;">▼</span>
      </div>
    `;

    // Accordion Body
    const accBody = document.createElement("div");
    accBody.style.padding = "1rem 1.5rem";
    accBody.style.display = "none"; // collapsed by default
    accBody.style.borderTop = "1px solid var(--glass-border)";

    // Let's expand the first week by default
    if (wIdx === 0) {
      accBody.style.display = "block";
      accHeader.querySelector(".acc-chevron").style.transform = "rotate(180deg)";
    }

    accHeader.onclick = () => {
      const isCollapsed = accBody.style.display === "none";
      accBody.style.display = isCollapsed ? "block" : "none";
      accHeader.querySelector(".acc-chevron").style.transform = isCollapsed ? "rotate(180deg)" : "rotate(0deg)";
    };

    // Render days inside the week body
    program.selectedDays.forEach(day => {
      const dayHeader = document.createElement("div");
      dayHeader.style.fontSize = "0.95rem";
      dayHeader.style.fontWeight = "600";
      dayHeader.style.color = "#a5b4fc";
      dayHeader.style.marginTop = "0.75rem";
      dayHeader.style.marginBottom = "0.5rem";
      dayHeader.innerHTML = `📅 ${day} <span style="font-size: 0.8rem; font-weight: normal; color: var(--text-secondary);">(${formatHours(program.hoursPerDay)})</span>`;
      accBody.appendChild(dayHeader);

      const list = document.createElement("ul");
      list.className = "day-card-topics";
      list.style.listStyle = "none";
      list.style.padding = "0";

      const dayTopics = w.days[day] || [];
      dayTopics.forEach((t, idx) => {
        const item = document.createElement("li");
        item.className = "day-card-topic-item";
        item.style.display = "flex";
        item.style.justifyContent = "space-between";
        item.style.alignItems = "center";
        item.style.padding = "0.5rem 0.75rem";
        item.style.background = t.isRevision ? "rgba(255,255,255,0.01)" : "rgba(0,0,0,0.15)";
        item.style.borderLeft = t.isRevision ? "3px solid var(--text-secondary)" : "3px solid var(--primary)";
        item.style.borderRadius = "6px";
        item.style.marginBottom = "0.4rem";

        const leftDiv = document.createElement("div");
        leftDiv.style.display = "flex";
        leftDiv.style.alignItems = "center";
        leftDiv.style.gap = "0.5rem";

        const badge = document.createElement("span");
        badge.style.fontSize = "0.75rem";
        badge.style.padding = "0.1rem 0.4rem";
        badge.style.borderRadius = "4px";
        badge.style.background = "rgba(99, 102, 241, 0.2)";
        badge.style.color = "#a5b4fc";
        badge.textContent = formatHours(t.hours);

        const textSpan = document.createElement("span");
        textSpan.innerHTML = `<strong style="color: #e2e8f0;">[${t.subject}]</strong> ${t.topicName}`;
        if (t.completed) {
          textSpan.className = "completed-strike";
          badge.style.textDecoration = "line-through";
          badge.style.opacity = "0.5";
        }

        leftDiv.appendChild(badge);
        leftDiv.appendChild(textSpan);

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = t.completed;
        checkbox.style.width = "18px";
        checkbox.style.height = "18px";
        checkbox.style.cursor = "pointer";
        checkbox.onchange = () => {
          t.completed = checkbox.checked;
          if (checkbox.checked) {
            textSpan.className = "completed-strike";
            badge.style.textDecoration = "line-through";
            badge.style.opacity = "0.5";
          } else {
            textSpan.className = "";
            badge.style.textDecoration = "none";
            badge.style.opacity = "1";
          }
          
          // Update week progress UI live
          let newTotal = 0;
          let newCompleted = 0;
          for (let d in w.days) {
            w.days[d].forEach(task => {
              newTotal++;
              if (task.completed) newCompleted++;
            });
          }
          const newProgress = newTotal > 0 ? Math.round((newCompleted / newTotal) * 100) : 0;
          const rateBadge = accHeader.querySelector("span[style*='background']");
          if (rateBadge) {
            rateBadge.textContent = `%${newProgress} Tamamlandı`;
            rateBadge.style.background = newProgress === 100 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(99, 102, 241, 0.1)';
            rateBadge.style.color = newProgress === 100 ? '#34d399' : '#a5b4fc';
          }

          // Update overall progress bar
          let allTotal = 0;
          let allCompleted = 0;
          program.weeks.forEach(wk => {
            for (let d in wk.days) {
              wk.days[d].forEach(task => {
                allTotal++;
                if (task.completed) allCompleted++;
              });
            }
          });
          const allPercent = allTotal > 0 ? Math.round((allCompleted / allTotal) * 100) : 0;
          const overallBar = document.getElementById("overall-progress-bar");
          if (overallBar) overallBar.style.width = `${allPercent}%`;
          const overallLabel = statsContainer.querySelector("div[style*='display: flex'] span:last-child");
          if (overallLabel) overallLabel.textContent = `%${allPercent} (${allCompleted}/${allTotal} Konu)`;

          saveProgramToStorage(program);
        };

        item.appendChild(leftDiv);
        item.appendChild(checkbox);
        list.appendChild(item);
      });

      accBody.appendChild(list);
    });

    weekAccordion.appendChild(accHeader);
    weekAccordion.appendChild(accBody);
    container.appendChild(weekAccordion);
  });

  window.currentProgram = program;
}

window.saveProgram = function() {
  if (window.currentProgram) {
    saveProgramToStorage(window.currentProgram);
    alert("Ders programınız başarıyla kaydedildi!");
  }
};

function saveProgramToStorage(program) {
  localStorage.setItem("saved_weekly_program", JSON.stringify(program));
}

function loadSavedProgram() {
  const saved = localStorage.getItem("saved_weekly_program");
  if (saved) {
    const program = JSON.parse(saved);
    window.currentProgram = program;
    
    const hrInput = document.getElementById("hours-per-day");
    if (hrInput) {
      hrInput.value = program.hoursPerDay;
    }
    
    selectedDays = program.selectedDays || [];
    const dayButtons = document.querySelectorAll(".day-btn");
    dayButtons.forEach(btn => {
      if (selectedDays.includes(btn.dataset.day)) {
        btn.classList.add("selected");
      } else {
        btn.classList.remove("selected");
      }
    });

    renderProgramUI(program);
  }
}

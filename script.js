const USERS_KEY = "users";
const CURRENT_USER = "currentUser";
const SORULAR_KEY = "sorular";

// Form Değiştirici
function switchForm(type) {
  const userCard = document.getElementById("user-login-card");
  const adminCard = document.getElementById("admin-login-card");
  if (type === 'admin') {
    userCard.style.display = "none";
    adminCard.style.display = "block";
  } else {
    userCard.style.display = "block";
    adminCard.style.display = "none";
  }
  const err = document.getElementById("error");
  const aerr = document.getElementById("admin-error");
  if (err) err.innerText = "";
  if (aerr) aerr.innerText = "";
}

// Giriş (Kullanıcı)
function login() {
  const username = document.getElementById("username").value.trim();
  const users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];

  if (username === "kpss" || username === "admin") {
    document.getElementById("error").innerText = "Bu kullanıcı adı rezerve edilmiştir. Lütfen Yönetici Girişini kullanın.";
    return;
  }

  if (users.includes(username)) {
    localStorage.setItem(CURRENT_USER, username);
    window.location.href = "home.html";
  } else {
    document.getElementById("error").innerText = "Kullanıcı bulunamadı.";
  }
}

// Giriş (Admin/Yönetici)
function adminLogin() {
  const username = document.getElementById("admin-username").value.trim();
  const password = document.getElementById("admin-password").value.trim();

  if (username === "kpss" && password === "2026!") {
    localStorage.setItem(CURRENT_USER, "admin");
    window.location.href = "admin.html";
  } else {
    document.getElementById("admin-error").innerText = "Hatalı yönetici adı veya şifre.";
  }
}

// Kayıt
function register() {
  const username = prompt("Yeni kullanıcı adı girin:");
  if (!username) return;
  
  const trimmed = username.trim();
  if (trimmed === "kpss" || trimmed === "admin") {
    alert("Bu kullanıcı adı rezerve edilmiştir!");
    return;
  }

  const users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];

  if (users.length >= 5) {
    alert("En fazla 5 kullanıcı olabilir!");
    return;
  }

  if (trimmed && !users.includes(trimmed)) {
    users.push(trimmed);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    localStorage.setItem(CURRENT_USER, trimmed);
    window.location.href = "home.html";
  }
}

// Sayfa geçişi
function goTo(page) {
  window.location.href = page;
}

// Çıkış
function logout() {
  localStorage.removeItem(CURRENT_USER);
  window.location.href = "index.html";
}

// Dersler ve ilerleme (dersler.html)
if (location.pathname.includes("dersler.html")) {
  const container = document.getElementById("ders-container");
  let tamamlanan = 0, toplam = 0;

  for (let ders in dersler) {
    const title = document.createElement("h3");
    title.textContent = ders;
    container.appendChild(title);

    dersler[ders].forEach(konu => {
      const id = ders + "_" + konu;
      const checked = localStorage.getItem(id) === "true";
      if (checked) tamamlanan++;
      toplam++;

      const label = document.createElement("label");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = checked;
      checkbox.onchange = () => {
        localStorage.setItem(id, checkbox.checked);
        location.reload();
      };

      label.appendChild(checkbox);
      label.append(" " + konu);
      container.appendChild(label);
    });
  }

  const percent = Math.round((tamamlanan / toplam) * 100);
  const ctx = document.getElementById("progressChart").getContext("2d");
  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Tamamlandı", "Kalan"],
      datasets: [{
        data: [tamamlanan, toplam - tamamlanan],
        backgroundColor: ["#28a745", "#ccc"]
      }]
    }
  });
}

// Soru yükleme ve yorumlama (sorular.html)
function loadAndMigrateSorular() {
  const raw = JSON.parse(localStorage.getItem(SORULAR_KEY)) || [];
  let migrated = false;
  const sorular = raw.map((item, idx) => {
    if (typeof item === "string" || !item.src) {
      migrated = true;
      return {
        id: "q_" + Date.now() + "_" + Math.floor(Math.random() * 1000) + "_" + idx,
        src: typeof item === "string" ? item : (item.src || ""),
        uploader: (item && item.uploader) ? item.uploader : "Anonim",
        uploadedAt: (item && item.uploadedAt) ? item.uploadedAt : new Date().toISOString(),
        comments: (item && item.comments) ? item.comments : []
      };
    }
    return item;
  });
  if (migrated) {
    localStorage.setItem(SORULAR_KEY, JSON.stringify(sorular));
  }
  return sorular;
}

function saveSorular(sorular) {
  localStorage.setItem(SORULAR_KEY, JSON.stringify(sorular));
}

if (location.pathname.includes("sorular.html")) {
  const container = document.getElementById("sorular-listesi");
  const sorular = loadAndMigrateSorular();
  const currentUser = localStorage.getItem(CURRENT_USER) || "Misafir";

  if (container) {
    container.innerHTML = "";
    
    if (sorular.length === 0) {
      container.innerHTML = "<p style='color: var(--text-secondary); text-align: center;'>Henüz soru yüklenmemiş.</p>";
    }

    sorular.forEach(q => {
      const card = document.createElement("div");
      card.className = "question-card";

      // Soru Resmi
      const img = document.createElement("img");
      img.src = q.src;
      card.appendChild(img);

      // Yükleyen Bilgisi
      const info = document.createElement("div");
      info.className = "question-info";
      const dateStr = new Date(q.uploadedAt).toLocaleDateString("tr-TR", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
      info.innerHTML = `
        <span>👤 Yükleyen: <strong>${q.uploader}</strong></span>
        <span>📅 ${dateStr}</span>
      `;
      card.appendChild(info);

      // Yorumlar Bölümü
      const commentsSec = document.createElement("div");
      commentsSec.className = "comments-section";
      
      const commentsTitle = document.createElement("div");
      commentsTitle.className = "comments-title";
      commentsTitle.innerHTML = `💬 Yorumlar (${q.comments.length})`;
      commentsSec.appendChild(commentsTitle);

      const commentsList = document.createElement("ul");
      commentsList.className = "comments-list";

      if (q.comments.length === 0) {
        const emptyComment = document.createElement("li");
        emptyComment.style.color = "var(--text-secondary)";
        emptyComment.style.fontSize = "0.85rem";
        emptyComment.style.listStyle = "none";
        emptyComment.textContent = "Henüz yorum yapılmamış. İlk yorumu sen yap!";
        commentsList.appendChild(emptyComment);
      } else {
        q.comments.forEach(c => {
          const cItem = document.createElement("li");
          cItem.className = "comment-item";
          
          const cHeader = document.createElement("div");
          cHeader.className = "comment-header";
          const cDate = new Date(c.createdAt).toLocaleDateString("tr-TR", { hour: '2-digit', minute: '2-digit' });
          
          const isSenderAdmin = c.sender === "admin";
          cHeader.innerHTML = `
            <span class="comment-sender ${isSenderAdmin ? 'admin-sender' : ''}">${c.sender} ${isSenderAdmin ? '(Admin)' : ''}</span>
            <span class="comment-date">${cDate}</span>
          `;
          cItem.appendChild(cHeader);

          const cTextRow = document.createElement("div");
          cTextRow.className = "comment-text-row";
          
          const cText = document.createElement("span");
          cText.className = "comment-text";
          cText.textContent = c.text;
          cTextRow.appendChild(cText);

          // Kullanıcı kendi yorumunu, admin ise her yorumu silebilir
          if (currentUser === "admin" || c.sender === currentUser) {
            const delBtn = document.createElement("button");
            delBtn.className = "comment-delete-btn";
            delBtn.textContent = "Sil";
            delBtn.onclick = () => {
              if (confirm("Yorumu silmek istediğinize emin misiniz?")) {
                q.comments = q.comments.filter(comment => comment.id !== c.id);
                saveSorular(sorular);
                location.reload();
              }
            };
            cTextRow.appendChild(delBtn);
          }

          cItem.appendChild(cTextRow);
          commentsList.appendChild(cItem);
        });
      }
      commentsSec.appendChild(commentsList);

      // Yorum Giriş Alanı
      const inputRow = document.createElement("div");
      inputRow.className = "comment-input-row";

      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = "Yorum yazın...";
      
      const sendBtn = document.createElement("button");
      sendBtn.textContent = "Gönder";
      sendBtn.onclick = () => {
        const text = input.value.trim();
        if (!text) return;
        
        const newComment = {
          id: "c_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
          sender: currentUser,
          text: text,
          createdAt: new Date().toISOString()
        };

        q.comments.push(newComment);
        saveSorular(sorular);
        location.reload();
      };

      inputRow.appendChild(input);
      inputRow.appendChild(sendBtn);
      commentsSec.appendChild(inputRow);

      card.appendChild(commentsSec);
      container.appendChild(card);
    });
  }
}

function uploadImage(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const sorular = loadAndMigrateSorular();
    const currentUser = localStorage.getItem(CURRENT_USER) || "Anonim";
    
    const newQuestion = {
      id: "q_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      src: reader.result,
      uploader: currentUser,
      uploadedAt: new Date().toISOString(),
      comments: []
    };
    
    sorular.push(newQuestion);
    saveSorular(sorular);
    location.reload();
  };
  reader.readAsDataURL(file);
}

// Geri sayım sayacı
if (document.getElementById("countdown-days")) {
  const examDate = new Date("2026-10-25T10:15:00");
  
  function updateTimer() {
    const now = new Date();
    const diff = examDate - now;

    if (diff <= 0) {
      const cardTitle = document.querySelector(".countdown-card h3");
      if (cardTitle) cardTitle.innerText = "Sınav Günü Geldi!";
      const cardTimer = document.querySelector(".countdown-timer");
      if (cardTimer) cardTimer.style.display = "none";
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const dEl = document.getElementById("countdown-days");
    const hEl = document.getElementById("countdown-hours");
    const mEl = document.getElementById("countdown-minutes");
    const sEl = document.getElementById("countdown-seconds");

    if (dEl) dEl.innerText = String(days).padStart(2, '0');
    if (hEl) hEl.innerText = String(hours).padStart(2, '0');
    if (mEl) mEl.innerText = String(minutes).padStart(2, '0');
    if (sEl) sEl.innerText = String(seconds).padStart(2, '0');
  }

  updateTimer();
  setInterval(updateTimer, 1000);
}

// Ana sayfada admin panel butonunu yetkiye göre göster/gizle
const adminPanelBtn = document.getElementById("admin-panel-btn");
if (adminPanelBtn) {
  const currentUser = localStorage.getItem(CURRENT_USER);
  if (currentUser !== "admin") {
    adminPanelBtn.style.display = "none";
  }
}


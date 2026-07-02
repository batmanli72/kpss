if (localStorage.getItem("currentUser") !== "admin") {
  alert("Bu sayfaya sadece admin erişebilir.");
  window.location.href = "index.html";
}

const userList = document.getElementById("user-list");
const sorularDiv = document.getElementById("admin-sorular");
const users = JSON.parse(localStorage.getItem("users")) || [];

// Migrate questions data first just in case
const rawSorular = JSON.parse(localStorage.getItem("sorular")) || [];
let migrated = false;
const sorular = rawSorular.map((item, idx) => {
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
  localStorage.setItem("sorular", JSON.stringify(sorular));
}

// User count & list
const userHeading = document.querySelector("section h3");
if (userHeading) {
  userHeading.textContent = `Kayıtlı Kullanıcılar (Toplam: ${users.length})`;
}

if (userList) {
  userList.innerHTML = "";
  users.forEach(user => {
    const li = document.createElement("li");
    li.textContent = user;
    userList.appendChild(li);
  });
}

// Render questions with comments moderation
if (sorularDiv) {
  sorularDiv.innerHTML = "";

  if (sorular.length === 0) {
    sorularDiv.innerHTML = "<p style='color: var(--text-secondary); text-align: center;'>Yüklenen soru bulunmuyor.</p>";
  }

  sorular.forEach(q => {
    const card = document.createElement("div");
    card.className = "question-card";
    card.style.position = "relative";

    // Soruyu Sil butonu
    const delQBtn = document.createElement("button");
    delQBtn.textContent = "Soruyu Sil";
    delQBtn.style.position = "absolute";
    delQBtn.style.top = "10px";
    delQBtn.style.right = "10px";
    delQBtn.style.width = "auto";
    delQBtn.style.padding = "0.4rem 0.8rem";
    delQBtn.style.background = "var(--danger)";
    delQBtn.style.borderRadius = "6px";
    delQBtn.style.fontSize = "0.8rem";
    delQBtn.style.fontWeight = "600";
    delQBtn.style.border = "none";
    delQBtn.style.color = "white";
    delQBtn.style.cursor = "pointer";
    delQBtn.style.boxShadow = "0 4px 6px rgba(239, 68, 68, 0.2)";
    
    delQBtn.onmouseenter = () => {
      delQBtn.style.transform = "scale(1.05)";
      delQBtn.style.background = "var(--danger-hover)";
    };
    delQBtn.onmouseleave = () => {
      delQBtn.style.transform = "none";
      delQBtn.style.background = "var(--danger)";
    };

    delQBtn.onclick = () => {
      if (confirm("Bu soruyu ve tüm yorumlarını silmek istediğinize emin misiniz?")) {
        const updated = sorular.filter(item => item.id !== q.id);
        localStorage.setItem("sorular", JSON.stringify(updated));
        location.reload();
      }
    };
    card.appendChild(delQBtn);

    // Soru Resmi
    const img = document.createElement("img");
    img.src = q.src;
    card.appendChild(img);

    // Bilgi satırı
    const info = document.createElement("div");
    info.className = "question-info";
    const dateStr = new Date(q.uploadedAt).toLocaleDateString("tr-TR", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    info.innerHTML = `
      <span>👤 Yükleyen: <strong>${q.uploader}</strong></span>
      <span>📅 ${dateStr}</span>
    `;
    card.appendChild(info);

    // Yorumlar bölümü
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
      emptyComment.textContent = "Henüz yorum yapılmamış.";
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

        // Admin her yorumu silebilir
        const delBtn = document.createElement("button");
        delBtn.className = "comment-delete-btn";
        delBtn.textContent = "Sil";
        delBtn.onclick = () => {
          if (confirm("Bu yorumu silmek istediğinize emin misiniz?")) {
            q.comments = q.comments.filter(comment => comment.id !== c.id);
            localStorage.setItem("sorular", JSON.stringify(sorular));
            location.reload();
          }
        };
        cTextRow.appendChild(delBtn);

        cItem.appendChild(cTextRow);
        commentsList.appendChild(cItem);
      });
    }
    commentsSec.appendChild(commentsList);

    // Yorum Giriş Alanı (Admin olarak yorum yapma)
    const inputRow = document.createElement("div");
    inputRow.className = "comment-input-row";

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Admin olarak yorum yazın...";
    
    const sendBtn = document.createElement("button");
    sendBtn.textContent = "Gönder";
    sendBtn.onclick = () => {
      const text = input.value.trim();
      if (!text) return;
      
      const newComment = {
        id: "c_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
        sender: "admin",
        text: text,
        createdAt: new Date().toISOString()
      };

      q.comments.push(newComment);
      localStorage.setItem("sorular", JSON.stringify(sorular));
      location.reload();
    };

    inputRow.appendChild(input);
    inputRow.appendChild(sendBtn);
    commentsSec.appendChild(inputRow);

    card.appendChild(commentsSec);
    sorularDiv.appendChild(card);
  });
}

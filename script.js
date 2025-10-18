const USERS_KEY = "users";
const CURRENT_USER = "currentUser";
const SORULAR_KEY = "sorular";

// Giriş
function login() {
  const username = document.getElementById("username").value.trim();
  const users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];

  if (users.includes(username)) {
    localStorage.setItem(CURRENT_USER, username);
    if (username === "admin") {
      window.location.href = "admin.html";
    } else {
      window.location.href = "home.html";
    }
  } else {
    document.getElementById("error").innerText = "Kullanıcı bulunamadı.";
  }
}

// Kayıt
function register() {
  const username = prompt("Yeni kullanıcı adı girin:");
  const users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];

  if (users.length >= 5 && username !== "admin") {
    alert("En fazla 5 kullanıcı olabilir!");
    return;
  }

  if (username && !users.includes(username)) {
    users.push(username);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    localStorage.setItem(CURRENT_USER, username);
    window.location.href = username === "admin" ? "admin.html" : "home.html";
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

// Soru yükleme (sorular.html)
if (location.pathname.includes("sorular.html")) {
  const container = document.getElementById("sorular-listesi");
  const sorular = JSON.parse(localStorage.getItem(SORULAR_KEY)) || [];

  sorular.forEach(base64 => {
    const img = document.createElement("img");
    img.src = base64;
    container.appendChild(img);
  });
}

function uploadImage(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const sorular = JSON.parse(localStorage.getItem(SORULAR_KEY)) || [];
    sorular.push(reader.result);
    localStorage.setItem(SORULAR_KEY, JSON.stringify(sorular));
    location.reload();
  };
  reader.readAsDataURL(file);
}

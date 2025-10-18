if (localStorage.getItem("currentUser") !== "admin") {
  alert("Bu sayfaya sadece admin erişebilir.");
  window.location.href = "index.html";
}

const userList = document.getElementById("user-list");
const sorularDiv = document.getElementById("admin-sorular");
const users = JSON.parse(localStorage.getItem("users")) || [];
const sorular = JSON.parse(localStorage.getItem("sorular")) || [];

users.forEach(user => {
  const li = document.createElement("li");
  li.textContent = user;
  userList.appendChild(li);
});

sorular.forEach((src, index) => {
  const wrapper = document.createElement("div");
  wrapper.style.position = "relative";
  const img = document.createElement("img");
  img.src = src;
  img.style.margin = "10px 0";

  const btn = document.createElement("button");
  btn.textContent = "Sil";
  btn.style.position = "absolute";
  btn.style.top = "5px";
  btn.style.right = "5px";
  btn.onclick = () => {
    sorular.splice(index, 1);
    localStorage.setItem("sorular", JSON.stringify(sorular));
    location.reload();
  };

  wrapper.appendChild(img);
  wrapper.appendChild(btn);
  sorularDiv.appendChild(wrapper);
});

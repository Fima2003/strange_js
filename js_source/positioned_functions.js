var donateBtn = document.getElementById("donate");
var shareBtn = document.getElementById("share");
var nextBtn = document.getElementById("next");

donateBtn.addEventListener('click', () => {
  window.open("https://send.monobank.ua/jar/dzBdJ3737");
});

shareBtn.addEventListener('click', async () => {
  await navigator.clipboard.writeText('https://dr-strange-in-ukraine.onrender.com');
  Toastify({
    text: "link copied to clipboard",
    duration: 3000,
    close: true,
    gravity: "bottom",
    position: "center",
    style: {
      background: "linear-gradient(to right, #4F86C6, #BFAB25)",
      cursor: "default",
    },
  }).showToast();
});

nextBtn.addEventListener('click', () => {
  location.reload();
});